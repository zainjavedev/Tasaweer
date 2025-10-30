import { NextRequest, NextResponse } from 'next/server';

// Optional Google Custom Search integration.
// Set GOOGLE_CSE_ID and GOOGLE_CSE_KEY in env to enable.

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const cx = process.env.GOOGLE_CSE_ID;
  const key = process.env.GOOGLE_CSE_KEY;

  if (!cx || !key) {
    // Return a small placeholder list with informative message (no external call)
    return NextResponse.json({
      results: [],
      note: 'Apparel search not configured. Set GOOGLE_CSE_ID and GOOGLE_CSE_KEY.',
    });
  }

  // Search for images of apparel
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('q', q);
  url.searchParams.set('searchType', 'image');
  url.searchParams.set('imgType', 'photo');
  url.searchParams.set('safe', 'high');
  url.searchParams.set('cx', cx);
  url.searchParams.set('key', key);
  url.searchParams.set('num', '8');

  try {
    const r = await fetch(url.toString(), { cache: 'no-store' });
    if (!r.ok) throw new Error(`CSE failed: ${r.status}`);
    const j = await r.json();
    const items: any[] = j.items || [];
    const results: string[] = items.map((it: any) => it.link).filter((u: string) => typeof u === 'string');
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed' }, { status: 500 });
  }
}
