import AuthGate from '@/components/AuthGate';
import MyImagesPage from '@/pages/MyImagesPage';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/myimages');

export default function Page() {
  return (
    <AuthGate>
      <MyImagesPage />
    </AuthGate>
  );
}
