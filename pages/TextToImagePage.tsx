import React, { useState, useCallback } from 'react';
import { generateImageFromText } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { SparklesIcon } from '../components/Icon';

const TextToImagePage: React.FC = () => {
  const [prompt, setPrompt] = useState('A cozy coffee shop at sunset with warm lighting, cinematic style');
  const [results, setResults] = useState<EditedImageResult[]>([]); // newest first
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please write a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    // do not clear previous results; we'll prepend new one
    try {
      const generated = await generateImageFromText(prompt.trim());
      setResults((arr) => [generated, ...arr]);
      try {
        addUserImage({ kind: 'text2image', prompt: prompt.trim(), generated: generated.imageUrl });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const download = useCallback((url: string, name = 'generated-image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Text → Image</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Describe the scene and generate an image with AI.</p>
      </div>

      <div>
        <label htmlFor="t2i" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
        <textarea id="t2i" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          placeholder="Describe what you want to see" />
      </div>

      <div className="flex justify-center">
        <button onClick={handleGenerate} disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full max-w-xs px-8 py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800">
          {isLoading ? 'Generating…' : (<><SparklesIcon className="w-5 h-5"/> Generate</>)}
        </button>
      </div>

      {error && <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="space-y-4">
          <Loader />
          <EtaTimer seconds={18} label="Usually ~15–25s for first render" />
          <p className="text-center text-gray-600 dark:text-gray-400">AI is creating your image…</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Results (latest first)</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((res, idx) => (
              <div key={idx} className="group relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border">
                <img loading="lazy" src={res.imageUrl} alt={`Generated ${idx + 1}`} className="w-full h-auto object-contain max-h-80 transition-transform duration-300 group-hover:scale-[1.01]" />
                <button
                  onClick={() => download(res.imageUrl, `t2i-${idx + 1}.png`)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/80 border shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Download"
                  title="Download"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-200">
                    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                    <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
                  </svg>
                </button>
                {res.text && (
                  <div className="p-2 text-xs text-gray-700 dark:text-gray-300">{res.text}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToImagePage;
