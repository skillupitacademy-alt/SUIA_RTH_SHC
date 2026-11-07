import { Client, SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { createQStashHandler, PlatformEventTypes } from '@quiz/events';
import { ProjectRepository, db, tutorialProjectSubmissions, withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';
import { ProjectService } from '@/server/project.service';
import { eq } from 'drizzle-orm';
import {
  acquireWorkerLease,
  completeWorkerLeaseIfOwner,
  deriveDeterministicEventUuid,
  dispatchWorkerOutboxIntent,
  getWorkerOutboxIntent,
  releaseWorkerLeaseIfOwner,
  runInWorkerOutboxTransaction,
  upsertTransactionalOutboxIntent,
  upsertWorkerOutboxIntent,
  type WorkerRedisLike,
} from '../worker-lease';

export const dynamic = 'force-dynamic';

const AwardBadgeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('project.approved'),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: z.object({
    submissionId: z.string().uuid(),
    userId: z.string().uuid(),
    projectId: z.string().uuid(),
    badgeId: z.string().uuid(),
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

const getAppUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  const internalUrl = process.env.INTERNAL_API_URL;
  if (typeof publicUrl === 'string' && publicUrl.trim().length > 0) return publicUrl.trim();
  if (typeof internalUrl === 'string' && internalUrl.trim().length > 0) return internalUrl.trim();
  return 'https://user.realtutorialhub.com';
};

const badgeHandler = createQStashHandler(
  PlatformEventTypes.PROJECT_SUBMITTED,
  async (envelope) => {
    const payload = AwardBadgeSchema.parse(envelope);
    const { submissionId, userId, projectId, badgeId } = payload.data;
    const redis = createRedisClient();
    const redisKey = `badge-award:${submissionId}`;

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
      const projectRepository = new ProjectRepository();
      const submission = await withTimeout(
        projectRepository.getSubmission(submissionId),
        STANDARD_QUERY_TIMEOUT,
        'award-project-badge.getSubmission'
      );
      if (submission === undefined) {
        throw new Error('Project submission not found');
      }

      const alreadyAwarded = (submission as { badgeAwarded?: boolean }).badgeAwarded === true;
      if (alreadyAwarded) {
        const existingOutbox = getWorkerOutboxIntent(
          'realtutorialhub',
          'project.certificate_requested',
          submissionId
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
      }

      const projectService = new ProjectService();
      const project = await projectRepository.getProject(projectId);
      const eligibility = project !== undefined
        ? await projectService.checkCertificateEligibility(userId, project.scope, project.parentId)
        : { eligible: false };

      const rawUpdatedAt: unknown = (submission as { updatedAt?: unknown }).updatedAt;
      const canonicalOccurredAt =
        rawUpdatedAt instanceof Date
          ? rawUpdatedAt.toISOString()
          : typeof rawUpdatedAt === 'string' && rawUpdatedAt.trim().length > 0
            ? rawUpdatedAt
            : payload.occurredAt;

      let outboxIntent: ReturnType<typeof getWorkerOutboxIntent> = getWorkerOutboxIntent(
        'realtutorialhub',
        'project.certificate_requested',
        submissionId
      );

      if (!alreadyAwarded) {
        const txOutcome = await runInWorkerOutboxTransaction(db, async (tx) => {
          const txRepo = projectRepository.withDb(tx as never);
          await txRepo.awardBadge(userId, badgeId, submissionId);
          await withTimeout(
            tx
              .update(tutorialProjectSubmissions)
              .set({
                badgeAwarded: true,
                updatedAt: new Date(),
              })
              .where(eq(tutorialProjectSubmissions.id, submissionId)),
            STANDARD_QUERY_TIMEOUT,
            'award-project-badge.mark-badge-awarded'
          );

          if (project !== undefined && eligibility.eligible) {
            const deterministicEventId = deriveDeterministicEventUuid(
              `realtutorialhub:project.certificate_requested:${submissionId}`
            );

            const intent = await upsertTransactionalOutboxIntent(
              {
                tenantId: 'realtutorialhub',
                eventType: 'project.certificate_requested',
                aggregateId: submissionId,
                eventId: deterministicEventId,
                ownerToken: claim.ownerToken,
                payload: {
                  userId,
                  scope: project.scope,
                  parentId: project.parentId,
                  parentName: project.title,
                },
                envelope: {
                  id: deterministicEventId,
                  type: 'project.certificate_requested',
                  correlationId: submission.id,
                  source: 'quiz-platform',
                  occurredAt: canonicalOccurredAt,
                  version: 1,
                  data: {
                    userId,
                    scope: project.scope,
                    parentId: project.parentId,
                    parentName: project.title,
                  },
                },
              },
              tx
            );
            return { intent };
          }

          return { intent: undefined };
        });

        if (txOutcome.intent) {
          outboxIntent = txOutcome.intent;
        }
      } else if (outboxIntent === undefined && project !== undefined && eligibility.eligible) {
        const deterministicEventId = deriveDeterministicEventUuid(
          `realtutorialhub:project.certificate_requested:${submissionId}`
        );
        outboxIntent = upsertWorkerOutboxIntent({
          tenantId: 'realtutorialhub',
          eventType: 'project.certificate_requested',
          aggregateId: submissionId,
          eventId: deterministicEventId,
          ownerToken: claim.ownerToken,
          payload: {
            userId,
            scope: project.scope,
            parentId: project.parentId,
            parentName: project.title,
          },
          envelope: {
            id: deterministicEventId,
            type: 'project.certificate_requested',
            correlationId: submission.id,
            source: 'quiz-platform',
            occurredAt: canonicalOccurredAt,
            version: 1,
            data: {
              userId,
              scope: project.scope,
              parentId: project.parentId,
              parentName: project.title,
            },
          },
        });
      }

      if (outboxIntent !== undefined) {
        const token = process.env.QSTASH_TOKEN;
        if (typeof token === 'string' && token.trim().length > 0) {
          await dispatchWorkerOutboxIntent(outboxIntent, claim.ownerToken, async (intent) => {
            const client = new Client({ token });
            const storedEnvelope = intent.envelope ?? {};
            await client.publishJSON({
              url: new URL('/api/workers/issue-certificate', getAppUrl()).toString(),
              retries: 3,
              body: {
                id: intent.eventId,
                type: 'project.certificate_requested',
                correlationId:
                  typeof storedEnvelope.correlationId === 'string'
                    ? storedEnvelope.correlationId
                    : submission.id,
                source:
                  typeof storedEnvelope.source === 'string'
                    ? storedEnvelope.source
                    : 'quiz-platform',
                occurredAt:
                  typeof storedEnvelope.occurredAt === 'string'
                    ? storedEnvelope.occurredAt
                    : canonicalOccurredAt,
                version:
                  typeof storedEnvelope.version === 'number'
                    ? storedEnvelope.version
                    : 1,
                data: intent.payload,
              },
            });
          });
        }
      }

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
        event: 'project.badge_awarded',
        submissionId,
        userId,
        projectId,
        badgeId,
      });

      return new Response('ok', { status: 200 });
    } catch (error) {
      await releaseWorkerLeaseIfOwner(redis, redisKey, claim.pendingValue).catch(() => undefined);
      throw error;
    }
  },
  {
    schema: AwardBadgeSchema,
    allowedTypes: ['project.approved'],
    tenantScope: 'realtutorialhub',
  }
);

export async function POST(req: Request): Promise<Response> {
  try {
    return await badgeHandler(req);
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    logger.error({
      event: 'project.badge_award_failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response('error', { status: 500 });
  }
}
