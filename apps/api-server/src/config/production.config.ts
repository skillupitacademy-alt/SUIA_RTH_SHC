/**
 * Production Configuration
 * This file is used when NODE_ENV === 'production'
 */

export const config = {
  // CORS Configuration
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.NEXT_PUBLIC_WEB_APP_URL,
      process.env.NEXT_PUBLIC_ADMIN_URL,
    ]).map((o: string | undefined) => o?.trim()).filter(Boolean) as string[],
  },

  // CSRF Configuration
  csrf: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.NEXT_PUBLIC_WEB_APP_URL,
      process.env.NEXT_PUBLIC_ADMIN_URL,
    ]).map((o: string | undefined) => o?.trim()).filter(Boolean) as string[],
    cookieSettings: {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      domain: (() => {
        const raw = process.env.COOKIE_DOMAIN;
        return raw === undefined || raw === null || raw === '' ? undefined : raw;
      })(),
    },
  },

  // Debug Settings
  debug: {
    logCsrf: false,
    logCors: false,
    logAuth: false,
  },
};
