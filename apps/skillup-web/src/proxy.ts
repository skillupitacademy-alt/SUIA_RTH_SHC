import { createAuthProxy, config as authProxyConfig } from '../../../src/share-branding/middleware/authProxy';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';

export const proxy = await createAuthProxy({
  brandLoginUrl: LOGIN_URL,
});

export const config = authProxyConfig;