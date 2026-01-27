/**
 * Production Configuration
 * This file is used when NODE_ENV === 'production'
 */

export const config = {
  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://quiz.realtutorialhub.com',
      'https://admin.realtutorialhub.com',
    ],
  },

  // CSRF Configuration
  csrf: {
    allowAllLocalhost: false,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://quiz.realtutorialhub.com',
      'https://admin.realtutorialhub.com',
    ],
    cookieSettings: {
      httpOnly: false,
      secure: true,
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || '.realtutorialhub.com',
    },
  },

  // Debug Settings
  debug: {
    logCsrf: false,
    logCors: false,
    logAuth: false,
  },
};
