// Lightweight client-side logger for the web app.
// - Uses console under the hood but centralizes formatting and level control.
// - No headers/bodies/tokens; caller passes only safe strings/objects.
// - In production, logs only warn/error to avoid noise.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

import { getApiBase } from "./apiBase";

const isProd = process.env.NODE_ENV === 'production';
const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel: LogLevel = isProd ? 'warn' : 'debug';
const LOG_ENDPOINT = `${getApiBase()}/logs/client`;

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[minLevel];
}

function scrubPII(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted]')
      .replace(/bearer\s+[A-Z0-9._-]+/gi, 'bearer [redacted]')
      .replace(/(x-internal-key|x-api-key|token|password|secret)=[^&\s]+/gi, '$1=[redacted]');
  }
  if (Array.isArray(input)) return input.map(scrubPII);
  if (typeof input === 'object' && input !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
        out[key] = scrubPII(val);
    }
    return out;
  }
  return input;
}

async function sendToServer(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) setTimeout(() => controller.abort(), 1500);

    const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('quiz_session_id') || sessionStorage.getItem('admin_session_id') || 'no-session') : 'unknown';
    const requestId = typeof window !== 'undefined' ? (sessionStorage.getItem('last_request_id') || 'no-request') : 'unknown';

    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        level,
        message: scrubPII(message),
        meta: scrubPII(meta),
        sessionId,
        requestId,
        source: 'web-app',
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      }),
      credentials: 'include',
      keepalive: true,
      signal: controller?.signal,
    });
  } catch {
    // Swallow errors
  }
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  void sendToServer(level, message, meta);
}

export const clientLogger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
