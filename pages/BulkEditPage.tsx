import React, { useCallback, useMemo, useState } from 'react';
import { editImageWithNanoBanana } from '@/services/geminiService';
import EtaTimer from '@/components/EtaTimer';
import { compressImageFile } from '@/utils/image';
import { createZip, dataUrlToUint8 } from '@/utils/zip';
import SurfaceCard from '@/components/SurfaceCard';

type Task = {
  file: File;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  url?: string;
  error?: string;
};

const BulkEditPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompt, setPrompt] = useState('Fix lighting, enhance clarity, and make colors pop naturally.');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr: Task[] = [];
    for (const f of Array.from(files)) arr.push({ file: f, name: f.name, status: 'pending' });
    setTasks(arr);
  };

  const toCompressedBase64 = async (file: File) => {
    const { blob } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.85 });
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return { base64, mimeType: blob.type };
  };

  const start = useCallback(async () => {
    if (!prompt.trim() || tasks.length === 0) return;
    setRunning(true);
    setError(null);
    const next = [...tasks];
    setTasks(next);
    for (let i = 0; i < next.length; i++) {
      next[i] = { ...next[i], status: 'processing', error: undefined };
      setTasks([...next]);
      try {
        const { base64, mimeType } = await toCompressedBase64(next[i].file);
        const res = await editImageWithNanoBanana(base64, mimeType, prompt.trim());
        next[i] = { ...next[i], status: 'done', url: res.imageUrl };
      } catch (e: any) {
        next[i] = { ...next[i], status: 'error', error: e?.message || 'Failed' };
      }
      setTasks([...next]);
    }
    setRunning(false);
  }, [prompt, tasks]);

  const completed = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks]);
  const progress = useMemo(() => tasks.filter((t) => t.status !== 'pending').length, [tasks]);

  const downloadZip = useCallback(async () => {
    const files = await Promise.all(
      completed.map(async (t, idx) => {
        const data = await dataUrlToUint8(t.url!);
        const name = t.name.replace(/\.[^.]+$/, '') + `-edited-${idx + 1}.png`;
        return { name, data };
      })
    );
    const blob = createZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bulk-edits.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, [completed]);

  return (
    <SurfaceCard className="max-w-5xl mx-auto overflow-hidden p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-black">Bulk Edit</h2>
          <p className="text-black/70">Upload multiple images, enter one command, get all results.</p>
        </div>
        {completed.length > 0 && (
          <button onClick={downloadZip} className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition-colors duration-200">Download ZIP</button>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-black">Upload images</label>
        <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-black">Command</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-white/60 bg-white/70 p-3 pr-10 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-black/20 bg-white text-black/60 transition hover:text-black"
              aria-label="Clear command"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={start}
          disabled={running || tasks.length === 0 || !prompt.trim()}
          className="btn-shine px-6 py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {running ? 'Processing…' : 'Start'}
          <span aria-hidden className="shine"></span>
        </button>
        {running && (
          <div className="max-w-xs">
            <EtaTimer seconds={tasks.length * 12} label="Batch ETA varies by count" />
          </div>
        )}
      </div>

      {error && <div className="text-center text-sm text-red-600 bg-red-50/80 border border-red-200 p-3 rounded">{error}</div>}

      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-black/80">Progress: {progress}/{tasks.length}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-white/40 bg-white/50 relative">
                <div className="aspect-[4/3] w-full flex items-center justify-center">
                  {t.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.url} alt={t.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-sm text-black/60">
                      {t.status === 'pending'
                        ? 'Waiting'
                        : t.status === 'processing'
                        ? 'Processing…'
                        : t.status === 'error'
                        ? 'Failed'
                        : ''}
                    </div>
                  )}
                </div>
                <div className="p-2 text-xs text-black/70 truncate">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SurfaceCard>
  );
};

export default BulkEditPage;
