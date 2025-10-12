import ObjectReplacementPage from '@/pages/ObjectReplacementPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/replace');

export default function Page() {
  return <ObjectReplacementPage />;
}
