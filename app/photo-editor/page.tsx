import { Suspense } from 'react';
import PhotoEditorPage from '@/pages/PhotoEditorPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/photo-editor');

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PhotoEditorPage />
    </Suspense>
  );
}
