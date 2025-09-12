"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, SwapIcon, SparklesIcon } from './Icon';

export default function CaptureWidget({ onCapture }: { onCapture: (file: File, preview: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');

  const stop = () => {
    const s = streamRef.current;
    if (s) { s.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  };
  useEffect(() => () => stop(), []);

  const open = useCallback(async () => {
    setLoading(true); setError(null); stop();
    try {
      const isLocalhost = typeof window !== 'undefined' && ['localhost','127.0.0.1','::1'].includes(window.location.hostname);
      const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:');
      if (!isSecure && !isLocalhost) throw new DOMException('Camera access requires HTTPS or localhost', 'SecurityError');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API not available');
      const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: facing } as any }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch (e: any) { setError(e?.message || 'Failed to open camera'); }
    finally { setLoading(false); }
  }, [facing]);

  const snap = () => {
    const video = videoRef.current; if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/webp', 0.9);
    fetch(dataUrl).then(r => r.blob()).then((blob) => {
      const f = new File([blob], 'capture.webp', { type: blob.type });
      onCapture(f, dataUrl);
    });
  };

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border relative">
        <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
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
      <div className="flex flex-wrap gap-2">
        <button onClick={open} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center gap-2"><CameraIcon className="w-5 h-5" /> Open Camera</button>
        <button onClick={snap} disabled={loading || !!error} className="px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800 inline-flex items-center gap-2"><CameraIcon className="w-5 h-5" /> Capture</button>
        <button onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} disabled={loading || !!error} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center gap-2"><SwapIcon className="w-5 h-5" /> Flip</button>
      </div>
    </div>
  );
}

