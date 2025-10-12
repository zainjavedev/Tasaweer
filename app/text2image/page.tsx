import TextToImagePage from '@/pages/TextToImagePage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/text2image');

export default function Page() {
  return <TextToImagePage />;
}
