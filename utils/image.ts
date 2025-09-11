export type CompressOptions = {
  maxDim?: number; // max width or height in px
  type?: string; // output mime, default webp
  quality?: number; // 0..1
};

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    // Revoke later after image is loaded to avoid flicker
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function resizeToCanvas(img: HTMLImageElement, maxDim = 1600) {
  const { width: w, height: h } = img;
  if (!w || !h) throw new Error('Invalid image');
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas;
}

export async function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/webp', quality = 0.85): Promise<Blob> {
  // Prefer toBlob when available for better memory characteristics
  if (canvas.toBlob) {
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))), type, quality);
    });
  }
  // Fallback
  const dataUrl = canvas.toDataURL(type, quality);
  const arr = dataUrl.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new Blob([u8], { type });
}

export async function compressImageFile(file: File, opts: CompressOptions = {}) {
  const { maxDim = 1600, type = 'image/webp', quality = 0.85 } = opts;
  const img = await fileToImage(file);
  const canvas = resizeToCanvas(img, maxDim);
  const blob = await canvasToBlob(canvas, type, quality);
  const dataUrl = await blobToDataURL(blob);
  return { blob, dataUrl };
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function dataURLToBase64(dataUrl: string) {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

