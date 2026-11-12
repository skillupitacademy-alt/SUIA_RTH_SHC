import { createAuthProxy, isPublicAuthRoute } from '../../../src/share-branding/middleware/authProxy';

export { isPublicAuthRoute };

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL?.trim();

export const proxy = await createAuthProxy({
  ...(LOGIN_URL ? { brandLoginUrl: LOGIN_URL } : {}),
});

export const config = {
  matcher: [
    '/api/:path*',
    // 🔒 SECURITY: Match ALL application routes including RSC requests
    // RSC requests MUST pass through authentication boundary
    // Previous config excluded RSC requests, creating security bypass
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
