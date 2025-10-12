import { Suspense } from 'react';
import GeminiWatermarkRemoverPage from '@/pages/GeminiWatermarkRemoverPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/gemini-watermark-remover');

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <GeminiWatermarkRemoverPage />
    </Suspense>
  );
}
