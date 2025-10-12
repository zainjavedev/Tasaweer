import ProfileClient from './ProfileClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/profile');

export default function Page() {
  return <ProfileClient />;
}
