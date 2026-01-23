import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { rateLimit } from '@/modules/auth/rate-limit.middleware';
import { csrfProtection } from '@/modules/auth/csrf.middleware';

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting
  const rateLimitResponse = await rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. CSRF Protection
  const csrfResponse = await csrfProtection(request);
  if (csrfResponse) return csrfResponse;

  // 3. Auth Protection
  const token = request.cookies.get('accessToken')?.value;
  // ... rest of middleware

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
