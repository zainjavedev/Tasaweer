import React, { useState, useCallback } from 'react';
import { generateImageFromText } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { SparklesIcon } from '../components/Icon';

const TextToImagePage: React.FC = () => {
  const [prompt, setPrompt] = useState('A cozy coffee shop at sunset with warm lighting, cinematic style');
  const [result, setResult] = useState<EditedImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please write a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const generated = await generateImageFromText(prompt.trim());
      setResult(generated);
      try {
        addUserImage({ kind: 'text2image', prompt: prompt.trim(), generated: generated.imageUrl });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const download = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.imageUrl;
    a.download = 'generated-image.png';
    a.click();
  }, [result]);

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

      {result && (
        <div className="space-y-4">
          <div>
            <img src={result.imageUrl} alt="Generated" className="w-full h-auto rounded-lg border shadow" />
          </div>
          <div className="flex justify-center">
            <button onClick={download} className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700">Download</button>
          </div>
          {result.text && (
            <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-900/40 border text-sm text-gray-700 dark:text-gray-300">
              {result.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextToImagePage;
