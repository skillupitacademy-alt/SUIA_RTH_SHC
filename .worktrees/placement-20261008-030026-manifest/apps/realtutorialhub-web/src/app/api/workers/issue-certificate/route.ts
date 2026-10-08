import { SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { createQStashHandler, PlatformEventTypes, publishEvent } from '@quiz/events';
import { certificates, db, withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';
import { eq, and, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const IssueCertificateSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('project.certificate_requested'),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: z.object({
    userId: z.string().uuid(),
    scope: z.enum(['topic', 'subject', 'domain']),
    parentId: z.string().uuid(),
    parentName: z.string().min(1),
  }),
});

const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (typeof url !== 'string' || url.trim().length === 0 || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }
  return new Redis({ url, token });
};

const handler = createQStashHandler(
  PlatformEventTypes.CERTIFICATE_ISSUED,
  async (envelope) => {
    const payload = IssueCertificateSchema.parse(envelope);
    const { userId, scope, parentId, parentName } = payload.data;
    const redis = createRedisClient();
    const redisKey = `cert:${userId}:${scope}:${parentId}`;

    const existing = await redis.get(redisKey);
    if (existing !== null && String(existing).trim().length > 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const claimed = await redis.set(redisKey, 'processing', { ex: 86_400, nx: true });
    if (claimed == null || String(claimed).trim().length === 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const existingCertificate = await withTimeout(
      db
        .select()
        .from(certificates)
        .where(and(eq(certificates.userId, userId), eq(certificates.scope, scope), eq(certificates.parentId, parentId), isNull(certificates.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'issue-certificate.lookup'
    );

    if (existingCertificate.length > 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const created = await db.transaction(async (tx) => {
      const [row] = await withTimeout(
        tx
          .insert(certificates)
          .values({
            userId,
            scope,
            parentId,
            parentName,
            verificationCode: crypto.randomUUID(),
            pdfUrl: null,
            issuedAt: new Date(),
            expiresAt: null,
            version: 1,
            deletedAt: null,
          })
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'issue-certificate.insert'
      );

      return row;
    });

    if (created === undefined) {
      throw new Error('Failed to issue certificate');
    }

    await publishEvent(
      PlatformEventTypes.CERTIFICATE_ISSUED,
      {
        certificateId: created.id,
        userId,
        issuedAt: created.issuedAt.toISOString(),
      },
      {
        destinationUrl: process.env.CERTIFICATE_ISSUED_EVENT_URL ?? 'https://placeholder.invalid/consumers/certificate-issued',
      }
    );

    logger.info({
      event: 'certificate.issued',
      userId,
      scope,
      parentId,
      certificateId: created.id,
    });

    return NextResponse.json({
      data: {
        certificateId: created.id,
        verificationCode: created.verificationCode,
      },
    });
  },
  {
    schema: IssueCertificateSchema,
  }
);

export async function POST(req: Request): Promise<Response> {
  try {
    return await handler(req);
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    logger.error({
      event: 'certificate.issue_failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response('error', { status: 500 });
  }
}
