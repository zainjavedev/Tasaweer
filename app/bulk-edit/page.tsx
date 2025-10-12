import BulkEditClient from './BulkEditClient';
import { buildPageMetadata } from '@/lib/seoMetadata';

export const metadata = buildPageMetadata('/bulk-edit');

export default function Page() {
  return <BulkEditClient />;
}
