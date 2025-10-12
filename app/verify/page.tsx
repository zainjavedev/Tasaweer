import { Suspense } from 'react';
import VerifyClient from './VerifyClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/verify');

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <VerifyClient />
    </Suspense>
  );
}
