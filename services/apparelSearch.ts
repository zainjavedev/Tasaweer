// Client wrapper for apparel search via server route
import { authorizedFetch } from '@/utils/authClient';

export async function searchApparel(query: string): Promise<string[]> {
  const res = await authorizedFetch(`/api/search/apparel?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({} as any));
    throw new Error(payload.error || `Search failed (${res.status})`);
  }
  const data = await res.json();
  return data.results as string[];
}
