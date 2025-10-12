import LoginClient from './LoginClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/login');

export default function Page() {
  return <LoginClient />;
}
