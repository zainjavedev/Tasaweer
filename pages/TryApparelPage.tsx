import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, SparklesIcon, SwapIcon, UploadIcon } from '../components/Icon';
import { addUserImage } from '../utils/userImages';
import { AspectRatioSelector, AspectRatio } from '@/components/AspectRatioSelector';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { authorizedFetch } from '@/utils/authClient';
import { compressImageFile, dataURLToBase64 } from '@/utils/image';
import Lightbox from '@/components/Lightbox';

type ColorOption = string;

const COLOR_OPTIONS: ColorOption[] = ['Red', 'Blue', 'Black', 'White', 'Green', 'Beige', 'Navy', 'Denim', 'Pastel Pink', 'Grey'];

const TryApparelPage: React.FC = () => {
  // User capture/upload
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camLoading, setCamLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
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
  // Mobile UI: collapse suggestions to save space
  const [mobileSuggOpen, setMobileSuggOpen] = useState(false);

  // Results / iteration
  const [results, setResults] = useState<string[]>([]); // newest first
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [iterLoading, setIterLoading] = useState(false); // initial try-on
  const [iterError, setIterError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16'); // Default to Portrait for apparel
  const [customColor, setCustomColor] = useState('');
  const [colorLoading, setColorLoading] = useState<string | null>(null); // which color button is generating

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
  }, [facing]);

  useEffect(() => () => stopStream(), []);

  const flipCamera = useCallback(() => {
    const newFacing = facing === 'user' ? 'environment' : 'user';
    setFacing(newFacing);

    // Clear selected device to allow flipping
    setSelectedDeviceId(null);

    // Force restart camera with new facing mode
    setTimeout(() => startStream().catch(() => {}), 100);
  }, [facing, startStream]);

  // When facing changes, always restart with facing constraint
  useEffect(() => {
    // Small delay to ensure state updates are complete
    const t = setTimeout(() => startStream().catch(() => {}), 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

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
  }, [apparelImage]);

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
        const res = await authorizedFetch('/apparels/manifest.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const items: ApparelSuggestion[] = Array.isArray(data)
            ? data.map((it: any) => (typeof it === 'string' ? { src: it } : it))
            : [];
          if (mounted) setSuggestions(items);
        } else {
          // Fallback: ask server to list files under public/apparels
          const lr = await authorizedFetch('/api/apparels/list', { cache: 'no-store' });
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
    setIterLoading(true);
    setIterError(null);
    // don't clear previous results; we'll prepend the new one
    try {
      const base64User = dataURLToBase64(userImage);
      const base64Apparel = dataURLToBase64(apparelImage);
      const userMime = (userImage.split(';')[0].split(':')[1]) || 'image/webp';
      const apparelMime = (apparelImage.split(';')[0].split(':')[1]) || 'image/webp';
      const prompt = [
        'Place the apparel from the reference image onto the person in the base photo.',
        'Fit it realistically to the body, preserve the person’s face and hair, maintain proportions,',
        'add natural folds and shadows, and match lighting. Keep the background unchanged.',
        'Do not distort facial features. Make it look like a real try-on.'
      ].join(' ');
      const result = await editImageWithNanoBanana(base64User, userMime, prompt, [
        { data: base64Apparel, mimeType: apparelMime }
      ], aspectRatio);
      setResults((arr) => [result.imageUrl, ...arr]);
      try { addUserImage({ kind: 'replace', prompt, original: userImage, generated: result.imageUrl, meta: { apparelSource: 'custom' } }); } catch {}
    } catch (e) {
      setIterError(e instanceof Error ? e.message : 'Failed to generate try-on');
    } finally {
      setIterLoading(false);
    }
  }, [userImage, apparelImage]);

  const recolor = useCallback(async (color: string) => {
    const base = results[0] || userImage;
    if (!base) return;
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
  }, [results, userImage]);

  const download = useCallback(() => {
    const url = results[0] || userImage;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'try-apparel.png';
    a.click();
  }, [results, userImage]);

  return (
    <div className="max-w-5xl mx-auto bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] overflow-hidden p-6 md:p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black inline-flex items-center gap-2">
          <CameraIcon className="w-6 h-6 text-black" /> Try Apparel
        </h2>
        <p className="text-black mt-1">Capture or upload your photo, pick an apparel, and see it on you. Then tweak the color.</p>
      </div>

      {/* Layout: Sidebar suggestions + main content */}
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar suggestions (collapsible on mobile) */}
        <aside className="block">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-black">Apparel Suggestions</div>
            <button
              type="button"
              onClick={() => setMobileSuggOpen((v) => !v)}
              className="md:hidden text-xs px-2 py-1 rounded border-2 border-black bg-white text-black hover:bg-gray-50 transition-colors duration-200"
              aria-expanded={mobileSuggOpen}
              aria-controls="apparel-suggestions-list"
            >
              {mobileSuggOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          <div
            id="apparel-suggestions-list"
            className={`${mobileSuggOpen ? 'block' : 'hidden'} md:block h-[70vh] overflow-y-auto pr-1 space-y-2`}
          >
            {suggLoading && <div className="text-sm text-black">Loading…</div>}
            {suggError && <div className="text-xs text-black">{suggError}</div>}
            {suggestions.map((s, idx) => (
              <div key={idx} className="border-2 border-black rounded-lg overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" src={s.src} alt={s.label || 'Apparel'} className="w-full h-24 object-contain bg-white" />
                <div className="p-2 flex items-center justify-between gap-2">
                  <div className="text-xs text-black truncate">{s.label || 'Apparel'}</div>
                  <button onClick={() => pickSuggestion(s.src)} className="btn-shine text-xs px-2 py-1 rounded bg-black text-white hover:bg-gray-800 transition-colors duration-200"><span aria-hidden className="shine"></span>Insert</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content: User photo and Apparel picker */}
        <div className="space-y-6">
          {/* User photo - Full Width */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-black">Your Photo</div>
            <div className="text-xs text-black">Tip: For best results, center yourself in the camera frame.</div>
            {!userImage ? (
              <div className="space-y-3">
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border-2 border-white relative">
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  {camLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <SparklesIcon className="w-5 h-5 mr-2" /> Opening camera…
                    </div>
                  )}
                  {camError && (
                    <div className="absolute inset-0 p-4 text-white bg-black/80 flex items-center justify-center text-center">
                      {camError}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => startStream()} className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center" title="Open Camera"><CameraIcon className="w-5 h-5 text-black" /></button>
                  <button onClick={captureUser} disabled={camLoading || !!camError} className="w-12 h-12 btn-shine rounded-lg bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center" title="Capture"><CameraIcon className="w-5 h-5" /><span aria-hidden className="shine"></span></button>
                  <button onClick={flipCamera} disabled={camLoading || !!camError} className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center" title="Flip Camera"><SwapIcon className="w-5 h-5 text-black" /></button>
                  {videoDevices.length > 1 && (
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
                  <label className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center cursor-pointer" title="Upload Photo">
                    <UploadIcon className="w-5 h-5 text-black" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUserUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-full bg-white rounded-xl overflow-hidden border-2 border-black">
                  <img loading="lazy" src={userImage} alt="Your photo" className="w-full h-auto object-contain" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setUserImage(null); setResults([]); }} className="px-4 py-2 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200">Replace Photo</button>
                  <button onClick={() => { setResults([]); }} className="px-4 py-2 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200">Clear Results</button>
                </div>
              </div>
            )}
          </div>

          {/* Apparel picker - Full Width */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-black">Apparel</div>
            <div className="w-full bg-white rounded-xl overflow-hidden border-2 border-black min-h-[160px] flex items-center justify-center p-3">
              {apparelImage ? (
                <img loading="lazy" src={apparelImage} alt="Apparel" className="max-h-64 object-contain" />
              ) : (
                <div className="text-black text-sm">Upload an apparel image</div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="w-12 h-12 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center cursor-pointer" title="Upload Apparel">
                <UploadIcon className="w-5 h-5 text-black" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onApparelUpload(e.target.files[0])} />
              </label>
              {apparelImage && (
                <button onClick={extractApparel} className="px-4 py-2 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200">Extract Apparel</button>
              )}
            </div>
          </div>

          {/* Try On Button - Full Width */}
          <div className="mt-6">
            <button
              onClick={tryOn}
              disabled={!userImage || !apparelImage || iterLoading}
              className="w-full btn-shine px-6 py-3 rounded-lg bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200 text-lg"
            >
              {iterLoading ? 'Generating…' : (<>Try On<span aria-hidden className="shine"></span></>)}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <AspectRatioSelector
        selectedRatio={aspectRatio}
        onSelect={(ratio: AspectRatio) => setAspectRatio(ratio.value)}
      />
      {iterLoading && (
        <div className="max-w-md mx-auto"><EtaTimer seconds={18} label="Usually ~15–25s for first render" /></div>
      )}
      {iterError && <div className="text-center text-white bg-black p-3 rounded-lg border-2 border-white">{iterError}</div>}

      {/* Result and color tweaks */}
      {(userImage || results.length > 0) && (
        <div className="space-y-6">
          {/* Color tweak controls with per-button loading and ETA */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-black">Change apparel color</div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => recolor(c)} disabled={!!colorLoading} className={`btn-shine px-3 py-1.5 rounded-full border-2 text-sm border-black bg-white text-black hover:bg-gray-50 transition-colors duration-200 ${colorLoading === c ? 'bg-black text-white' : ''}`}>
                  {colorLoading === c ? 'Generating…' : (<>{c}<span aria-hidden className="shine"></span></>)}
                </button>
              ))}
              <div className="flex gap-2 items-center">
                <input value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="Custom color / style" className="p-2 rounded-md border-2 border-black bg-white text-black" />
                <button onClick={() => customColor.trim() && recolor(customColor.trim())} disabled={!customColor.trim() || !!colorLoading} className="px-3 py-2 rounded-lg bg-white border-2 border-black font-semibold text-black hover:bg-gray-50 transition-colors duration-200">Apply</button>
              </div>
            </div>
            {colorLoading && (
              <div className="max-w-md mx-auto"><EtaTimer seconds={12} label="Color change ~8–15s" /></div>
            )}
          </div>

          {/* Results grid, newest first, smaller width */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-black">Results (latest first)</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((url, idx) => (
                  <div key={idx} className="relative bg-white rounded-xl overflow-hidden border-2 border-black">
                    <img onClick={() => setLightbox(url)} loading="lazy" src={url} alt={`Result ${idx + 1}`} className="cursor-zoom-in w-full h-auto object-contain max-h-72" />
                    <button
                      onClick={() => { const a = document.createElement('a'); a.href = url; a.download = `try-apparel-${idx + 1}.png`; a.click(); }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white border-2 border-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:scale-110 transition-all duration-200"
                      aria-label="Download"
                      title="Download"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
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
      )}
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
};

export default TryApparelPage;
