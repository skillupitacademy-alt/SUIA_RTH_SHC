// Lightweight client-side logger.
// - Uses console under the hood but centralizes formatting and level control.
// - No headers/bodies/tokens; caller passes only safe strings/objects.
// - Defaults to warn in production to avoid noisy logs; debug only in dev.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';
const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel: LogLevel = isProd ? 'warn' : 'debug';

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[minLevel];
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = meta ? { ...meta } : undefined;
  // eslint-disable-next-line no-console
  (console as Console)[level]?.(message, payload);
}

export const clientLogger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
