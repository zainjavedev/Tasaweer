import AdminClient from './AdminClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/admin');

export default function Page() {
  return <AdminClient />;
}
