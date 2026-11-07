import { SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import * as eventsModule from '@quiz/events';
const { createQStashHandler, PlatformEventTypes, publishEvent } = eventsModule;
const createEventEnvelope =
  'createEventEnvelope' in eventsModule
    ? (eventsModule as Record<string, unknown>).createEventEnvelope
    : undefined;
import { certificates, db, withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';
import { eq, and, isNull } from 'drizzle-orm';
import {
  acquireWorkerLease,
  completeWorkerLeaseIfOwner,
  deriveDeterministicEventUuid,
  dispatchWorkerOutboxIntent,
  findAuthoritativeWorkerOutboxIntent,
  releaseWorkerLeaseIfOwner,
  resolveWorkerOutboxRepository,
  runInWorkerOutboxTransaction,
  upsertTransactionalOutboxIntent,
  type WorkerRedisLike,
} from '../worker-lease';

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

const createRedisClient = (): WorkerRedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (typeof url !== 'string' || url.trim().length === 0 || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }
  return new Redis({ url, token }) as unknown as WorkerRedisLike;
};

const handler = createQStashHandler(
  PlatformEventTypes.CERTIFICATE_ISSUED,
  async (envelope) => {
    const payload = IssueCertificateSchema.parse(envelope);
    const { userId, scope, parentId, parentName } = payload.data;
    const redis = createRedisClient();
    const redisKey = `cert:${userId}:${scope}:${parentId}`;

    const claim = await acquireWorkerLease(redis, redisKey, {
      leaseSeconds: 300,
      pendingPrefix: 'processing',
    });

    if (claim.kind === 'already-completed') {
      return new Response('Duplicate event ignored', { status: 200 });
    }
    if (claim.kind === 'busy') {
      return new Response('Event claim not acquired', { status: 409 });
    }

    try {
      const existingCertificate = await withTimeout(
        db
          .select()
          .from(certificates)
          .where(and(eq(certificates.userId, userId), eq(certificates.scope, scope), eq(certificates.parentId, parentId), isNull(certificates.deletedAt))),
        STANDARD_QUERY_TIMEOUT,
        'issue-certificate.lookup'
      );

      const outboxRepository = await resolveWorkerOutboxRepository(db);

      if (existingCertificate.length > 0) {
        const existingRow = existingCertificate[0]!;
        const existingOutbox = await findAuthoritativeWorkerOutboxIntent(
          outboxRepository,
          'realtutorialhub',
          PlatformEventTypes.CERTIFICATE_ISSUED,
          existingRow.id
        );
        if (existingOutbox?.status === 'published') {
          const reconciled = await completeWorkerLeaseIfOwner(
            redis,
            redisKey,
            claim.pendingValue,
            'processed',
            86_400
          );
          if (reconciled !== 'applied') {
            return new Response('Event lease ownership lost before completion', { status: 409 });
          }
          return new Response('Duplicate event ignored', { status: 200 });
        }

        const rawIssuedAt: unknown = existingRow.issuedAt;
        const issuedAtIso =
          rawIssuedAt instanceof Date
            ? rawIssuedAt.toISOString()
            : typeof rawIssuedAt === 'string' && rawIssuedAt.trim().length > 0
              ? rawIssuedAt
              : new Date().toISOString();

        const deterministicEventId = deriveDeterministicEventUuid(
          `realtutorialhub:${PlatformEventTypes.CERTIFICATE_ISSUED}:${existingRow.id}`
        );

        const canonicalRecoveryEnvelope =
          existingOutbox?.envelope ??
          (typeof createEventEnvelope === 'function'
            ? createEventEnvelope(
                PlatformEventTypes.CERTIFICATE_ISSUED,
                {
                  certificateId: existingRow.id,
                  userId,
                  issuedAt: issuedAtIso,
                },
                {
                  id: deterministicEventId,
                  correlationId: parentId,
                  source: 'realtutorialhub',
                  occurredAt: issuedAtIso,
                  version: 1,
                }
              )
            : {
                id: deterministicEventId,
                type: PlatformEventTypes.CERTIFICATE_ISSUED,
                correlationId: parentId,
                source: 'realtutorialhub',
                occurredAt: issuedAtIso,
                version: 1,
                data: {
                  certificateId: existingRow.id,
                  userId,
                  issuedAt: issuedAtIso,
                },
              });

        const recoveryIntent =
          existingOutbox ??
          (await upsertTransactionalOutboxIntent(
            {
              tenantId: 'realtutorialhub',
              eventType: PlatformEventTypes.CERTIFICATE_ISSUED,
              aggregateId: existingRow.id,
              eventId: deterministicEventId,
              ownerToken: claim.ownerToken,
              payload: {
                certificateId: existingRow.id,
                userId,
                issuedAt: issuedAtIso,
              },
              envelope: canonicalRecoveryEnvelope as Record<string, unknown>,
            },
            outboxRepository
          ));

        const qstashToken = process.env.QSTASH_TOKEN;
        if (typeof qstashToken !== 'string' || qstashToken.trim().length === 0) {
          throw new Error('QSTASH_TOKEN is required to publish pending certificate.issued event');
        }

        await dispatchWorkerOutboxIntent(
          recoveryIntent,
          claim.ownerToken,
          async (intent) => {
            const storedEnvelope = (intent.envelope ?? canonicalRecoveryEnvelope) as Record<string, unknown>;
            await publishEvent(
              PlatformEventTypes.CERTIFICATE_ISSUED,
              {
                certificateId: existingRow.id,
                userId,
                issuedAt: issuedAtIso,
              },
              {
                id: intent.eventId,
                tenantId: 'realtutorialhub',
                correlationId:
                  typeof storedEnvelope.correlationId === 'string'
                    ? storedEnvelope.correlationId
                    : parentId,
                source:
                  typeof storedEnvelope.source === 'string'
                    ? storedEnvelope.source
                    : 'realtutorialhub',
                occurredAt:
                  typeof storedEnvelope.occurredAt === 'string'
                    ? storedEnvelope.occurredAt
                    : issuedAtIso,
                version:
                  typeof storedEnvelope.version === 'number'
                    ? storedEnvelope.version
                    : 1,
                envelope: storedEnvelope as never,
                destinationUrl:
                  process.env.CERTIFICATE_ISSUED_EVENT_URL ??
                  'https://placeholder.invalid/consumers/certificate-issued',
              }
            );
          },
          outboxRepository
        );

        const reconciled = await completeWorkerLeaseIfOwner(
          redis,
          redisKey,
          claim.pendingValue,
          'processed',
          86_400
        );
        if (reconciled !== 'applied') {
          return new Response('Event lease ownership lost before completion', { status: 409 });
        }

        logger.info({
          event: 'certificate.issued.reconciled',
          userId,
          scope,
          parentId,
          certificateId: existingRow.id,
        });

        return NextResponse.json({
          data: {
            certificateId: existingRow.id,
            verificationCode: existingRow.verificationCode,
          },
        });
      }

      const { created, outboxIntent } = await runInWorkerOutboxTransaction(db, async (tx) => {
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

        if (row === undefined) {
          throw new Error('Failed to issue certificate');
        }

        const deterministicEventId = deriveDeterministicEventUuid(
          `realtutorialhub:${PlatformEventTypes.CERTIFICATE_ISSUED}:${row.id}`
        );

        const canonicalEnvelope =
          typeof createEventEnvelope === 'function'
            ? createEventEnvelope(
                PlatformEventTypes.CERTIFICATE_ISSUED,
                {
                  certificateId: row.id,
                  userId,
                  issuedAt: row.issuedAt.toISOString(),
                },
                {
                  id: deterministicEventId,
                  correlationId: parentId,
                  source: 'realtutorialhub',
                  occurredAt: row.issuedAt.toISOString(),
                  version: 1,
                }
              )
            : {
                id: deterministicEventId,
                type: PlatformEventTypes.CERTIFICATE_ISSUED,
                correlationId: parentId,
                source: 'realtutorialhub',
                occurredAt: row.issuedAt.toISOString(),
                version: 1,
                data: {
                  certificateId: row.id,
                  userId,
                  issuedAt: row.issuedAt.toISOString(),
                },
              };

        const intent = await upsertTransactionalOutboxIntent(
          {
            tenantId: 'realtutorialhub',
            eventType: PlatformEventTypes.CERTIFICATE_ISSUED,
            aggregateId: row.id,
            eventId: deterministicEventId,
            ownerToken: claim.ownerToken,
            payload: {
              certificateId: row.id,
              userId,
              issuedAt: row.issuedAt.toISOString(),
            },
            envelope: canonicalEnvelope as Record<string, unknown>,
          },
          tx
        );

        return { created: row, outboxIntent: intent };
      });

      const qstashToken = process.env.QSTASH_TOKEN;
      if (typeof qstashToken !== 'string' || qstashToken.trim().length === 0) {
        throw new Error('QSTASH_TOKEN is required to publish certificate.issued event');
      }

      await dispatchWorkerOutboxIntent(
        outboxIntent,
        claim.ownerToken,
        async (intent) => {
          const storedEnvelope = (intent.envelope ?? {}) as Record<string, unknown>;
          await publishEvent(
            PlatformEventTypes.CERTIFICATE_ISSUED,
            {
              certificateId: created.id,
              userId,
              issuedAt: created.issuedAt.toISOString(),
            },
            {
              id: intent.eventId,
              tenantId: 'realtutorialhub',
              correlationId:
                typeof storedEnvelope.correlationId === 'string'
                  ? storedEnvelope.correlationId
                  : parentId,
              source:
                typeof storedEnvelope.source === 'string'
                  ? storedEnvelope.source
                  : 'realtutorialhub',
              occurredAt:
                typeof storedEnvelope.occurredAt === 'string'
                  ? storedEnvelope.occurredAt
                  : created.issuedAt.toISOString(),
              version:
                typeof storedEnvelope.version === 'number'
                  ? storedEnvelope.version
                  : 1,
              envelope: intent.envelope as never,
              destinationUrl:
                process.env.CERTIFICATE_ISSUED_EVENT_URL ??
                'https://placeholder.invalid/consumers/certificate-issued',
            }
          );
        },
        outboxRepository
      );

      const completionTransition = await completeWorkerLeaseIfOwner(
        redis,
        redisKey,
        claim.pendingValue,
        'processed',
        86_400
      );
      if (completionTransition !== 'applied') {
        return new Response('Event lease ownership lost before completion', { status: 409 });
      }

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
    } catch (error) {
      await releaseWorkerLeaseIfOwner(redis, redisKey, claim.pendingValue).catch(() => undefined);
      throw error;
    }
  },
  {
    schema: IssueCertificateSchema,
    allowedTypes: ['project.certificate_requested'],
    tenantScope: 'realtutorialhub',
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
