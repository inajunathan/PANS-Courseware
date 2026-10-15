import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * CORS pre-flight handler for PDF streaming proxy
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

/**
 * High-performance PDF streaming proxy
 * Eliminates CORS restrictions and browser sandboxing for remote Supabase Storage PDFs
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let targetUrl = searchParams.get('url');

  // Handle base64 encoded URL fallback
  const b64 = searchParams.get('b64');
  if (b64) {
    try {
      targetUrl = Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      // ignore
    }
  }

  // Handle unencoded query ampersands (e.g. ".../PDF Files & Slides/...")
  if (!targetUrl) {
    const rawSearch = request.nextUrl.search;
    const urlIdx = rawSearch.indexOf('url=');
    if (urlIdx !== -1) {
      targetUrl = rawSearch.slice(urlIdx + 4);
    }
  } else {
    // If targetUrl exists but was split at an ampersand, reconstruct from raw search
    const rawSearch = request.nextUrl.search;
    const urlIdx = rawSearch.indexOf('url=');
    if (urlIdx !== -1) {
      const rawAfter = rawSearch.slice(urlIdx + 4);
      if (rawAfter.startsWith('http') && rawAfter.length > targetUrl.length) {
        targetUrl = rawAfter;
      }
    }
  }

  if (!targetUrl) {
    return new NextResponse('Missing url query parameter', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    // Parse into standard URL object to validate and normalize spaces to %20
    const urlObj = new URL(decodedUrl);

    // Permitted storage domains
    const isAllowedHost =
      urlObj.hostname.includes('supabase.co') ||
      urlObj.hostname.includes('githubusercontent.com') ||
      urlObj.hostname.includes('mozilla.github.io') ||
      urlObj.hostname.includes('vercel.app');

    if (!isAllowedHost) {
      return new NextResponse('Host not permitted by PDF streaming proxy', { status: 403 });
    }

    const upstreamResponse = await fetch(urlObj.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PANS-Courseware-Hub/1.0',
        'Accept': 'application/pdf,*/*',
      },
      cache: 'force-cache',
    });

    if (!upstreamResponse.ok) {
      // If direct fetch returns an error from upstream, redirect to the direct URL as fallback
      return NextResponse.redirect(urlObj.href, { status: 302 });
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const contentType = upstreamResponse.headers.get('content-type') || 'application/pdf';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    return new NextResponse(`PDF Streaming Proxy Error: ${error.message}`, { status: 500 });
  }
}
