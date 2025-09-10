import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraIcon, SparklesIcon, SwapIcon } from '../components/Icon';
import { addUserImage } from '../utils/userImages';

type ChipId = 'none' | 'anime' | 'starwars' | 'happy' | 'sad' | 'noir' | 'vibrant' | 'pixel';

type Chip = {
  id: ChipId;
  label: string;
  css: string; // CSS filter string for preview/canvas ctx.filter
  pixelate?: number; // pixel size factor if any
  badge?: string; // optional overlay badge text
};

const CHIPS: Chip[] = [
  { id: 'none', label: 'None', css: 'none' },
  { id: 'anime', label: 'Anime Style', css: 'contrast(1.2) saturate(1.6) hue-rotate(10deg)', badge: 'ANIME' },
  { id: 'starwars', label: 'Star Wars', css: 'contrast(1.4) sepia(0.2) saturate(1.3) hue-rotate(200deg)', badge: 'STAR WARS' },
  { id: 'happy', label: 'Make Me Happy', css: 'brightness(1.1) saturate(1.4) hue-rotate(-10deg)', badge: 'HAPPY' },
  { id: 'sad', label: 'Make Me Sad', css: 'grayscale(0.3) saturate(0.6) hue-rotate(180deg) brightness(0.95)', badge: 'SAD' },
  { id: 'noir', label: 'Film Noir', css: 'grayscale(1) contrast(1.4) brightness(0.9)', badge: 'NOIR' },
  { id: 'vibrant', label: 'Vibrant', css: 'contrast(1.2) saturate(1.5) brightness(1.05)', badge: 'VIBRANT' },
  { id: 'pixel', label: 'Pixel Art', css: 'none', pixelate: 6, badge: 'PIXEL' },
];

const CameraFunPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [chip, setChip] = useState<ChipId>('none');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  const chipDef = useMemo(() => CHIPS.find((c) => c.id === chip)!, [chip]);

  const stopStream = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message}. Camera access requires HTTPS or localhost.`
          : 'Failed to access camera. Ensure permissions are granted.'
      );
    } finally {
      setLoading(false);
    }
  }, [facing]);

  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream]);

  const flipCamera = () => setFacing((f) => (f === 'user' ? 'environment' : 'user'));

  const drawBadge = (ctx: CanvasRenderingContext2D, text: string, w: number, h: number) => {
    const pad = Math.max(10, Math.round(w * 0.02));
    const radius = Math.max(10, Math.round(w * 0.02));
    ctx.save();
    ctx.font = `bold ${Math.round(Math.max(14, w * 0.045))}px system-ui, -apple-system, Segoe UI, Roboto`;
    const metrics = ctx.measureText(text);
    const bw = metrics.width + pad * 2;
    const bh = Math.round(Math.max(28, w * 0.08));
    const x = pad;
    const y = h - bh - pad;
    // Rounded rect
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + bw - radius, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + radius);
    ctx.lineTo(x + bw, y + bh - radius);
    ctx.quadraticCurveTo(x + bw, y + bh, x + bw - radius, y + bh);
    ctx.lineTo(x + radius, y + bh);
    ctx.quadraticCurveTo(x, y + bh, x, y + bh - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    // Fill with gradient
    const grad = ctx.createLinearGradient(x, y, x + bw, y + bh);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#c084fc');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    // Text
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + pad, y + bh / 2);
    ctx.restore();
  };

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    // Prepare canvases
    const rawCanvas = rawCanvasRef.current!;
    const canvas = canvasRef.current!;
    rawCanvas.width = w;
    rawCanvas.height = h;
    canvas.width = w;
    canvas.height = h;

    const rawCtx = rawCanvas.getContext('2d')!;
    rawCtx.drawImage(video, 0, 0, w, h);
    const rawDataUrl = rawCanvas.toDataURL('image/png');
    setOriginalUrl(rawDataUrl);

    const ctx = canvas.getContext('2d')!;
    // Pixelate if needed
    const px = chipDef.pixelate || 0;
    if (px > 1) {
      const smallW = Math.max(1, Math.floor(w / px));
      const smallH = Math.max(1, Math.floor(h / px));
      const tmp = document.createElement('canvas');
      tmp.width = smallW;
      tmp.height = smallH;
      const tctx = tmp.getContext('2d')!;
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(video, 0, 0, smallW, smallH);
      ctx.imageSmoothingEnabled = false;
      ctx.filter = chipDef.css || 'none';
      ctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.filter = chipDef.css || 'none';
      ctx.drawImage(video, 0, 0, w, h);
    }

    // Badge overlay if any
    if (chipDef.badge && chipDef.id !== 'none') {
      drawBadge(ctx, chipDef.badge, w, h);
    }

    // Export
    const url = canvas.toDataURL('image/png');
    setResultUrl(url);
    // Optionally release camera to save battery
    stopStream();
  }, [chipDef]);

  const download = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `camera-${chip}.png`;
    a.click();
  }, [resultUrl, chip]);

  const save = useCallback(() => {
    if (!resultUrl) return;
    try {
      addUserImage({ kind: 'camera', original: originalUrl || undefined, generated: resultUrl, meta: { chip } });
      alert('Saved to My Images');
    } catch {}
  }, [resultUrl, originalUrl, chip]);

  const retake = useCallback(() => {
    setResultUrl(null);
    setOriginalUrl(null);
    startStream();
  }, [startStream]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
          <CameraIcon className="w-6 h-6" /> Camera Fun
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Open your camera, pick a fun chip, capture and download.</p>
      </div>

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChip(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
              chip === c.id
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Camera or Result */}
      {!resultUrl ? (
        <div className="space-y-4">
          <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border relative">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ filter: chipDef.css }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 dark:text-gray-300">
                <SparklesIcon className="w-5 h-5 mr-2" /> Opening camera…
              </div>
            )}
            {error && (
              <div className="absolute inset-0 p-4 text-red-600 bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-center">
                {error}
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={capture} disabled={loading || !!error}
              className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800 inline-flex items-center gap-2">
              <CameraIcon className="w-5 h-5" /> Capture
            </button>
            <button onClick={flipCamera} disabled={loading || !!error}
              className="px-5 py-2 rounded-lg bg-white dark:bg-gray-700 border font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center gap-2">
              <SwapIcon className="w-5 h-5" /> Flip Camera
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border">
            <img src={resultUrl} alt="Captured" className="w-full h-auto object-contain" />
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={download} className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700">Download</button>
            <button onClick={save} className="px-5 py-2 rounded-lg bg-white dark:bg-gray-700 border font-semibold hover:bg-gray-50 dark:hover:bg-gray-600">Save to My Images</button>
            <button onClick={retake} className="px-5 py-2 rounded-lg bg-white dark:bg-gray-700 border font-semibold hover:bg-gray-50 dark:hover:bg-gray-600">Retake</button>
          </div>
        </div>
      )}

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={rawCanvasRef} className="hidden" />
    </div>
  );
};

export default CameraFunPage;

