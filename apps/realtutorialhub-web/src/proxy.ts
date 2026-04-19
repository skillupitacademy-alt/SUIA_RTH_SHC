import { createAuthProxy } from '../../../src/share-branding/middleware/authProxy';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? 'https://user.realtutorialhub.com/login';

export const proxy = await createAuthProxy({
  brandLoginUrl: LOGIN_URL,
});

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
      missing: [
        { type: 'query', key: '_rsc' },
        { type: 'header', key: 'rsc' },
      ],
    },
  ],
};
