import { Client, SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { createQStashHandler, PlatformEventTypes } from '@quiz/events';
import { ProjectRepository, db, tutorialProjectSubmissions, withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';
import { ProjectService } from '@/server/project.service';
import { eq } from 'drizzle-orm';

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

const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (typeof url !== 'string' || url.trim().length === 0 || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }
  return new Redis({ url, token });
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

    const existing = await redis.get(redisKey);
    if (existing !== null && String(existing).trim().length > 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const claimed = await redis.set(redisKey, 'processing', { ex: 86_400, nx: true });
    if (claimed == null || String(claimed).trim().length === 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const projectRepository = new ProjectRepository();
    const submission = await withTimeout(
      projectRepository.getSubmission(submissionId),
      STANDARD_QUERY_TIMEOUT,
      'award-project-badge.getSubmission'
    );
    if (submission === undefined) {
      throw new Error('Project submission not found');
    }

    await db.transaction(async (tx) => {
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
    });

    const projectService = new ProjectService();
    const project = await projectRepository.getProject(projectId);
    if (project !== undefined) {
      const eligibility = await projectService.checkCertificateEligibility(userId, project.scope, project.parentId);
      if (eligibility.eligible) {
        const token = process.env.QSTASH_TOKEN;
        if (typeof token === 'string' && token.trim().length > 0) {
          const client = new Client({ token });
          await client.publishJSON({
            url: new URL('/api/workers/issue-certificate', getAppUrl()).toString(),
            retries: 3,
            body: {
              id: crypto.randomUUID(),
              type: 'project.certificate_requested',
              correlationId: submission.id,
              source: 'quiz-platform',
              occurredAt: new Date().toISOString(),
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
      }
    }

    logger.info({
      event: 'project.badge_awarded',
      submissionId,
      userId,
      projectId,
      badgeId,
    });

    return new Response('ok', { status: 200 });
  },
  {
    schema: AwardBadgeSchema,
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
