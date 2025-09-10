
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="relative w-24 h-24">
        <div className="absolute border-4 border-solid border-indigo-200 dark:border-indigo-800 rounded-full w-full h-full"></div>
        <div className="absolute border-4 border-solid border-indigo-600 dark:border-indigo-400 rounded-full w-full h-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};
