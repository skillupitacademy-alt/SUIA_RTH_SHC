import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/logger';

const MAX_BODY_BYTES = 2_048;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const payloadSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  message: z.string().min(1).max(500),
  meta: z.record(z.unknown()).optional(),
  source: z.string().max(50).optional(),
  path: z.string().max(300).optional(),
});

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function bucketFor(key: string): Bucket {
  const now = Date.now();
  const existing = buckets.get(key);
  if (existing && existing.resetAt > now) return existing;
  const bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  buckets.set(key, bucket);
  return bucket;
}

function rateLimited(key: string): boolean {
  const bucket = bucketFor(key);
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function scrubPII(input: string): string {
  // Basic scrubbing: emails and bearer tokens
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const bearerRegex = /bearer\s+[A-Z0-9._-]+/gi;
  return input.replace(emailRegex, '[redacted-email]').replace(bearerRegex, 'bearer [redacted]');
}

function shallowScrubMeta(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'string') {
      out[k] = scrubPII(v).slice(0, 500);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else {
      out[k] = '[redacted-object]';
    }
  }
  return out;
}

function sample(level: string): boolean {
  if (level === 'warn' || level === 'error') return true;
  // drop debug/info in production
  return process.env.NODE_ENV !== 'production';
}

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";

async function handler(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';
  const reqId = req.headers.get('x-request-id') ?? crypto.randomUUID();

  const contentLength = req.headers.get('content-length');
  if (contentLength !== null) {
    const size = Number(contentLength);
    if (!Number.isNaN(size) && size > MAX_BODY_BYTES) {
      return NextResponse.json({ message: 'Payload too large' }, { status: 413 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const { level, message, meta, source, path } = parsed.data;
  if (!sample(level)) {
    return NextResponse.json({ status: 'dropped' });
  }

  const rateKey = `${ip}:${source ?? 'client'}`;
  if (rateLimited(rateKey)) {
    return NextResponse.json({ message: 'Rate limited' }, { status: 429 });
  }

  const safeMessage = scrubPII(message);
  const safeMeta = shallowScrubMeta(meta);

  const log = logger.child({
    route: 'client-log',
    source: source ?? 'web-app',
    ip,
    ua,
    path,
    reqId,
  });

  if (safeMeta && Object.keys(safeMeta).length > 0) {
    log[level]({ meta: safeMeta }, safeMessage);
  } else {
    log[level](safeMessage);
  }

  const durationMs = Date.now() - start;
  recordCounter('system.api.logs.client.count', 1, { level, source: source ?? 'web-app' });
  recordTimer('system.api.logs.client.duration', durationMs, { outcome: 'success' });
  return NextResponse.json({ status: 'ok', reqId }, {
    headers: { 'X-Duration-Ms': durationMs.toString() }
  });
}

export const POST = withLogging(handler, { component: 'telemetry', operation: 'ingest_client_logs' });
