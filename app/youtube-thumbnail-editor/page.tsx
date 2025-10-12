import { Suspense } from 'react';
import YouTubeThumbnailEditorPage from '@/pages/YouTubeThumbnailEditorPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/youtube-thumbnail-editor');

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <YouTubeThumbnailEditorPage />
    </Suspense>
  );
}
