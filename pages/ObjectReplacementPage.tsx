import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { ImageDisplay } from '../components/ImageDisplay';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { editImageWithNanoBanana } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { SwapIcon } from '../components/Icon';
import { compressImageFile } from '@/utils/image';
import CaptureWidget from '@/components/CaptureWidget';

const ObjectReplacementPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [editedResult, setEditedResult] = useState<EditedImageResult | null>(null);
  const [sourceObject, setSourceObject] = useState('');
  const [targetObject, setTargetObject] = useState('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [samplePreview, setSamplePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setEditedResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setOriginalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleCapture = useCallback((file: File, preview: string) => {
    setOriginalImage(file);
    setOriginalPreview(preview);
    setEditedResult(null);
    setError(null);
  }, []);

  const handleSampleUpload = (file: File | null) => {
    setSampleFile(file);
    if (!file) { setSamplePreview(null); return; }
    const r = new FileReader();
    r.onloadend = () => setSamplePreview(r.result as string);
    r.readAsDataURL(file);
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

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !sourceObject || !targetObject) {
      setError('Please upload an image and fill both replacement fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedResult(null);
    try {
      const { base64, mimeType } = await toCompressedBase64(originalImage);
      const prompt = `Replace ${sourceObject} with ${targetObject} in this photo. Preserve scene lighting, perspective, and shadows. Blend seamlessly.`;
      let additional: { data: string; mimeType: string }[] | undefined;
      if (sampleFile) {
        const { base64: sBase64, mimeType: sMime } = await toCompressedBase64(sampleFile);
        additional = [{ data: sBase64, mimeType: sMime }];
      }
      const result = await editImageWithNanoBanana(base64, mimeType, prompt, additional);
      setEditedResult(result);
      try {
        addUserImage({ kind: 'replace', prompt, original: originalPreview!, generated: result.imageUrl, meta: { sourceObject, targetObject } });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process replacement.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, sourceObject, targetObject, sampleFile]);

  const downloadEdited = useCallback(() => {
    if (!editedResult) return;
    const a = document.createElement('a');
    a.href = editedResult.imageUrl;
    a.download = 'replaced-image.png';
    a.click();
  }, [editedResult]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Object Replacement</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Describe what to replace and with what. Optionally attach a sample for guidance.</p>
      </div>

      <ImageUploader onImageUpload={handleImageUpload} preview={originalPreview} />
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">or</div>
      <CaptureWidget onCapture={handleCapture} />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">What to replace</label>
          <input value={sourceObject} onChange={(e) => setSourceObject(e.target.value)} placeholder="e.g., wrist watch"
            className="mt-1 w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Replace with</label>
          <input value={targetObject} onChange={(e) => setTargetObject(e.target.value)} placeholder="e.g., Omnitrix"
            className="mt-1 w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Optional sample image</label>
        <div className="mt-1 flex items-center gap-4">
          <input type="file" accept="image/*" onChange={(e) => handleSampleUpload(e.target.files?.[0] || null)} />
          {samplePreview && <img src={samplePreview} alt="sample" className="h-16 w-auto rounded border" />}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button onClick={handleSubmit} disabled={!originalImage || !sourceObject || !targetObject || isLoading}
          className="flex items-center justify-center gap-3 w-full max-w-xs px-8 py-4 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed">
          {isLoading ? 'Replacing…' : (<><SwapIcon /> Replace</>)}
        </button>
      </div>

      {error && <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="space-y-4">
          <Loader />
          <EtaTimer seconds={20} label="Usually 15–30s for complex swaps" />
          <p className="text-center text-gray-600 dark:text-gray-400">AI is performing the replacement…</p>
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

export default ObjectReplacementPage;
