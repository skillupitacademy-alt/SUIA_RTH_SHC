import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    console.log(JSON.stringify({
      tag: 'PROXY',
      message: 'API request intercepted',
      timestamp: new Date().toISOString(),
      method: request.method,
      pathname,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      },
    }));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
