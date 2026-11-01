import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminMutationOrigin, requireAdminRequest } from '@/lib/admin-route-guard';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/api/health') return NextResponse.next();
  const publicAuth = path === '/api/auth/login' || path === '/api/auth/logout';
  const denied = publicAuth
    ? requireAdminMutationOrigin(request)
    : await requireAdminRequest(request);
  if (denied) return denied;
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
