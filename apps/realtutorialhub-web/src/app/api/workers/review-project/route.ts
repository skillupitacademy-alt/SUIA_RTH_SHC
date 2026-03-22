import { SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { createQStashHandler, PlatformEventTypes } from '@quiz/events';
import { ProjectRepository, db, withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ReviewWorkerSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('project.submitted'),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: z.object({
    submissionId: z.string().uuid(),
    userId: z.string().uuid(),
    projectId: z.string().uuid(),
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

const buildReviewText = (checklist: Array<{ item: string; passed: boolean }>) => {
  const passed = checklist.filter((item) => item.passed).map((item) => item.item);
  const failed = checklist.filter((item) => !item.passed).map((item) => item.item);
  return [
    passed.length > 0 ? `Passed checks: ${passed.join(', ')}.` : 'No checklist items passed yet.',
    failed.length > 0 ? `Needs human review for: ${failed.join(', ')}.` : 'The deliverable looks structurally complete.',
    'The submission is ready for admin review.',
  ].join(' ');
};

const handler = createQStashHandler(
  PlatformEventTypes.PROJECT_SUBMITTED,
  async (envelope) => {
    const payload = ReviewWorkerSchema.parse(envelope);
    const { submissionId, userId, projectId } = payload.data;
    const redis = createRedisClient();
    const redisKey = `project-review:${submissionId}`;

    const existing = await redis.get(redisKey);
    if (existing !== null && String(existing).trim().length > 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const claimed = await redis.set(redisKey, 'processing', { ex: 86_400, nx: true });
    if (claimed == null || String(claimed).trim().length === 0) {
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const projectRepository = new ProjectRepository();
    const [submission, project] = await Promise.all([
      withTimeout(
        projectRepository.getSubmission(submissionId),
        STANDARD_QUERY_TIMEOUT,
        'review-project.getSubmission'
      ),
      withTimeout(
        projectRepository.getProject(projectId),
        STANDARD_QUERY_TIMEOUT,
        'review-project.getProject'
      ),
    ]);

    if (submission === undefined || project === undefined) {
      throw new Error('Submission or project not found');
    }

    const deliverable = submission.submissionContent as Record<string, unknown>;
    const checklist = [
      {
        item: 'Deliverable URL present',
        passed: Boolean(deliverable.deliverableUrl ?? deliverable.url ?? deliverable.repoUrl ?? deliverable.liveDemoUrl),
      },
      {
        item: 'README included',
        passed: typeof deliverable.readme === 'string' && deliverable.readme.trim().length > 0,
      },
      {
        item: 'Requirements referenced',
        passed: JSON.stringify(deliverable).toLowerCase().includes('require'),
      },
    ];

    const feedback = buildReviewText(checklist);

    await db.transaction(async (tx) => {
      const txRepo = projectRepository.withDb(tx as never);
      await txRepo.updateSubmissionStatus(submissionId, 'ai_reviewing');
      await txRepo.updateSubmissionStatus(submissionId, 'needs_review', {
        feedback,
        checklist,
        suggestedStatus: 'needs_review',
      });
    });

    logger.info({
      event: 'project.ai_review_complete',
      submissionId,
      userId,
      projectId,
    });

    return NextResponse.json({
      data: {
        submissionId,
        suggestedStatus: 'needs_review',
      },
    });
  },
  {
    schema: ReviewWorkerSchema,
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
      event: 'project.ai_review_failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response('error', { status: 500 });
  }
}
