import React, { useState, useCallback } from 'react';
import { generateImageFromText } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { SparklesIcon } from '../components/Icon';
import Lightbox from '@/components/Lightbox';
import { textToImageSamples } from '@/lib/samples';
import { compressImageFile } from '@/utils/image';
import { useRouter } from 'next/navigation';

const TextToImagePage: React.FC = () => {
  const [prompt, setPrompt] = useState('A cozy coffee shop at sunset with warm lighting, cinematic style');
  const [results, setResults] = useState<EditedImageResult[]>([]); // newest first
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const maxRefImages = 3;
  const router = useRouter();

  const addRefFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!incoming.length) return;
    const space = Math.max(0, maxRefImages - refImages.length);
    const take = incoming.slice(0, space);
    if (!take.length) return;
    setRefImages(prev => [...prev, ...take]);
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

  const addRefFromUrl = useCallback(async (url: string) => {
    if (refImages.length >= maxRefImages) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], `ref-${Date.now()}.webp`, { type: blob.type || 'image/webp' });
    setRefImages(prev => [...prev, file]);
    setRefPreviews(prev => [...prev, url]);
  }, [refImages.length]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please write a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    // do not clear previous results; we'll prepend new one
    try {
      let additionalImages: { data: string; mimeType: string }[] | undefined;
      if (refImages.length) {
        const pairs = await Promise.all(refImages.map(async (f) => {
          const { blob, dataUrl } = await compressImageFile(f, { maxDim: 1400, type: 'image/webp', quality: 0.85 });
          const data = (dataUrl.split(',')[1] || '');
          return { data, mimeType: blob.type || f.type || 'image/webp' };
        }));
        additionalImages = pairs;
      }
      const generated = await generateImageFromText(prompt.trim(), additionalImages);
      setResults((arr) => [generated, ...arr]);
      try {
        addUserImage({ kind: 'text2image', prompt: prompt.trim(), generated: generated.imageUrl });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const download = useCallback((url: string, name = 'generated-image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Text → Image</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Describe the scene and generate an image with AI.</p>
      </div>

      <div>
        <label htmlFor="t2i" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
        <textarea id="t2i" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          placeholder="Describe what you want to see" />
      </div>

      {textToImageSamples.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sample prompts (optional)</div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {textToImageSamples.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(s.prompt)}
                className="group relative rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-900 text-left hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
                title="Use this sample prompt"
              >
                {s.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.preview} alt={s.prompt} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">No preview</div>
                )}
                <div className="p-2 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{s.prompt}</div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Click a sample to fill the prompt. You can edit it before generating.</p>
        </div>
      )}

      <div className="flex justify-center">
        <button onClick={handleGenerate} disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full max-w-xs px-8 py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800">
          {isLoading ? 'Generating…' : (<><SparklesIcon className="w-5 h-5"/> Generate</>)}
        </button>
      </div>

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
        <p className="text-xs text-gray-500 dark:text-gray-400">These images guide the style/composition of the generation.</p>
      </div>

      {error && <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="space-y-4">
          <Loader />
          <EtaTimer seconds={18} label="Usually ~15–25s for first render" />
          <p className="text-center text-gray-600 dark:text-gray-400">AI is creating your image…</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Results (latest first)</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((res, idx) => (
              <div key={idx} className="relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border">
                <img onClick={() => setLightbox(res.imageUrl)} loading="lazy" src={res.imageUrl} alt={`Generated ${idx + 1}`} className="cursor-zoom-in w-full h-auto object-contain max-h-80" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => download(res.imageUrl, `t2i-${idx + 1}.png`)}
                    className="p-2 rounded-full bg-white/90 dark:bg-gray-800/80 border shadow"
                    aria-label="Download"
                    title="Download"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-200">
                      <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                      <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => addRefFromUrl(res.imageUrl)}
                    className="px-3 py-1.5 rounded bg-white/90 dark:bg-gray-800/80 border shadow text-xs font-semibold"
                    title="Use as reference image"
                  >
                    Ref
                  </button>
                  <button
                    onClick={() => router.push(`/photo-editor?src=${encodeURIComponent(res.imageUrl)}`)}
                    className="px-3 py-1.5 rounded bg-white/90 dark:bg-gray-800/80 border shadow text-xs font-semibold"
                    title="Use as source image in Photo Editor"
                  >
                    Source
                  </button>
                </div>
                {res.text && (
                  <div className="p-2 text-xs text-gray-700 dark:text-gray-300">{res.text}</div>
                )}
              </div>
            ))}
          </div>
          <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
        </div>
      )}
    </div>
  );
};

export default TextToImagePage;
