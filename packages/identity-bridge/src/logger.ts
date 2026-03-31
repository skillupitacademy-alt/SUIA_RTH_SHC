import pino from 'pino';

export const logger = pino({
  name: 'identity-bridge',
  level: process.env.LOG_LEVEL ?? 'info',
});
