import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { ImageDisplay } from '../components/ImageDisplay';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { editImageWithNanoBanana } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { MagicWandIcon } from '../components/Icon';

const DEFAULT_PROMPT = 'Restore this image: repair scratches and blemishes, reduce noise, enhance sharpness and contrast, and color-correct while keeping it natural.';

const RestorationPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [editedResult, setEditedResult] = useState<EditedImageResult | null>(null);
  const [extraInstructions, setExtraInstructions] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setEditedResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setOriginalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const handleSubmit = useCallback(async () => {
    if (!originalImage) {
      setError('Please upload an image to restore.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedResult(null);
    try {
      const base64 = await toBase64(originalImage);
      const fullPrompt = extraInstructions
        ? `${DEFAULT_PROMPT}\nAdditional instructions: ${extraInstructions}`
        : DEFAULT_PROMPT;
      const result = await editImageWithNanoBanana(base64, originalImage.type, fullPrompt);
      setEditedResult(result);
      try {
        addUserImage({ kind: 'restoration', prompt: fullPrompt, original: originalPreview!, generated: result.imageUrl });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore the image.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, extraInstructions]);

  const downloadEdited = useCallback(() => {
    if (!editedResult) return;
    const a = document.createElement('a');
    a.href = editedResult.imageUrl;
    a.download = 'restored-image.png';
    a.click();
  }, [editedResult]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Image Restoration</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Repair damage, denoise, sharpen, and color-correct while keeping it natural.</p>
      </div>

      <ImageUploader onImageUpload={handleImageUpload} preview={originalPreview} />

      <div className="space-y-2">
        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Default prompt sent:</div>
        <div className="text-sm p-3 rounded-md bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">{DEFAULT_PROMPT}</div>
        <label htmlFor="extra" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add anything else (optional)</label>
        <textarea id="extra" value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} rows={3}
          className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
      </div>

      <div className="flex justify-center pt-2">
        <button onClick={handleSubmit} disabled={!originalImage || isLoading}
          className="flex items-center justify-center gap-3 w-full max-w-xs px-8 py-4 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed">
          {isLoading ? 'Restoring…' : (<><MagicWandIcon /> Restore</>)}
        </button>
      </div>

      {error && <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="space-y-4">
          <Loader />
          <EtaTimer seconds={14} label="Typically 10–20s depending on size" />
          <p className="text-center text-gray-600 dark:text-gray-400">AI is restoring your image…</p>
        </div>
      )}

      {editedResult && (
        <div className="space-y-4">
          <ImageDisplay original={originalPreview!} edited={editedResult} />
        </div>
      )}
    </div>
  );
};

export default RestorationPage;
