/**
 * Local Development Configuration
 * This file is used when NODE_ENV !== 'production'
 */

export const config = {
  // CORS Configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
    ],
  },

  // CSRF Configuration
  csrf: {
    // Allow all localhost origins in development
    allowAllLocalhost: true,
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    cookieSettings: {
      httpOnly: false,
      secure: false,
      sameSite: 'strict' as const,
      domain: undefined,
    },
  },

  // Debug Settings
  debug: {
    logCsrf: true,
    logCors: true,
    logAuth: true,
  },
};
