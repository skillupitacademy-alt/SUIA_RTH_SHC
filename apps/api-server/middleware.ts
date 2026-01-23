import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { TokenService } from './src/modules/auth/token.service';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      TokenService.verifyAccessToken(token);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
