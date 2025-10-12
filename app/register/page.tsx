import RegisterClient from './RegisterClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/register');

export default function Page() {
  return <RegisterClient />;
}
