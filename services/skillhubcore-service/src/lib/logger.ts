import pino from 'pino';

export const logger = pino({
  name: 'skillhubcore-service',
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['password', 'passwordHash', 'refreshToken', 'accessToken', 'token', 'authorization'],
    remove: true,
  },
});
