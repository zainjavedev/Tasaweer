'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, UploadIcon, MagicWandIcon, SwapIcon } from '../components/Icon';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { addUserImage } from '../utils/userImages';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { compressImageFile } from '@/utils/image';
import { useUser } from '@/utils/useUser';
import Lightbox from '@/components/Lightbox';
import { photoEditingSamples } from '@/lib/samples';
import { useRouter, useSearchParams } from 'next/navigation';
import SurfaceCard from '@/components/SurfaceCard';
import { useAuthStatus } from '@/utils/useAuthStatus';

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
  const [aspectRatio, setAspectRatio] = useState<string>('16:9'); // Default to Landscape
  const maxRefImages = 3;
  const searchParams = useSearchParams();
  const router = useRouter();
  const loadedFromQueryRef = useRef(false);
  const { refreshUserData } = useUser();
  const isAuthenticated = useAuthStatus();

  // Preset prompts for common tasks
  const PRESET_PROMPTS = [
    {
      id: 'restore',
      label: 'Image Restoration',
      prompt: 'Restore and enhance this old or damaged photo. Fix scratches, discoloration, and creases. Improve colors and detail while preserving the original character.'
    },
    {
      id: 'clean_bg',
      label: 'Clean Background',
      prompt: 'Remove distracting elements from the background. Focus only on the main subject and create a clean, simple background.'
    },
    {
      id: 'remove_bg',
      label: 'Remove Background',
      prompt: 'Remove the background completely and replace it with a transparent background. Keep only the main subject with no background at all.'
    },
    {
      id: 'enhance',
      label: 'Enhance Quality',
      prompt: 'Enhance image quality, sharpness, and brightness. Fix lighting issues, reduce noise, and improve overall clarity and detail.'
    },
    {
      id: 'portrait',
      label: 'Portrait Retouch',
      prompt: 'Retouch the portrait. Smooth skin imperfections, enhance eyes and facial features, fix hair, and improve overall appearance naturally.'
    },
    {
      id: 'fix_lighting',
      label: 'Fix Lighting',
      prompt: 'Correct the lighting in this photo. Balance exposure, fix shadows and highlights, improve brightness and contrast naturally.'
    }
  ];

  // Camera capture functionality
  const [showCamera, setShowCamera] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (!isAuthenticated) {
      setError("Oops, you'll have to create an account to generate.");
      router.push('/register');
      return;
    }
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
      const result = await editImageWithNanoBanana(base64, mimeType, prompt.trim(), additionalImages, aspectRatio);
      setResults((arr) => [result.imageUrl, ...arr]);
      try {
        addUserImage({ kind: 'edit', prompt: prompt.trim(), original: originalPreview || undefined, generated: result.imageUrl });
        // Refresh user data to update image count in header
        await refreshUserData();
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to edit photo.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, originalPreview, refImages, refreshUserData, isAuthenticated, router, aspectRatio]);

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

  const stopStream = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startStream = useCallback(async (opts?: { deviceId?: string }) => {
    setCamLoading(true);
    setCamError(null);
    stopStream();
    try {
      const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
      const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:');
      if (!isSecure && !isLocalhost) {
        throw new DOMException('Camera access requires HTTPS or localhost', 'SecurityError');
      }
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API not available');
      const constraints: MediaStreamConstraints = { video: {}, audio: false };
      if (opts?.deviceId) {
        (constraints.video as MediaTrackConstraints).deviceId = { exact: opts.deviceId };
      } else {
        (constraints.video as MediaTrackConstraints).facingMode = { ideal: facing } as any;
      }
      let stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err) {
          // Ignore play interruptions that happen when the stream stops while starting
          console.warn('Camera preview play interrupted', err);
        }
      }

      // Populate device list after permission is granted
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vids);
        // Auto-select deviceId matching facing if present, else keep current
        if (!opts?.deviceId && vids.length > 0) {
          const preferBack = vids.find((d) => /back|rear/i.test(d.label));
          const preferFront = vids.find((d) => /front|user/i.test(d.label));
          const preferred = facing === 'environment' ? (preferBack || preferFront || vids[0]) : (preferFront || preferBack || vids[0]);
          setSelectedDeviceId(preferred.deviceId);
        } else if (opts?.deviceId) {
          setSelectedDeviceId(opts.deviceId);
        }
      } catch {}
    } catch (e) {
      const err = e as any;
      setCamError(err?.message || 'Failed to open camera');
    } finally {
      setCamLoading(false);
    }
  }, [facing, showCamera]);

  const flipCamera = useCallback(() => {
    const newFacing = facing === 'user' ? 'environment' : 'user';
    setFacing(newFacing);

    // Clear selected device to allow flipping
    setSelectedDeviceId(null);

    // Force restart camera with new facing mode - debounce to ensure state is updated
    setTimeout(() => {
      if (showCamera) {
        startStream().catch(() => {});
      }
    }, 100);
  }, [facing, startStream, showCamera]);

  // When facing changes and no explicit deviceId chosen, try to restart with facing constraint
  useEffect(() => {
    if (!selectedDeviceId && showCamera) {
      // Debounce a bit to avoid double calls when mounting
      const t = setTimeout(() => startStream().catch(() => {}), 50);
      return () => clearTimeout(t);
    }
  }, [facing, showCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopStream(), []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, outW, outH);
    const url = canvas.toDataURL('image/webp', 0.85);

    // Convert to File object
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-photo.webp', { type: 'image/webp' });
        handleImageUpload(file);
        setShowCamera(false);
        stopStream();
      }
    }, 'image/webp', 0.85);
  }, []);

  const closeCamera = () => {
    setShowCamera(false);
    stopStream();
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopStream();
  }, []);

  useEffect(() => {
    const src = searchParams?.get('src');
    if (src && !loadedFromQueryRef.current) {
      loadedFromQueryRef.current = true;
      // best effort, ignore errors
      setOriginalFromUrl(src).catch(() => {});
    }
  }, [searchParams]);

  const latestResult = results[0] ?? null;
  const previousResults = results.slice(1);

  return (
    <SurfaceCard className="max-w-5xl mx-auto overflow-hidden p-6 sm:p-8 space-y-6 sm:space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Photo Editor</h2>
        <p className="text-black/70">Upload a photo and describe the changes you want.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Your photo</span>
              {originalPreview && !showCamera && (
                <button
                  onClick={() => {
                    setOriginalImage(null);
                    setOriginalPreview(null);
                  }}
                  className="text-xs font-semibold text-black/70 hover:text-black"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-black/12 bg-white/85 flex items-center justify-center">
              {showCamera ? (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : originalPreview ? (
                <img src={originalPreview} alt="Original" className="w-full h-full object-contain" />
              ) : (
                <div className="px-4 text-center text-sm text-black/60">
                  {camError ? (
                    <>
                      <CameraIcon className="mx-auto mb-2 h-7 w-7 opacity-60" />
                      <p>{camError}</p>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mx-auto mb-2 h-7 w-7 opacity-60" />
                      <p>Upload or capture a photo to get started.</p>
                    </>
                  )}
                </div>
              )}

              {showCamera && !camError && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    disabled={camLoading}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-black/20 bg-white text-black shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Capture photo"
                  >
                    <CameraIcon className="h-6 w-6" />
                  </button>
                </div>
              )}

              {(camLoading || isLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm">
                  <div className="space-y-1 text-center text-xs text-white">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                    <p>{camLoading ? 'Opening camera…' : 'Processing…'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-10 items-center justify-center rounded-lg border border-black/20 bg-white px-3 text-xs font-semibold text-black transition-colors duration-200 hover:bg-gray-50 cursor-pointer" title="Upload image">
                <UploadIcon className="mr-2 h-4 w-4" /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
              </label>

              <button
                onClick={() => {
                  if (showCamera) {
                    closeCamera();
                  } else {
                    setShowCamera(true);
                    setCamError(null);
                    startStream().catch(() => {});
                  }
                }}
                className="h-10 rounded-lg border border-black/20 bg-white px-3 text-xs font-semibold text-black transition-colors duration-200 hover:bg-gray-50"
              >
                {showCamera ? 'Close camera' : 'Open camera'}
              </button>

              {showCamera && (
                <>
                  <button
                    onClick={flipCamera}
                    disabled={camLoading}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/20 bg-white text-black transition-colors duration-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Flip camera"
                  >
                    <SwapIcon className="w-5 h-5" />
                  </button>
                  {videoDevices.length > 1 && (
                    <select
                      className="h-10 rounded-lg border border-black/20 bg-white px-2 text-xs text-black transition-colors duration-200 hover:bg-gray-50"
                      value={selectedDeviceId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedDeviceId(id);
                        startStream({ deviceId: id }).catch(() => {});
                      }}
                    >
                      {videoDevices.map((d, idx) => (
                        <option key={d.deviceId || idx} value={d.deviceId}>
                          {d.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Reference images (optional)</span>
              <span className="text-xs text-black/70">{refImages.length}/{maxRefImages}</span>
            </div>
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
              {refPreviews.map((p, idx) => (
                <div key={idx} className="relative h-20 overflow-hidden rounded-lg border border-black/12 bg-white">
                  <img src={p} alt={`ref ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeRefAt(idx)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 border"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black"><path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
                  </button>
                </div>
              ))}
              {refImages.length < maxRefImages && (
                <label className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-black/30 text-xs text-black cursor-pointer hover:border-black">
                  Add
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addRefFiles(e.target.files)} />
                </label>
              )}
            </div>
            <p className="text-xs text-black/60">Reference images guide the style or composition of the edit.</p>
          </section>

          {photoEditingSamples.length > 0 && (
            <section className="space-y-2">
              <div className="text-sm font-semibold text-black">Try a sample image</div>
              <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                {photoEditingSamples.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOriginalFromUrl(url)}
                    className="group relative overflow-hidden rounded-lg border border-black/12 bg-white transition-all duration-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-black/20"
                    title="Use this sample image"
                  >
                    <img src={url} alt={`Sample ${idx + 1}`} className="h-20 w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-black/60">Selecting a sample fills the input image—you can still upload your own.</p>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Describe the edit</span>
              {PRESET_PROMPTS.length > 0 && (
                <div className="flex flex-wrap gap-1 text-xs text-black/70">
                  {PRESET_PROMPTS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setPrompt(preset.prompt)}
                      className="rounded-full border border-black/20 bg-white px-2.5 py-1 font-semibold transition-colors duration-200 hover:bg-black hover:text-white"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g., Remove blemishes and brighten the photo"
                className="w-full rounded-md border border-black/12 bg-white/80 p-3 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-black/20 bg-white text-black/60 transition hover:text-black"
                  aria-label="Clear edit description"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </section>

          <AspectRatioSelector selectedRatio={aspectRatio} onSelect={setAspectRatio} />

           <section className="space-y-2">
             <button
               onClick={handleSubmit}
               disabled={isLoading || !originalImage || !prompt.trim()}
               className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-white font-bold transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-black"
               title="Generate an edited version of your photo using AI"
             >
              {isAuthenticated ? (
                isLoading ? 'Generating…' : (
                  <>
                    <MagicWandIcon className="h-5 w-5" />
                    Generate edit
                  </>
                )
              ) : 'Signup to generate'}
              <span aria-hidden className="shine"></span>
            </button>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {isLoading && (
              <div className="space-y-1 text-xs text-black/70">
                <EtaTimer seconds={14} label="Usually 10–20s" />
                <p className="text-center">AI is editing your photo…</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Latest render</span>
              {latestResult && (
                <label className="inline-flex items-center gap-2 text-xs text-black/60">
                  <input type="checkbox" checked={showEditButtons} onChange={(e) => setShowEditButtons(e.target.checked)} />
                  Show extra actions
                </label>
              )}
            </div>
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-black/12 bg-white/85">
              {latestResult ? (
                <button type="button" onClick={() => setLightbox(latestResult)} className="h-full w-full">
                  <img src={latestResult} alt="Latest result" className="h-full w-full object-contain" />
                </button>
              ) : (
                <div className="px-6 text-center text-sm text-black/60">Generate an edit to preview it here.</div>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm">
                  <div className="space-y-1 text-center text-xs text-white">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                    <p>Processing…</p>
                  </div>
                </div>
              )}
            </div>
            {latestResult && (
              <div className="flex flex-wrap gap-2 text-sm text-black/70">
                <button
                  onClick={() => download(latestResult, 'photo-edit-latest.png')}
                  className="rounded-lg border border-black bg-black px-3 py-2 font-semibold text-white transition-colors hover:bg-gray-800"
                  title="Download the latest edited photo as PNG"
                >
                  Download PNG
                </button>
                {showEditButtons && (
                  <>
                    <button
                      onClick={() => setOriginalFromUrl(latestResult)}
                      className="rounded-lg border border-black px-3 py-2 font-semibold text-black transition-colors hover:bg-black hover:text-white"
                      title="Use this edited photo as the new source image"
                    >
                      Use as source
                    </button>
                    <button
                      onClick={() => addRefFromUrl(latestResult)}
                      className="rounded-lg border border-black px-3 py-2 font-semibold text-black transition-colors hover:bg-black hover:text-white"
                      title="Add this edited photo as a reference image"
                    >
                      Add as reference
                    </button>
                  </>
                )}
              </div>
            )}
          </section>

          {previousResults.length > 0 && (
            <section className="space-y-2">
              <div className="text-sm font-semibold text-black">History</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {previousResults.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative overflow-hidden rounded-xl border border-black/12 bg-white/80">
                    <img
                      src={url}
                      alt={`Result ${idx + 2}`}
                      className="h-32 w-full cursor-zoom-in object-contain"
                      onClick={() => setLightbox(url)}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => download(url, `photo-edit-${idx + 2}.png`)}
                        className="rounded-full border border-black/20 bg-white p-2 shadow-sm transition hover:scale-105"
                        aria-label="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black">
                          <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                          <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                        </svg>
                      </button>
                      {showEditButtons && (
                        <>
                          <button
                            onClick={() => setOriginalFromUrl(url)}
                            className="rounded border border-black/20 bg-white px-2 py-1 text-[11px] font-semibold text-black transition hover:bg-black hover:text-white"
                          >
                            Source
                          </button>
                          <button
                            onClick={() => addRefFromUrl(url)}
                            className="rounded border border-black/20 bg-white px-2 py-1 text-[11px] font-semibold text-black transition hover:bg-black hover:text-white"
                          >
                            Ref
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

      </div>

      <Lightbox imageUrl={lightbox} onClose={() => setLightbox(null)} title="Preview" alt="Edited photo preview" />
    </SurfaceCard>
  );
};

export default PhotoEditorPage;
