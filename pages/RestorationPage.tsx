import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { ImageDisplay } from '../components/ImageDisplay';
import { Loader } from '../components/Loader';
import EtaTimer from '../components/EtaTimer';
import { editImageWithNanoBanana } from '../services/geminiService';
import { EditedImageResult } from '../types';
import { addUserImage } from '../utils/userImages';
import { MagicWandIcon } from '../components/Icon';
import { compressImageFile } from '@/utils/image';
import CaptureWidget from '@/components/CaptureWidget';
import SurfaceCard from '@/components/SurfaceCard';

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

  const handleCapture = useCallback((file: File, preview: string) => {
    setOriginalImage(file);
    setOriginalPreview(preview);
    setEditedResult(null);
    setError(null);
  }, []);

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
    if (!originalImage) {
      setError('Please upload an image to restore.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedResult(null);
    try {
      const { base64, mimeType } = await toCompressedBase64(originalImage);
      const fullPrompt = extraInstructions
        ? `${DEFAULT_PROMPT}\nAdditional instructions: ${extraInstructions}`
        : DEFAULT_PROMPT;
      const result = await editImageWithNanoBanana(base64, mimeType, fullPrompt);
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
    <SurfaceCard className="max-w-4xl mx-auto overflow-hidden p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black">Image Restoration</h2>
        <p className="text-black/70 mt-1">Repair damage, denoise, sharpen, and color-correct while keeping it natural.</p>
      </div>

      <ImageUploader onImageUpload={handleImageUpload} preview={originalPreview} />
      <div className="text-center text-xs text-black/60">or</div>
      <CaptureWidget onCapture={handleCapture} />

      <div className="space-y-2">
        <div className="text-sm text-black font-medium">Default prompt sent:</div>
        <div className="text-sm p-3 rounded-md bg-white/60 border border-white/50 text-black/80">{DEFAULT_PROMPT}</div>
        <label htmlFor="extra" className="block text-sm font-medium text-black">Add anything else (optional)</label>
        <div className="relative">
          <textarea
            id="extra"
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-white/60 bg-white/70 p-3 pr-10 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          {extraInstructions && (
            <button
              type="button"
              onClick={() => setExtraInstructions('')}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-black/20 bg-white text-black/60 transition hover:text-black"
              aria-label="Clear additional instructions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={handleSubmit}
          disabled={!originalImage || isLoading}
          className="btn-shine flex items-center justify-center gap-3 w-full max-w-xs px-8 py-3 bg-black text-white font-bold rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Restoring…' : (
            <>
              <MagicWandIcon className="w-5 h-5" />
              Restore
            </>
          )}
          <span aria-hidden className="shine"></span>
        </button>
      </div>

      {error && <div className="text-center text-sm text-red-600 bg-red-50/80 border border-red-200 p-3 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="space-y-4">
          <Loader />
          <EtaTimer seconds={14} label="Typically 10–20s depending on size" />
          <p className="text-center text-black/70">AI is restoring your image…</p>
        </div>
      )}

      {editedResult && (
        <div className="space-y-4">
          <ImageDisplay original={originalPreview!} edited={editedResult} />
        </div>
      )}
    </SurfaceCard>
  );
};

export default RestorationPage;
