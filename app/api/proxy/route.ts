import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get('url');
  if (!targetUrl) return new NextResponse('Missing url param', { status: 400 });

  try {
    const formattedUrl = new URL(targetUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return new NextResponse(`Proxy failed with status: ${response.status}`, { status: response.status });
    }
    const html = await response.text();
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return new NextResponse('Media server unreachable from cloud proxy (timeout)', { status: 504 });
    }
    console.error(`Proxy error fetching ${targetUrl}:`, error?.message || error);
    return new NextResponse(error?.message || 'Proxy error', { status: 500 });
  }
}
