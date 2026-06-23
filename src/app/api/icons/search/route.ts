import { NextRequest } from 'next/server';
import { searchFlaticon } from '@/lib/icons/flaticon';

/**
 * GET /api/icons/search?q=cloud
 *
 * Searches Flaticon and returns matching icons with CDN URLs.
 * Tries server-side HTML fetch first, falls back to curated map.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (!q.trim()) {
    return new Response(JSON.stringify({ error: 'Search query required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const icons = await searchFlaticon(q.trim());
    return new Response(JSON.stringify({ icons }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
