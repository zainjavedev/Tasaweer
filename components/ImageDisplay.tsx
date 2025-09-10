
import React from 'react';
import { EditedImageResult } from '../types';

interface ImageDisplayProps {
  original: string;
  edited: EditedImageResult;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ original, edited }) => {
  return (
    <div className="mt-8 space-y-6">
       <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Your Enhanced Photo</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Compare the original with your newly enhanced image.</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">Original</h3>
          <img src={original} alt="Original" className="rounded-lg shadow-lg w-full h-auto object-contain" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">Generated</h3>
          <img src={edited.imageUrl} alt="Edited" className="rounded-lg shadow-lg w-full h-auto object-contain" />
        </div>
      </div>
      {edited.text && (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">AI Assistant's Note:</h4>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{edited.text}</p>
        </div>
      )}
    </div>
  );
};
