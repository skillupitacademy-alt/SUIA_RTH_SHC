import pino from 'pino';

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level,
  serializers: pino.stdSerializers,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
