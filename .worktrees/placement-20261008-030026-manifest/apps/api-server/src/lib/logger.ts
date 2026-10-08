/**
 * Production-safe Pino logger.
 * - Pretty printing only in development for local readability.
 * - Structured JSON in production; default level "warn" (override via LOG_LEVEL).
 * - Does NOT automatically log headers/bodies; callers control what is logged.
 */
import pino from 'pino';

import { getRequestId, getUserId } from './request-context';
import { getCorrelationId } from './trace.context';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? (isProd ? 'warn' : 'debug');

export const logger = pino({
    level,
    serializers: pino.stdSerializers,
    mixin() {
        const correlationId = getCorrelationId();
        const requestId = getRequestId();
        const userId = getUserId();
        return {
            ...(typeof correlationId === 'string' && correlationId.trim().length > 0 ? { correlationId } : {}),
            ...(typeof requestId === 'string' && requestId.trim().length > 0 ? { requestId } : {}),
            ...(typeof userId === 'string' && userId.trim().length > 0 ? { userId } : {}),
        };
    },
    formatters: {
        level: (label) => ({ level: label }),
    },
    redact: {
        paths: [
            // Auth secrets
            'password', 'token', 'authorization', 'cookie', 'accessToken', 'refreshToken',
            '*.password', '*.token', '*.authorization', '*.cookie', '*.accessToken', '*.refreshToken',
            // Personal Identifiable Information (PII)
            'email', '*.email',
            'phone', 'phoneNumber', '*.phone', '*.phoneNumber',
            'address', '*.address',
            'firstName', 'lastName', 'fullName', '*.firstName', '*.lastName', '*.fullName',
            'ssn', '*.ssn',
            'creditCard', 'cardNumber', 'cvv', '*.creditCard', '*.cardNumber', '*.cvv',
            'ip', 'ipAddress', '*.ip', '*.ipAddress',
        ],
        censor: '[REDACTED]',
    },
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
