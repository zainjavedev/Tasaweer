import HomePageClient from './HomePageClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/');

export default function Page() {
  return <HomePageClient />;
}
