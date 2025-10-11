
import React, { useState } from 'react';
import { EditedImageResult } from '../types';
import Lightbox from './Lightbox';

interface ImageDisplayProps {
  original: string;
  edited: EditedImageResult;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ original, edited }) => {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-8 space-y-6">
       <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Your Enhanced Photo</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Compare the original with your newly enhanced image.</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">Original</h3>
          <img loading="lazy" src={original} alt="Original" className="rounded-lg shadow-lg w-full h-auto object-contain" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">Generated</h3>
          <div className="relative">
            <img onClick={() => setOpen(edited.imageUrl)} loading="lazy" src={edited.imageUrl} alt="Edited" className="cursor-zoom-in rounded-lg shadow-lg w-full h-auto object-contain" />
            <button
              onClick={() => { const a = document.createElement('a'); a.href = edited.imageUrl; a.download = 'edited-image.png'; a.click(); }}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/80 border shadow"
              aria-label="Download"
              title="Download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-200">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L7.72 11.28a.75.75 0 111.06-1.06l2.47 2.47V4.5A.75.75 0 0112 3.75z" clipRule="evenodd" />
                <path d="M3.75 15a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v3A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {edited.text && (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">AI Assistant's Note:</h4>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{edited.text}</p>
        </div>
      )}
      <Lightbox imageUrl={open} onClose={() => setOpen(null)} title="Generated preview" alt="Generated image preview" />
    </div>
  );
};
