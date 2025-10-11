import React, { useEffect, useState } from 'react';
import { getUserImages, removeUserImage, clearUserImages } from '../utils/userImages';
import { UserImage } from '../types';
import Lightbox from '@/components/Lightbox';

const MyImagesPage: React.FC = () => {
  const [items, setItems] = useState<UserImage[]>([]);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

  const reload = () => setItems(getUserImages());

  useEffect(() => { reload(); }, []);

  const onDelete = (id: string) => {
    removeUserImage(id);
    reload();
  };

  const onClear = () => {
    if (confirm('Clear all saved images?')) {
      clearUserImages();
      reload();
    }
  };

  const downloadImage = (url: string, name = 'image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const openPreview = (url: string, name: string) => {
    setLightbox({ url, name });
  };

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Images</h2>
          <p className="text-gray-600 dark:text-gray-400">Your generated results are saved on this device.</p>
        </div>
        {items.length > 0 && (
          <button onClick={onClear} className="self-start sm:self-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Clear all</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 p-8">No saved images yet. Generate some and they’ll appear here.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border overflow-hidden bg-white dark:bg-gray-800">
              {it.original && (
                <div className="p-2 grid grid-cols-2 gap-2 border-b">
                  <div className="bg-gray-50 dark:bg-gray-900/30 p-2 flex items-center justify-center">
                    <img
                      src={it.original}
                      alt="original"
                      className="max-w-full h-auto cursor-zoom-in object-contain"
                      onClick={() => openPreview(it.original, `${it.kind}-${it.id}-original.png`)}
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 border-2 border-purple-500 flex items-center justify-center">
                    <img
                      src={it.generated}
                      alt="generated"
                      className="max-w-full h-auto cursor-zoom-in object-contain"
                      onClick={() => openPreview(it.generated, `${it.kind}-${it.id}-generated.png`)}
                    />
                  </div>
                </div>
              )}
              {!it.original && (
                <div className="p-2 flex items-center justify-center border-b">
                  <img
                    src={it.generated}
                    alt="generated"
                    className="max-w-full h-auto cursor-zoom-in object-contain"
                    onClick={() => openPreview(it.generated, `${it.kind}-${it.id}.png`)}
                  />
                </div>
              )}
              <div className="p-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <div><span className="font-semibold">Type:</span> {it.kind}</div>
                {it.prompt && <div><span className="font-semibold">Prompt:</span> {it.prompt}</div>}
                <div><span className="font-semibold">Saved:</span> {new Date(it.createdAt).toLocaleString()}</div>
              </div>
              <div className="p-3 flex justify-end gap-2">
                <button onClick={() => downloadImage(it.generated, `${it.kind}-${it.id}.png`)} className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700">Download</button>
                <button onClick={() => onDelete(it.id)} className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-700 border text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox
        imageUrl={lightbox?.url}
        onClose={() => setLightbox(null)}
        title="Saved image preview"
        alt="Saved image preview"
        onDownload={lightbox ? () => downloadImage(lightbox.url, lightbox.name) : undefined}
      />
    </div>
  );
};

export default MyImagesPage;
