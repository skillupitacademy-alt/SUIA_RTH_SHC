/**
 * Production-safe Pino logger.
 * - Pretty printing only in development for local readability.
 * - Structured JSON in production; default level "warn" (override via LOG_LEVEL).
 * - Does NOT automatically log headers/bodies; callers control what is logged.
 */
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? (isProd ? 'warn' : 'debug');

export const logger = pino({
    level,
    transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        },
});
