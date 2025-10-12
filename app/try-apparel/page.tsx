import TryApparelPage from '@/pages/TryApparelPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/try-apparel');

export default function Page() {
  return <TryApparelPage />;
}
