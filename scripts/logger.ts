import pino from 'pino';

type Level = 'debug' | 'info' | 'warn' | 'error';

const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level | 'trace' | 'fatal' | 'silent';
const level: Level | 'silent' =
  envLevel === 'trace' ? 'debug' // map trace to debug for scripts
    : envLevel === 'fatal' ? 'error'
    : envLevel === 'silent' ? 'silent'
    : (['debug', 'info', 'warn', 'error'] as Level[]).includes(envLevel as Level)
      ? (envLevel as Level)
      : 'info';

const logger = pino({
  level,
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          translateTime: 'SYS:standard',
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
});

export const scriptLogger = {
  debug: (msg: string, meta?: unknown) => logger.debug(meta ?? {}, msg),
  info: (msg: string, meta?: unknown) => logger.info(meta ?? {}, msg),
  warn: (msg: string, meta?: unknown) => logger.warn(meta ?? {}, msg),
  error: (msg: string, meta?: unknown) => logger.error(meta ?? {}, msg),
};

export default scriptLogger;
