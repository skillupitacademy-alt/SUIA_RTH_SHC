
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // Protected Routes
  if (path.startsWith('/dashboard') || path.startsWith('/onboarding')) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
