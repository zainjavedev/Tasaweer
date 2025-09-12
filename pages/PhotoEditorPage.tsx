import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { addUserImage } from '../utils/userImages';
import { compressImageFile } from '@/utils/image';
import Lightbox from '@/components/Lightbox';
import CaptureWidget from '@/components/CaptureWidget';
import { photoEditingSamples } from '@/lib/samples';
import { useSearchParams } from 'next/navigation';

const PhotoEditorPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Fix lighting, enhance clarity, and make colors pop naturally.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]); // newest first
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showEditButtons, setShowEditButtons] = useState(true);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const maxRefImages = 3;
  const searchParams = useSearchParams();
  const loadedFromQueryRef = useRef(false);

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setError(null);
    const r = new FileReader();
    r.onloadend = () => setOriginalPreview(r.result as string);
    r.readAsDataURL(file);
  }, []);

  const handleCapture = useCallback((file: File, preview: string) => {
    setOriginalImage(file);
    setOriginalPreview(preview);
    setError(null);
  }, []);

  const toCompressedBase64 = async (file: File) => {
    // Downscale large mobile photos to reduce payload; output WebP for efficiency
    const { blob } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.85 });
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return { base64, mimeType: blob.type };
  };

  const addRefFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!incoming.length) return;
    const space = Math.max(0, maxRefImages - refImages.length);
    const take = incoming.slice(0, space);
    if (!take.length) return;
    setRefImages(prev => [...prev, ...take]);
    // previews
    take.forEach((f) => {
      const r = new FileReader();
      r.onloadend = () => setRefPreviews(prev => [...prev, r.result as string]);
      r.readAsDataURL(f);
    });
  }, [refImages.length]);

  const removeRefAt = useCallback((idx: number) => {
    setRefImages(prev => prev.filter((_, i) => i !== idx));
    setRefPreviews(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!originalImage) { setError('Please upload a photo.'); return; }
    if (!prompt.trim()) { setError('Please describe the edit.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await toCompressedBase64(originalImage);
      let additionalImages: { data: string; mimeType: string }[] | undefined;
      if (refImages.length) {
        const pairs = await Promise.all(refImages.map(async (f) => {
          const { blob, dataUrl } = await compressImageFile(f, { maxDim: 1400, type: 'image/webp', quality: 0.85 });
          const data = (dataUrl.split(',')[1] || '');
          return { data, mimeType: blob.type || f.type || 'image/webp' };
        }));
        additionalImages = pairs;
      }
      const result = await editImageWithNanoBanana(base64, mimeType, prompt.trim(), additionalImages);
      setResults((arr) => [result.imageUrl, ...arr]);
      try { addUserImage({ kind: 'edit', prompt: prompt.trim(), original: originalPreview || undefined, generated: result.imageUrl }); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to edit photo.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, originalPreview, refImages]);

  const download = (url: string, name = 'edited-photo.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const setOriginalFromUrl = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], 'edited-as-input.webp', { type: blob.type || 'image/webp' });
    setOriginalImage(file);
    setOriginalPreview(url);
  };

  const addRefFromUrl = async (url: string) => {
    if (refImages.length >= maxRefImages) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], `ref-${Date.now()}.webp`, { type: blob.type || 'image/webp' });
    setRefImages(prev => [...prev, file]);
    setRefPreviews(prev => [...prev, url]);
  };

  useEffect(() => {
    const src = searchParams?.get('src');
    if (src && !loadedFromQueryRef.current) {
      loadedFromQueryRef.current = true;
      // best effort, ignore errors
      setOriginalFromUrl(src).catch(() => {});
    }
  }, [searchParams]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Photo Editor</h2>
        <p className="text-gray-600 dark:text-gray-400">Upload a photo and describe the changes you want.</p>
      </div>

      <ImageUploader onImageUpload={handleImageUpload} preview={originalPreview} />
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">or</div>
      <CaptureWidget onCapture={handleCapture} />

      {/* Optional reference images */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference images (optional)</label>
          <span className="text-xs text-gray-500 dark:text-gray-400">{refImages.length}/{maxRefImages}</span>
        </div>
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          {refPreviews.map((p, idx) => (
            <div key={idx} className="relative h-20 rounded overflow-hidden border bg-gray-50 dark:bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`ref ${idx + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeRefAt(idx)} className="absolute top-1 right-1 bg-white/90 dark:bg-gray-800/80 rounded-full p-1 border" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-700 dark:text-gray-200"><path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
              </button>
            </div>
          ))}
          {refImages.length < maxRefImages && (
            <label className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:border-purple-500">
              Add
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addRefFiles(e.target.files)} />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">These images guide the style/composition of the edit.</p>
      </div>

      {photoEditingSamples.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Try a sample image (optional)</div>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {photoEditingSamples.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOriginalFromUrl(url)}
                className="group relative rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-900 hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
                title="Use this sample image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Sample ${idx + 1}`} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Selecting a sample simply fills the input image. You can still upload your own.</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Describe the edit</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g., Remove blemishes and brighten the photo"
          className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="flex justify-center pt-1">
        <button
          onClick={handleSubmit}
          disabled={!originalImage || isLoading}
          className="px-4 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
        >
          {isLoading ? 'Editing…' : 'Apply Edits'}
        </button>
      </div>

      {error && <div className="text-center text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded">{error}</div>}
      {isLoading && <div className="max-w-md mx-auto"><EtaTimer seconds={14} label="Usually 10–20s" /></div>}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Results (latest first)</div>
            <label className="text-xs flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={showEditButtons} onChange={(e) => setShowEditButtons(e.target.checked)} /> Show "Edit" buttons
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((url, idx) => (
              <div key={idx} className="relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img onClick={() => setLightbox(url)} loading="lazy" src={url} alt={`Edited ${idx + 1}`} className="cursor-zoom-in w-full h-auto object-contain max-h-80" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => download(url, `photo-edit-${idx + 1}.png`)}
                    className="p-2 rounded-full bg-white/90 dark:bg-gray-800/80 border shadow"
                    aria-label="Download"
                    title="Download"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-200">
                      <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                      <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                    </svg>
                  </button>
                  {showEditButtons && (
                    <>
                      <button
                        onClick={() => setOriginalFromUrl(url)}
                        className="px-3 py-1.5 rounded bg-white/90 dark:bg-gray-800/80 border shadow text-xs font-semibold"
                        title="Use as source image"
                      >
                        Source
                      </button>
                      <button
                        onClick={() => addRefFromUrl(url)}
                        className="px-3 py-1.5 rounded bg-white/90 dark:bg-gray-800/80 border shadow text-xs font-semibold"
                        title="Use as reference image"
                      >
                        Ref
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
};

export default PhotoEditorPage;
