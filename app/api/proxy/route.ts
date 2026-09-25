import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get('url');
  if (!targetUrl) return new NextResponse('Missing url param', { status: 400 });

  try {
    const formattedUrl = new URL(targetUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000000);

    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Connection': 'close',
    };

    const clientIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (clientIp) {
      requestHeaders['X-Forwarded-For'] = clientIp;
      requestHeaders['X-Real-IP'] = clientIp;
    }

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      requestHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: requestHeaders
    }).finally(() => clearTimeout(timeout));

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Proxy failed with status: ${response.status}`, { status: response.status });
    }

    const responseHeaders = new Headers();
    const headersToForward = [
      'content-type',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];
    
    headersToForward.forEach(h => {
      const val = response.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Only forward content-length for media streams (206) where it's required for seeking
    if (response.status === 206) {
      const cl = response.headers.get('content-length');
      if (cl) responseHeaders.set('content-length', cl);
    }

    if (!responseHeaders.has('cache-control')) {
      responseHeaders.set('cache-control', 'public, max-age=86400');
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      return new NextResponse('Media server unreachable from cloud proxy (timeout)', { status: 504 });
    }
    console.error(`Proxy error fetching ${targetUrl}:`, err?.message || err);
    return new NextResponse(err?.message || 'Proxy error', { status: 500 });
  }
}
