
import React, { useCallback } from 'react';
import { UploadIcon } from './Icon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  preview: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, preview }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageUpload(event.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  return (
    <div className="w-full">
      <label 
        htmlFor="image-upload" 
        className={`relative block w-full h-64 sm:h-80 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex justify-center items-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-300 ${preview ? 'bg-cover bg-center' : 'bg-gray-50 dark:bg-gray-700'}`}
        style={{ backgroundImage: preview ? `url(${preview})` : 'none' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${preview ? 'opacity-20 hover:opacity-40' : 'opacity-0'}`}></div>
        <div className="relative z-10 text-center p-4">
          <div className={`mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 ${preview ? 'text-white/80' : ''}`}>
            <UploadIcon />
          </div>
          <span className={`mt-2 block text-sm font-medium ${preview ? 'text-white/90' : 'text-gray-900 dark:text-gray-100'}`}>
            {preview ? 'Click or drag to change image' : 'Drag & drop or click to upload'}
          </span>
          <p className={`text-xs ${preview ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>PNG, JPG, WEBP up to 10MB</p>
        </div>
      </label>
      <input 
        id="image-upload" 
        name="image-upload" 
        type="file" 
        className="sr-only" 
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
};
