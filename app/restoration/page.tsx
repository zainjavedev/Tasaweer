import RestorationPage from '@/pages/RestorationPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/restoration');

export default function Page() {
  return <RestorationPage />;
}
