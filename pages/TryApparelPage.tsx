import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, SwapIcon, UploadIcon, ChevronDownIcon } from '../components/Icon';
import { addUserImage } from '../utils/userImages';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { authorizedFetch } from '@/utils/authClient';
import { compressImageFile, dataURLToBase64 } from '@/utils/image';
import Lightbox from '@/components/Lightbox';
import SurfaceCard from '@/components/SurfaceCard';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '@/utils/useAuthStatus';

type ColorOption = string;

const COLOR_OPTIONS: ColorOption[] = ['Red', 'Blue', 'Black', 'White', 'Green', 'Beige', 'Navy', 'Denim', 'Pastel Pink', 'Grey'];
const MAX_REF_IMAGES = 3;

const TryApparelPage: React.FC = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStatus();
  // User capture/upload
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [camLoading, setCamLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null); // data URL

  // Apparel selection (upload + suggestions)
  const [apparelImage, setApparelImage] = useState<string | null>(null); // data URL
  type ApparelSuggestion = { src: string; label?: string };
  const [suggestions, setSuggestions] = useState<ApparelSuggestion[]>([]);
  const [suggLoading, setSuggLoading] = useState(true);
  const [suggError, setSuggError] = useState<string | null>(null);

  // Results / iteration
  const [results, setResults] = useState<string[]>([]); // newest first
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [iterLoading, setIterLoading] = useState(false); // initial try-on
  const [iterError, setIterError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16'); // Default to Portrait for apparel
  const [customColor, setCustomColor] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [colorLoading, setColorLoading] = useState<string | null>(null); // which color button is generating
  const [refImages, setRefImages] = useState<string[]>([]);
  const [isWideForCarousel, setIsWideForCarousel] = useState(false);
  const latestResult = results[0] ?? null;
  const previousResults = results.slice(1);

  const stopStream = (opts: { preserveActive?: boolean } = {}) => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (!opts.preserveActive && videoRef.current) {
      const mediaEl = videoRef.current as HTMLVideoElement & { srcObject?: MediaStream | null };
      if (typeof mediaEl.srcObject !== 'undefined') {
        mediaEl.srcObject = null;
      }
      mediaEl.removeAttribute('src');
      try {
        mediaEl.pause();
      } catch {}
      try {
        mediaEl.load();
      } catch {}
    }
    if (!opts.preserveActive) {
      setCameraActive(false);
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

      const navAny = navigator as any;
      const modernGetUserMedia: typeof navigator.mediaDevices.getUserMedia | undefined = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
      const legacyGetUserMedia: ((constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (err: unknown) => void) => void) | undefined =
        navAny?.webkitGetUserMedia || navAny?.mozGetUserMedia || navAny?.getUserMedia;

      if (!modernGetUserMedia && !legacyGetUserMedia) {
        throw new Error('Camera API not available');
      }

      const baseConstraints: MediaStreamConstraints = { video: {}, audio: false };
      if (opts?.deviceId) {
        (baseConstraints.video as MediaTrackConstraints).deviceId = { exact: opts.deviceId };
      } else {
        (baseConstraints.video as MediaTrackConstraints).facingMode = { ideal: facing } as any;
      }

      const attempts: MediaStreamConstraints[] = [baseConstraints];
      if (!opts?.deviceId) {
        attempts.push({ video: { facingMode: facing }, audio: false });
        attempts.push({ video: true, audio: false });
      }

      let stream: MediaStream | null = null;
      let lastError: unknown;
      for (const candidate of attempts) {
        try {
          stream = modernGetUserMedia
            ? await modernGetUserMedia(candidate)
            : await new Promise<MediaStream>((resolve, reject) => legacyGetUserMedia!(candidate, resolve, reject));
          if (stream) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError || new Error('Unable to start the camera');
      }

      streamRef.current = stream;
      const videoEl = videoRef.current;
      if (videoEl) {
        const mediaEl = videoEl as HTMLVideoElement & { srcObject?: MediaStream };
        if (typeof mediaEl.srcObject !== 'undefined') {
          mediaEl.srcObject = stream;
        } else if (typeof window !== 'undefined') {
          mediaEl.src = window.URL.createObjectURL(stream as any);
        }
        mediaEl.defaultMuted = true;
        mediaEl.muted = true;
        mediaEl.playsInline = true;
        mediaEl.setAttribute('autoplay', 'true');
        mediaEl.setAttribute('muted', '');
        mediaEl.setAttribute('playsinline', 'true');
        mediaEl.setAttribute('webkit-playsinline', 'true');
        mediaEl.removeAttribute('controls');
        try {
          await mediaEl.play();
        } catch (err) {
          console.warn('Camera preview play interrupted', err);
        }
      }
      setCameraActive(true);
      setCamError(null);

      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const vids = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(vids);
          if (!opts?.deviceId && vids.length > 0) {
            const preferBack = vids.find((d) => /back|rear/i.test(d.label));
            const preferFront = vids.find((d) => /front|user/i.test(d.label));
            const preferred = facing === 'environment' ? (preferBack || preferFront || vids[0]) : (preferFront || preferBack || vids[0]);
            if (preferred) {
              setSelectedDeviceId(preferred.deviceId || '');
            }
          } else if (opts?.deviceId) {
            setSelectedDeviceId(opts.deviceId);
          }
        } catch (err) {
          console.warn('Failed to enumerate camera devices', err);
        }
      }
    } catch (e) {
      const err = e as DOMException & { message?: string };
      let friendly = 'Failed to open camera';
      if (err?.name === 'NotAllowedError') {
        friendly = 'Camera access was denied. Please allow camera permissions in your browser settings.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        friendly = 'No compatible camera was found. Try unplugging other apps or switching devices.';
      } else if (err?.name === 'SecurityError') {
        friendly = err.message || 'Camera access requires a secure (HTTPS) connection.';
      } else if (err?.message) {
        friendly = err.message;
      }
      console.error('Unable to start camera', err);
      setCamError(friendly);
      setCameraActive(false);
    } finally {
      setCamLoading(false);
    }
  }, [facing]);

  useEffect(() => () => stopStream(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsWideForCarousel(window.innerWidth >= 768);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const itemsPerView = isWideForCarousel ? 3 : 2;
  const maxCarouselIndex = Math.max(suggestions.length - itemsPerView, 0);
  const showCarousel = isWideForCarousel && suggestions.length > itemsPerView;

  useEffect(() => {
    if (!showCarousel) {
      setCarouselIndex(0);
      return undefined;
    }
    const id = setInterval(() => {
      setCarouselIndex((idx) => (idx >= maxCarouselIndex ? 0 : idx + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [itemsPerView, maxCarouselIndex, showCarousel]);

  useEffect(() => {
    setCarouselIndex((idx) => Math.min(idx, maxCarouselIndex));
  }, [itemsPerView, maxCarouselIndex]);

  useEffect(() => {
    if (!showCarousel) return;
    const container = carouselRef.current;
    if (!container || !suggestions.length) return;
    const firstCard = container.querySelector('button');
    if (!firstCard) return;
    const cardRect = firstCard.getBoundingClientRect();
    let step = cardRect.width;
    if (typeof window !== 'undefined') {
      const gap = parseFloat(getComputedStyle(container).columnGap || '0');
      step += gap;
    }
    if (!Number.isFinite(step) || step <= 0) return;
    container.scrollTo({ left: step * carouselIndex, behavior: 'smooth' });
  }, [carouselIndex, showCarousel, suggestions.length, itemsPerView]);

  const flipCamera = useCallback(() => {
    const newFacing = facing === 'user' ? 'environment' : 'user';
    setFacing(newFacing);

    // Clear selected device to allow flipping
    setSelectedDeviceId(null);
  }, [facing]);

  const prevFacing = useRef(facing);

  // Restart the stream when the facing changes while the camera is active
  useEffect(() => {
    if (!cameraActive) {
      prevFacing.current = facing;
      return;
    }
    if (prevFacing.current === facing) return;
    prevFacing.current = facing;
    startStream().catch(() => {});
  }, [cameraActive, facing, startStream]);

  const captureUser = () => {
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
    setUserImage(url);
    stopStream();
  };

  const onUserUpload = async (file: File) => {
    const { dataUrl } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.85 });
    setUserImage(dataUrl);
  };

  const onApparelUpload = async (file: File) => {
    const { dataUrl } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.85 });
    setApparelImage(dataUrl);
  };

  const extractApparel = useCallback(async () => {
    if (!apparelImage) return;
    if (!isAuthenticated) {
      setIterError("Oops, you'll have to create an account to generate.");
      router.push('/register');
      return;
    }
    setIterError(null);
    setIterLoading(true);
    try {
      const base64 = dataURLToBase64(apparelImage);
      const mime = (apparelImage.split(';')[0].split(':')[1]) || 'image/webp';
      const prompt = 'Extract only the clothes/apparel the person is wearing and return the apparel on a transparent background, tightly cropped.';
      const res = await editImageWithNanoBanana(base64, mime, prompt);
      setApparelImage(res.imageUrl);
      setSuggestions((arr) => [{ src: res.imageUrl, label: 'Extracted' }, ...arr]);
    } catch (e) {
      setIterError(e instanceof Error ? e.message : 'Failed to extract apparel');
    } finally {
      setIterLoading(false);
    }
  }, [apparelImage, isAuthenticated, router]);

  const fetchUrlAsDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch image');
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const rr = new FileReader();
      rr.onloadend = () => resolve(rr.result as string);
      rr.readAsDataURL(blob);
    });
  };

  const setOriginalFromUrl = async (url: string) => {
    try {
      const dataUrl = await fetchUrlAsDataUrl(url);
      setUserImage(dataUrl);
      stopStream();
      setCamError(null);
    } catch {
      alert('Failed to load image as source');
    }
  };

  const addRefFromUrl = async (url: string) => {
    if (refImages.length >= MAX_REF_IMAGES) {
      alert('Reference image limit reached.');
      return;
    }
    try {
      const dataUrl = await fetchUrlAsDataUrl(url);
      setRefImages((prev) => {
        if (prev.length >= MAX_REF_IMAGES) return prev;
        if (prev.includes(dataUrl)) return prev;
        return [...prev, dataUrl];
      });
    } catch {
      alert('Failed to add reference');
    }
  };

  const addRefFiles = async (files: FileList) => {
    if (!files?.length) return;
    const available = Math.max(0, MAX_REF_IMAGES - refImages.length);
    if (available <= 0) {
      alert('Reference image limit reached.');
      return;
    }
    const queue = Array.from(files).slice(0, available);
    try {
      const uploads = await Promise.all(queue.map(async (file) => {
        const { dataUrl } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.85 });
        return dataUrl;
      }));
      setRefImages((prev) => {
        const next = [...prev];
        uploads.forEach((url) => {
          if (next.length < MAX_REF_IMAGES && !next.includes(url)) {
            next.push(url);
          }
        });
        return next;
      });
    } catch {
      alert('Failed to add reference image.');
    }
  };

  const removeRefAt = (idx: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const pickSuggestion = async (src: string) => {
    try {
      const dataUrl = await fetchUrlAsDataUrl(src);
      setApparelImage(dataUrl);
    } catch {
      alert('Failed to load apparel image');
    }
  };

  // Load suggestions from public/apparels/manifest.json if present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSuggLoading(true);
        setSuggError(null);
        // Try manifest.json first
        const res = await authorizedFetch('/apparels/manifest.json', { cache: 'no-store', redirectOn401: false });
        if (res.ok) {
          const data = await res.json();
          const items: ApparelSuggestion[] = Array.isArray(data)
            ? data.map((it: any) => (typeof it === 'string' ? { src: it } : it))
            : [];
          if (mounted) setSuggestions(items);
        } else {
          // Fallback: ask server to list files under public/apparels
          const lr = await authorizedFetch('/api/apparels/list', { cache: 'no-store', redirectOn401: false });
          if (lr.ok) {
            const data = await lr.json();
            const items: ApparelSuggestion[] = Array.isArray(data?.items)
              ? data.items.map((p: string) => ({ src: p }))
              : [];
            if (mounted) setSuggestions(items);
          } else {
            throw new Error('no suggestions');
          }
        }
      } catch (e) {
        if (mounted) setSuggError('No suggestions found. Add images under public/apparels or a manifest.json.');
      } finally {
        if (mounted) setSuggLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const tryOn = useCallback(async () => {
    if (!userImage || !apparelImage) return;
    if (!isAuthenticated) {
      setIterError("Oops, you'll have to create an account to generate.");
      router.push('/register');
      return;
    }
    setIterLoading(true);
    setIterError(null);
    // don't clear previous results; we'll prepend the new one
    try {
      const base64User = dataURLToBase64(userImage);
      const base64Apparel = dataURLToBase64(apparelImage);
      const userMime = (userImage.split(';')[0].split(':')[1]) || 'image/webp';
      const apparelMime = (apparelImage.split(';')[0].split(':')[1]) || 'image/webp';
      const extra = stylePrompt.trim();
      const promptParts = [
        'Place the apparel from the reference image onto the person in the base photo.',
        'Fit it realistically to the body, preserve the person’s face and hair, maintain proportions,',
        'add natural folds and shadows, and match lighting. Keep the background unchanged.',
        'Do not distort facial features. Make it look like a real try-on.'
      ];
      if (extra) {
        promptParts.push(`Additional instructions: ${extra}.`);
      }
      const prompt = promptParts.join(' ');
      const referenceAttachments = refImages.map((ref) => ({
        data: dataURLToBase64(ref),
        mimeType: (ref.split(';')[0].split(':')[1]) || 'image/webp'
      }));
      const attachments = [
        { data: base64Apparel, mimeType: apparelMime },
        ...referenceAttachments
      ];
      const result = await editImageWithNanoBanana(base64User, userMime, prompt, attachments, aspectRatio);
      setResults((arr) => [result.imageUrl, ...arr]);
      try { addUserImage({ kind: 'replace', prompt, original: userImage, generated: result.imageUrl, meta: { apparelSource: 'custom' } }); } catch {}
    } catch (e) {
      setIterError(e instanceof Error ? e.message : 'Failed to generate try-on');
    } finally {
      setIterLoading(false);
    }
  }, [userImage, apparelImage, stylePrompt, aspectRatio, refImages, isAuthenticated, router]);

  const recolor = useCallback(async (color: string) => {
    const base = latestResult || userImage;
    if (!base) return;
    if (!isAuthenticated) {
      setIterError("Oops, you'll have to create an account to generate.");
      router.push('/register');
      return;
    }
    setIterError(null);
    setColorLoading(color);
    try {
      const base64 = dataURLToBase64(base);
      const mime = (base.split(';')[0].split(':')[1]) || 'image/webp';
      const prompt = `Change the color of the apparel being worn to ${color}. Keep everything else (person, background, pose, lighting) unchanged.`;
      const result = await editImageWithNanoBanana(base64, mime, prompt, undefined, aspectRatio);
      setResults((arr) => [result.imageUrl, ...arr]);
      try { addUserImage({ kind: 'replace', prompt, original: userImage || undefined, generated: result.imageUrl, meta: { variant: 'color', color } }); } catch {}
    } catch (e) {
      setIterError(e instanceof Error ? e.message : 'Failed to change color');
    } finally {
      setColorLoading(null);
    }
  }, [latestResult, userImage, aspectRatio, isAuthenticated, router]);

  const download = useCallback(() => {
    const url = latestResult || userImage;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'try-apparel.png';
    a.click();
  }, [latestResult, userImage]);

  const handlePrevSuggestion = useCallback(() => {
    if (!showCarousel) return;
    setCarouselIndex((idx) => (idx <= 0 ? maxCarouselIndex : idx - 1));
  }, [maxCarouselIndex, showCarousel]);

  const handleNextSuggestion = useCallback(() => {
    if (!showCarousel) return;
    setCarouselIndex((idx) => (idx >= maxCarouselIndex ? 0 : idx + 1));
  }, [maxCarouselIndex, showCarousel]);

  return (
    <SurfaceCard className="max-w-5xl mx-auto overflow-hidden p-6 sm:p-8 space-y-6 sm:space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-black inline-flex items-center gap-2 justify-center">
          <CameraIcon className="w-6 h-6 text-black" /> Try Apparel
        </h2>
        <p className="text-black/70">Capture or upload your photo, pick an apparel, and try it on instantly.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-black">Your photo</span>
                  {userImage && !cameraActive && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => { setUserImage(null); setResults([]); }}
                        className="font-semibold text-black/60 hover:text-black"
                      >
                        Replace
                      </button>
                      {results.length > 0 && (
                        <button
                          onClick={() => setResults([])}
                          className="font-semibold text-black/60 hover:text-black"
                        >
                          Clear results
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl border border-black/12 bg-white/80">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`h-full w-full bg-black object-contain transition-opacity duration-200 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {userImage ? (
                        <img src={userImage} alt="Your photo" className="h-full w-full object-contain" />
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
                              <p>Upload a portrait or open the camera to capture one.</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {cameraActive && !camError && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <button
                        onClick={captureUser}
                        disabled={camLoading}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-black/20 bg-white text-black shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Capture photo"
                      >
                        <CameraIcon className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                  {camLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="space-y-1 text-center text-xs text-white">
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                        <p>Opening camera…</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/20 bg-white text-black transition-colors duration-200 hover:bg-gray-50 cursor-pointer" title="Upload image">
                    <UploadIcon className="h-4 w-4" />
                    <span className="sr-only">Upload image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUserUpload(e.target.files[0])} />
                  </label>
                  <button
                    onClick={() => {
                      if (cameraActive) {
                        stopStream();
                      } else {
                        setCamError(null);
                        startStream().catch(() => {});
                      }
                    }}
                    className="h-10 rounded-lg border border-black/20 bg-white px-3 text-xs font-semibold text-black transition-colors duration-200 hover:bg-gray-50"
                  >
                    {cameraActive ? 'Close camera' : 'Open camera'}
                  </button>
                  <button
                    onClick={flipCamera}
                    disabled={camLoading || !cameraActive}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/20 bg-white text-black transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Flip camera"
                  >
                    <SwapIcon className="h-5 w-5" />
                  </button>
                  {cameraActive && videoDevices.length > 1 && (
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
                </div>
              </div>

              <div className="space-y-3 sm:ml-auto sm:max-w-[13rem]">
                <div className="text-sm font-semibold text-black">Apparel</div>
                <div className="relative h-40 sm:h-44 w-full overflow-hidden rounded-2xl border border-black/12 bg-white/85 flex items-center justify-center p-4">
                  {apparelImage ? (
                    <img loading="lazy" src={apparelImage} alt="Apparel" className="h-full w-full object-contain" />
                  ) : (
                    <div className="px-4 text-center text-sm text-black/60">Upload an apparel or select from the library.</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/20 bg-white text-black transition-colors duration-200 hover:bg-gray-50 cursor-pointer" title="Upload apparel">
                    <UploadIcon className="h-4 w-4" />
                    <span className="sr-only">Upload apparel</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onApparelUpload(e.target.files[0])} />
                  </label>
                  {apparelImage && (
                    <button onClick={extractApparel} className="h-10 rounded-lg border border-black/20 bg-white px-3 text-xs font-semibold text-black transition-colors duration-200 hover:bg-gray-50">
                      Extract apparel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Reference images (optional)</span>
              <span className="text-xs text-black/60">{refImages.length}/{MAX_REF_IMAGES}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {refImages.map((src, idx) => (
                <div key={`${src}-${idx}`} className="relative h-24 overflow-hidden rounded-xl border border-black/12 bg-white">
                  <img src={src} alt={`Reference ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeRefAt(idx)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-black/20 bg-white/90 text-black/70 transition hover:text-black"
                    title="Remove reference"
                    aria-label="Remove reference"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M6.225 4.811a.75.75 0 0 1 1.06 0L12 9.525l4.715-4.714a.75.75 0 1 1 1.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 1 1-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 1 1-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              ))}
              {refImages.length < MAX_REF_IMAGES && (
                <label className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-black/20 bg-white/60 text-xs font-semibold text-black cursor-pointer transition hover:border-black/40">
                  Add reference
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files) {
                        addRefFiles(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-black/60">References help guide fit, lighting, or styling of the apparel.</p>
          </section>

          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setInstructionsOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-md border border-black/12 bg-white/70 px-3 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-white"
              aria-expanded={instructionsOpen}
              aria-controls="additional-instructions"
            >
              <span>Additional instructions (optional)</span>
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${instructionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {instructionsOpen && (
              <div id="additional-instructions" className="space-y-2 rounded-md border border-black/12 bg-white/80 p-3">
                <textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  rows={3}
                  placeholder="Add styling notes such as “roll the sleeves” or “match the shoes”."
                  className="w-full rounded-md border border-black/12 bg-white/90 p-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black/15"
                />
                <p className="text-xs text-black/60">These notes refine how the apparel is applied on your photo.</p>
              </div>
            )}
          </section>

          <AspectRatioSelector selectedRatio={aspectRatio} onSelect={setAspectRatio} />

          <section className="space-y-3">
            <button
              onClick={tryOn}
              disabled={!userImage || !apparelImage || iterLoading}
              className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-white font-bold transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-black"
            >
              {isAuthenticated ? (iterLoading ? 'Generating…' : 'Try on') : 'Signup to generate'}
              <span aria-hidden className="shine"></span>
            </button>
            {iterLoading && <div className="text-xs text-black/70"><EtaTimer seconds={18} label="Usually ~15–25s" /></div>}
            {iterError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{iterError}</div>}
          </section>

        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Latest render</span>
              {latestResult && <span className="text-xs text-black/50">Just generated</span>}
            </div>
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-black/12 bg-white/85">
              {latestResult ? (
                <button type="button" onClick={() => setLightbox(latestResult)} className="h-full w-full">
                  <img loading="lazy" src={latestResult} alt="Latest try-on" className="h-full w-full object-contain" />
                </button>
              ) : (
                <div className="px-6 text-center text-sm text-black/60">Generate a try-on to preview it here.</div>
              )}
              {iterLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm">
                  <div className="space-y-1 text-center text-xs text-white">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                    <p>Generating…</p>
                  </div>
                </div>
              )}
            </div>
            {latestResult && (
              <div className="space-y-3 text-sm text-black/70">
                <div className="flex flex-wrap gap-2">
                  <button onClick={download} className="rounded-lg border border-black bg-black px-3 py-2 font-semibold text-white transition-colors hover:bg-gray-800">Download PNG</button>
                  <button
                    onClick={() => { if (latestResult) void setOriginalFromUrl(latestResult); }}
                    className="rounded-lg border border-black px-3 py-2 font-semibold text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!latestResult}
                  >
                    Use as source
                  </button>
                  <button
                    onClick={() => { if (latestResult) void addRefFromUrl(latestResult); }}
                    disabled={!latestResult || refImages.length >= MAX_REF_IMAGES}
                    className="rounded-lg border border-black px-3 py-2 font-semibold text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add as reference
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-black">Quick recolor</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => recolor(c)}
                        disabled={!!colorLoading || !latestResult}
                        className={`btn-shine rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors duration-200 ${colorLoading === c ? 'bg-black text-white' : ''} ${!latestResult ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {colorLoading === c ? 'Working…' : (<>{c}<span aria-hidden className="shine"></span></>)}
                      </button>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="Custom color/style"
                          className="rounded-md border border-black/20 bg-white px-3 py-2 pr-10 text-xs text-black"
                        />
                        {customColor && (
                          <button
                            type="button"
                            onClick={() => setCustomColor('')}
                            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-black/20 bg-white text-black/60 transition hover:text-black"
                            aria-label="Clear custom color"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => customColor.trim() && recolor(customColor.trim())}
                        disabled={!customColor.trim() || !!colorLoading || !latestResult}
                        className="rounded-lg border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black transition-colors duration-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  {colorLoading && <div className="text-xs text-black/60"><EtaTimer seconds={12} label="Color tweak ~8–15s" /></div>}
                </div>
              </div>
            )}
          </section>

          {isWideForCarousel ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-black">Apparel library</span>
                {!suggLoading && suggestions.length > 0 && (
                  <span className="text-xs text-black/50">{showCarousel ? 'Auto-scroll enabled' : 'Tap to load'}</span>
                )}
              </div>
              {suggLoading && <div className="text-sm text-black">Loading…</div>}
              {!suggLoading && suggError && <div className="text-xs text-black">{suggError}</div>}
              {!suggLoading && !suggError && suggestions.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {showCarousel && (
                    <button
                      type="button"
                      onClick={handlePrevSuggestion}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 bg-white text-black hover:bg-black hover:text-white transition-colors"
                      aria-label="Previous apparel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M12.78 4.22a.75.75 0 010 1.06L8.56 9.5l4.22 4.22a.75.75 0 11-1.06 1.06l-4.75-4.75a.75.75 0 010-1.06l4.75-4.75a.75.75 0 011.06 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <div
                    ref={carouselRef}
                    className={`flex flex-1 gap-3 ${showCarousel ? 'overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory' : 'flex-wrap'}`}
                  >
                    {suggestions.map((item, idx) => (
                      <button
                        key={`${item.src}-${idx}`}
                        type="button"
                        onClick={() => pickSuggestion(item.src)}
                        className={`group relative overflow-hidden rounded-lg border border-black/15 bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow ${showCarousel ? 'flex-shrink-0 snap-center sm:basis-1/2 lg:basis-1/3 xl:basis-1/4' : 'flex-1 min-w-[140px]'}`}
                      >
                        <img loading="lazy" src={item.src} alt={item.label || 'Apparel'} className="h-24 w-full object-cover" />
                        <div className="p-2 text-xs text-black truncate group-hover:underline">{item.label || 'Apparel'}</div>
                      </button>
                    ))}
                  </div>
                  {showCarousel && (
                    <button
                      type="button"
                      onClick={handleNextSuggestion}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 bg-white text-black hover:bg-black hover:text-white transition-colors"
                      aria-label="Next apparel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M7.22 4.22a.75.75 0 011.06 0l4.75 4.75a.75.75 0 010 1.06l-4.75 4.75a.75.75 0 11-1.06-1.06L11.44 10 7.22 5.78a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              {!suggLoading && !suggError && suggestions.length === 0 && (
                <div className="text-xs text-black/60">Add images under <code>public/apparels</code> to build your library.</div>
              )}
            </section>
          ) : (
            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-black">Apparel library</span>
              </div>
              <div className="text-xs text-black/60">Browse the apparel library on a larger screen. You can still upload your own apparel above.</div>
            </section>
          )}

          {previousResults.length > 0 && (
            <section className="space-y-2">
              <div className="text-sm font-semibold text-black">History</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {previousResults.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative overflow-hidden rounded-xl border border-black/12 bg-white/80">
                    <img
                      onClick={() => setLightbox(url)}
                      loading="lazy"
                      src={url}
                      alt={`Result ${idx + 2}`}
                      className="h-36 w-full cursor-zoom-in object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => { const a = document.createElement('a'); a.href = url; a.download = `try-apparel-${idx + 2}.png`; a.click(); }}
                        className="rounded-full border border-black/20 bg-white p-2 shadow-sm transition hover:scale-105"
                        aria-label="Download"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black">
                          <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                          <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { void setOriginalFromUrl(url); }}
                        className="rounded border border-black/20 bg-white px-2 py-1 text-[11px] font-semibold text-black transition hover:bg-black hover:text-white"
                      >
                        Source
                      </button>
                      <button
                        onClick={() => { void addRefFromUrl(url); }}
                        disabled={refImages.length >= MAX_REF_IMAGES}
                        className="rounded border border-black/20 bg-white px-2 py-1 text-[11px] font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Ref
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Lightbox imageUrl={lightbox} onClose={() => setLightbox(null)} title="Preview" alt="Generated apparel preview" />
    </SurfaceCard>
  );
};

export default TryApparelPage;
