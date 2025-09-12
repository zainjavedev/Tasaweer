import React, { useCallback, useMemo, useState } from 'react';
import { editImageWithNanoBanana } from '@/services/geminiService';
import EtaTimer from '@/components/EtaTimer';
import { compressImageFile } from '@/utils/image';
import { createZip, dataUrlToUint8 } from '@/utils/zip';

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
    <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Edit</h2>
          <p className="text-gray-600 dark:text-gray-400">Upload multiple images, enter one command, get all results.</p>
        </div>
        {completed.length > 0 && (
          <button onClick={downloadZip} className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700">Download ZIP</button>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Upload images</label>
        <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Command</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={start} disabled={running || tasks.length === 0 || !prompt.trim()} className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:bg-purple-300">{running ? 'Processing…' : 'Start'}</button>
        {running && <div className="max-w-xs"><EtaTimer seconds={tasks.length * 12} label="Batch ETA varies by count" /></div>}
      </div>

      {error && <div className="text-center text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded">{error}</div>}

      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-700 dark:text-gray-300">Progress: {progress}/{tasks.length}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border bg-gray-50 dark:bg-gray-900 relative">
                <div className="aspect-[4/3] w-full flex items-center justify-center">
                  {t.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.url} alt={t.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-sm text-gray-500">{t.status === 'pending' ? 'Waiting' : t.status === 'processing' ? 'Processing…' : t.status === 'error' ? 'Failed' : ''}</div>
                  )}
                </div>
                <div className="p-2 text-xs text-gray-600 dark:text-gray-300 truncate">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkEditPage;

