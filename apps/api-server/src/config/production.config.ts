/**
 * Production Configuration
 * This file is used when NODE_ENV === 'production'
 */

export const config = {
  // CORS Configuration
  cors: {
    allowedOrigins: [
      'https://quiz.realtutorialhub.com',
      'https://admin.realtutorialhub.com',
    ],
  },

  // CSRF Configuration
  csrf: {
    allowAllLocalhost: false,
    allowedOrigins: [
      'https://quiz.realtutorialhub.com',
      'https://admin.realtutorialhub.com',
    ],
    cookieSettings: {
      httpOnly: false,
      secure: true,
      sameSite: 'lax' as const,
      domain: '.realtutorialhub.com',
    },
  },

  // Debug Settings
  debug: {
    logCsrf: false,
    logCors: false,
    logAuth: false,
  },
};
