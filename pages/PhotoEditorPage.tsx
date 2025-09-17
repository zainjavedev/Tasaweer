import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, UploadIcon, MagicWandIcon, SwapIcon } from '../components/Icon';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { addUserImage } from '../utils/userImages';
import { AspectRatioSelector, AspectRatio } from '@/components/AspectRatioSelector';
import { compressImageFile } from '@/utils/image';
import { useUser } from '@/utils/useUser';
import Lightbox from '@/components/Lightbox';
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
  const [aspectRatio, setAspectRatio] = useState<string>('16:9'); // Default to Landscape
  const maxRefImages = 3;
  const searchParams = useSearchParams();
  const loadedFromQueryRef = useRef(false);
  const { refreshUserData } = useUser();

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
  }, [originalImage, prompt, originalPreview, refImages, refreshUserData]);

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
        videoRef.current.style.display = 'block';
        await videoRef.current.play();
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

  return (
    <div className="max-w-4xl mx-auto bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] overflow-hidden p-6 md:p-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-black">Photo Editor</h2>
        <p className="text-black">Upload a photo and describe the changes you want.</p>
      </div>

      {/* Image Canvas */}
      <div className="space-y-4">
        <div className="aspect-video w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 relative">
          {originalPreview ? (
            <img src={originalPreview} alt="Original" className="w-full h-full object-contain" />
          ) : showCamera ? (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover absolute inset-0 z-10"
              style={{ transform: 'none', display: 'block' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {camError ? (
                <div className="text-center">
                  <CameraIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{camError}</p>
                </div>
              ) : (
                <div className="text-center">
                  <UploadIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload or capture a photo</p>
                </div>
              )}
            </div>
          )}

          {/* Camera overlay controls */}
          {showCamera && !camError && (
            <>
              <div className="absolute inset-0 pointer-events-none" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button
                  onClick={capturePhoto}
                  disabled={camLoading}
                  className="w-16 h-16 rounded-full bg-white border-4 border-black flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CameraIcon className="w-8 h-8 text-black" />
                </button>
              </div>
            </>
          )}

          {/* Image overlay controls */}
          {originalPreview && !showCamera && (
            <button
              onClick={() => {
                setOriginalImage(null);
                setOriginalPreview(null);
              }}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-2 border hover:bg-white"
              title="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black">
                <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd"/>
              </svg>
            </button>
          )}

          {/* Loading overlay */}
          {(camLoading || isLoading) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">{camLoading ? 'Opening camera...' : 'Processing...'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Image controls */}
        <div className="flex justify-center gap-2 flex-wrap">
          <label className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center cursor-pointer" title="Upload Image">
            <UploadIcon className="w-5 h-5 text-black" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
          </label>

          {showCamera ? (
            <button
              onClick={closeCamera}
              className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center text-lg"
              title="Close Camera"
            >
              ✕
            </button>
          ) : (
            <button
              onClick={() => startStream()}
              className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
              title="Open Camera"
            >
              <CameraIcon className="w-5 h-5 text-black" />
            </button>
          )}

          {showCamera && videoDevices.length > 1 && (
            <select
              className="px-3 py-2 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 text-sm"
              value={selectedDeviceId || ''}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedDeviceId(id);
                startStream({ deviceId: id });
              }}
            >
              {videoDevices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {showCamera && (
            <button
              onClick={flipCamera}
              disabled={camLoading}
              className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Flip Camera"
            >
              <SwapIcon className="w-5 h-5 text-black" />
            </button>
          )}
        </div>
      </div>

      {/* Optional reference images */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-black">Reference images (optional)</label>
          <span className="text-xs text-black">{refImages.length}/{maxRefImages}</span>
        </div>
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          {refPreviews.map((p, idx) => (
            <div key={idx} className="relative h-20 rounded overflow-hidden border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`ref ${idx + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeRefAt(idx)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 border" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black"><path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
              </button>
            </div>
          ))}
          {refImages.length < maxRefImages && (
            <label className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-gray-400 text-xs text-black cursor-pointer hover:border-black">
              Add
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addRefFiles(e.target.files)} />
            </label>
          )}
        </div>
        <p className="text-xs text-black/60">These images guide the style/composition of the edit.</p>
      </div>

      {photoEditingSamples.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-black">Try a sample image (optional)</div>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {photoEditingSamples.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOriginalFromUrl(url)}
                className="group relative rounded-lg overflow-hidden border bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-black/30"
                title="Use this sample image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Sample ${idx + 1}`} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
          <p className="text-xs text-black/60">Selecting a sample simply fills the input image. You can still upload your own.</p>
        </div>
      )}

      {/* Preset Chips */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-black">Quick Tasks</div>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPrompt(preset.prompt)}
              className="px-3 py-2 rounded-full border-2 border-black bg-white/60 text-black font-medium text-sm hover:bg-black/10 hover:scale-105 transition-all duration-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-black/70">Click a chip to quickly set a common task, or describe your own edit below.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-black">Describe the edit</label>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g., Remove blemishes and brighten the photo"
          className="w-full p-3 bg-white/40 border border-gray-300 rounded-md shadow-sm focus:ring-black/30 focus:border-black text-gray-900"
        />
      </div>

      <AspectRatioSelector
        selectedRatio={aspectRatio}
        onSelect={(ratio: AspectRatio) => setAspectRatio(ratio.value)}
      />

      <div className="flex justify-center gap-3 pt-1">
        <button
          onClick={() => setPrompt('')}
          disabled={!prompt.trim()}
          className="px-4 py-2 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!originalImage || isLoading}
          className={`px-6 py-3 rounded-lg bg-black text-white font-bold hover:bg-gray-800 transition-all duration-200 inline-flex items-center gap-3 ${!originalImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <MagicWandIcon className="w-5 h-5" />
          {isLoading ? 'Editing…' : 'Apply Edits'}
        </button>
      </div>

      {error && <div className="text-center text-red-600 bg-red-50/80 p-3 rounded-md">{error}</div>}
      {isLoading && <div className="max-w-md mx-auto"><EtaTimer seconds={14} label="Usually 10–20s" /></div>}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-black">Results (latest first)</div>
            <label className="text-xs flex items-center gap-2 text-black">
              <input type="checkbox" checked={showEditButtons} onChange={(e) => setShowEditButtons(e.target.checked)} /> Show "Edit" buttons
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((url, idx) => (
              <div key={idx} className="relative bg-white/40 rounded-xl overflow-hidden border-2 border-white/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img onClick={() => setLightbox(url)} loading="lazy" src={url} alt={`Edited ${idx + 1}`} className="cursor-zoom-in w-full h-auto object-contain max-h-80" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => download(url, `photo-edit-${idx + 1}.png`)}
                    className="p-2 rounded-full bg-white/90 border shadow"
                    aria-label="Download"
                    title="Download"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
                      <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                      <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                    </svg>
                  </button>
                  {showEditButtons && (
                    <>
                      <button
                        onClick={() => setOriginalFromUrl(url)}
                        className="px-3 py-1.5 rounded bg-white/90 border shadow text-xs font-semibold text-black"
                        title="Use as source image"
                      >
                        Source
                      </button>
                      <button
                        onClick={() => addRefFromUrl(url)}
                        className="px-3 py-1.5 rounded bg-white/90 border shadow text-xs font-semibold text-black"
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
