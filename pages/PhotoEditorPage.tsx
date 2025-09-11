import React, { useCallback, useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { addUserImage } from '../utils/userImages';
import { compressImageFile } from '@/utils/image';

const PhotoEditorPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Fix lighting, enhance clarity, and make colors pop naturally.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]); // newest first

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setError(null);
    const r = new FileReader();
    r.onloadend = () => setOriginalPreview(r.result as string);
    r.readAsDataURL(file);
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

  const handleSubmit = useCallback(async () => {
    if (!originalImage) { setError('Please upload a photo.'); return; }
    if (!prompt.trim()) { setError('Please describe the edit.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await toCompressedBase64(originalImage);
      const result = await editImageWithNanoBanana(base64, mimeType, prompt.trim());
      setResults((arr) => [result.imageUrl, ...arr]);
      try { addUserImage({ kind: 'edit', prompt: prompt.trim(), original: originalPreview || undefined, generated: result.imageUrl }); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to edit photo.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, originalPreview]);

  const download = (url: string, name = 'edited-photo.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Photo Editor</h2>
        <p className="text-gray-600 dark:text-gray-400">Upload a photo and describe the changes you want.</p>
      </div>

      <ImageUploader onImageUpload={handleImageUpload} preview={originalPreview} />

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
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Results (latest first)</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((url, idx) => (
              <div key={idx} className="group relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" src={url} alt={`Edited ${idx + 1}`} className="w-full h-auto object-contain max-h-80 transition-transform duration-300 group-hover:scale-[1.01]" />
                <button
                  onClick={() => download(url, `photo-edit-${idx + 1}.png`)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/80 border shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Download"
                  title="Download"
                >
                  {/* Download icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-200">
                    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                    <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditorPage;
