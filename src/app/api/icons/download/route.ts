import { NextRequest } from 'next/server';

/**
 * GET /api/icons/download?id=3222791&size=512
 *
 * Proxies a Flaticon CDN image (public, no auth needed).
 * Returns the PNG bytes for use in PPTX generation.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  const size = request.nextUrl.searchParams.get('size') || '512';

  if (!id) {
    return new Response(JSON.stringify({ error: 'Icon ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prefix = id.slice(0, 4);
  const cdnUrl = `https://cdn-icons-png.flaticon.com/${size}/${prefix}/${id}.png`;

  try {
    const response = await fetch(cdnUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `CDN returned ${response.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to download icon' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
