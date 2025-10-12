'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { generateImageFromText } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { SparklesIcon } from '../components/Icon';
import Lightbox from '@/components/Lightbox';
import SurfaceCard from '@/components/SurfaceCard';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { textToImageSamples } from '@/lib/samples';
import { compressImageFile } from '@/utils/image';
import { useRouter } from 'next/navigation';
import { getUserLimits, canUserGenerate } from '@/utils/userLimits';
import { useAuthStatus } from '@/utils/useAuthStatus';

const TextToImagePage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<EditedImageResult[]>([]); // newest first
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9'); // Default to Landscape
  const maxRefImages = 3;
  const router = useRouter();

  // User Limits state
  const isAuthenticated = useAuthStatus();
  const [canGenerate, setCanGenerate] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setCanGenerate(canUserGenerate());
    } else {
      setCanGenerate(true);
    }
  }, [isAuthenticated]);

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

    if (!isAuthenticated) {
      setError("Oops, you'll have to create an account to generate.");
      router.push('/register');
      return;
    }

    // Check if user can generate images
    if (isAuthenticated && !canGenerate) {
      const limits = getUserLimits();
      setError(`Image generation limit reached. You have generated ${limits?.imageCount} out of ${limits?.imageLimit} images.`);
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
      const generated = await generateImageFromText(prompt.trim(), additionalImages, aspectRatio);
      setResults((arr) => [generated, ...arr]);
      try {
        addUserImage({ kind: 'text2image', prompt: prompt.trim(), generated: generated.imageUrl });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isAuthenticated, canGenerate, refImages, router, aspectRatio]);

  const download = useCallback((url: string, name = 'generated-image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  }, []);

  const latestResult = results[0] ?? null;
  const previousResults = results.slice(1);

  return (
    <SurfaceCard className="max-w-5xl mx-auto overflow-hidden p-6 sm:p-8 space-y-6 sm:space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Text → Image</h2>
        <p className="text-black/70">Describe the scene and generate unique renders.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
        <div className="space-y-6">
          <section className="space-y-2">
            <label htmlFor="t2i" className="block text-sm font-medium text-black">Prompt</label>
            <div className="relative">
              <textarea
                id="t2i"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-md border-2 border-black bg-white p-3 pr-10 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] focus:border-black focus:outline-none focus:ring-black/40"
                placeholder="Describe what you want to see (e.g., Cozy coffee shop at sunset)"
              />
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-black/20 bg-white text-black/60 transition hover:text-black"
                  aria-label="Clear prompt"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </section>

          <AspectRatioSelector selectedRatio={aspectRatio} onSelect={setAspectRatio} />

          {textToImageSamples.length > 0 && (
            <section className="space-y-2">
              <div className="text-sm font-semibold text-black">Sample prompts</div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {textToImageSamples.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s.prompt)}
                    className="group relative overflow-hidden rounded-lg border-2 border-black bg-white text-left transition-all duration-200 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-black"
                    title="Use this sample prompt"
                  >
                    {s.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.preview} alt={s.prompt} className="h-24 w-full object-cover" />
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center text-xs text-black">No preview</div>
                    )}
                    <div className="p-2 text-xs text-black line-clamp-2">{s.prompt}</div>
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-black/60">Tap any sample to populate the prompt—you can tweak it before generating.</p>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="block text-sm font-medium text-black">Reference images (optional)</span>
              <span className="text-xs text-black/60">{refImages.length}/{maxRefImages}</span>
            </div>
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
              {refPreviews.map((p, idx) => (
                <div key={idx} className="relative h-20 rounded overflow-hidden border-2 border-black bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`ref ${idx + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeRefAt(idx)} className="absolute top-1 right-1 rounded-full border-2 border-black bg-white p-1" title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-black">
                      <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {refImages.length < maxRefImages && (
                <label className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-black text-xs text-black cursor-pointer transition-colors hover:bg-black/5">
                  Add
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addRefFiles(e.target.files)} />
                </label>
              )}
            </div>
            <p className="text-xs text-black/60">Reference images guide the style, lighting, or composition.</p>
          </section>

          <section className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isLoading || (isAuthenticated && !canGenerate)}
              className={`btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-white font-bold transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-black ${isAuthenticated && !canGenerate ? 'opacity-50' : ''}`}
            >
              {isAuthenticated ? (
                isLoading ? 'Generating…' : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Generate{isAuthenticated && !canGenerate ? ' (Limited)' : ''}
                  </>
                )
              ) : 'Signup to generate'}
              <span aria-hidden className="shine"></span>
            </button>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            {isLoading && (
              <div className="space-y-2 text-sm text-black/70">
                <Loader />
                <EtaTimer seconds={18} label="Usually ~15–25s for first render" />
                <p className="text-center">AI is creating your image…</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Latest image</span>
              {latestResult && <span className="text-xs text-black/50">Newest result</span>}
            </div>
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white/70">
              {latestResult ? (
                <button type="button" onClick={() => setLightbox(latestResult.imageUrl)} className="h-full w-full">
                  <img loading="lazy" src={latestResult.imageUrl} alt="Latest generated" className="h-full w-full object-contain" />
                </button>
              ) : (
                <div className="px-6 text-center text-sm text-black/60">Generated images will appear here.</div>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="space-y-2 text-center text-sm text-white">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                    <p>Generating…</p>
                  </div>
                </div>
              )}
            </div>
            {latestResult && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => download(latestResult.imageUrl, 'text-to-image-latest.png')} className="rounded-lg border-2 border-black px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white">Download</button>
                <button onClick={() => addRefFromUrl(latestResult.imageUrl)} className="rounded-lg border-2 border-black px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white">Add as reference</button>
                <button onClick={() => router.push(`/photo-editor?src=${encodeURIComponent(latestResult.imageUrl)}`)} className="rounded-lg border-2 border-black px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white">Open in editor</button>
              </div>
            )}
          </section>

          {previousResults.length > 0 && (
            <section className="space-y-3">
              <div className="text-sm font-semibold text-black">Previous images</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {previousResults.map((res, idx) => (
                  <div key={`${res.imageUrl}-${idx}`} className="relative overflow-hidden rounded-lg border-2 border-black bg-white">
                    <img onClick={() => setLightbox(res.imageUrl)} loading="lazy" src={res.imageUrl} alt={`Generated ${idx + 2}`} className="h-40 w-full cursor-zoom-in object-contain" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => download(res.imageUrl, `t2i-${idx + 2}.png`)}
                        className="rounded-full border-2 border-black bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]"
                        aria-label="Download image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black">
                          <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                          <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => addRefFromUrl(res.imageUrl)}
                        className="rounded border-2 border-black bg-white px-2 py-1 text-[11px] font-semibold text-black transition-colors hover:bg-black hover:text-white"
                      >
                        Ref
                      </button>
                      <button
                        onClick={() => router.push(`/photo-editor?src=${encodeURIComponent(res.imageUrl)}`)}
                        className="rounded border-2 border-black bg-white px-2 py-1 text-[11px] font-semibold text-black transition-colors hover:bg-black hover:text-white"
                      >
                        Editor
                      </button>
                    </div>
                    {res.text && <div className="p-2 text-xs text-black">{res.text}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Lightbox imageUrl={lightbox} onClose={() => setLightbox(null)} title="Generated image" alt="Generated image preview" />
    </SurfaceCard>
  );
};

export default TextToImagePage;
