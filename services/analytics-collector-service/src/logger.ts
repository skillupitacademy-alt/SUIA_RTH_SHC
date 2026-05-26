import pino from 'pino';

export const logger = pino({
  name: 'analytics-collector-service',
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['authorization', 'token', 'accessToken', 'refreshToken'],
    remove: true,
  },
});
