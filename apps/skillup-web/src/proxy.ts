import { createAuthProxy } from '../../../src/share-branding/middleware/authProxy';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? 'https://user.skillupitacademy.com/login';

export const proxy = await createAuthProxy({
  brandLoginUrl: LOGIN_URL,
});

export const config = {
  matcher: [
    // 🔒 SECURITY: Match ALL application routes including RSC requests
    // RSC requests MUST pass through authentication boundary
    // Previous config excluded RSC requests, creating security bypass
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
  ],
};
