import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log all API requests
  if (pathname.startsWith('/api/')) {
    console.log(JSON.stringify({
      tag: 'MIDDLEWARE',
      message: '🔍 API Request intercepted',
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
