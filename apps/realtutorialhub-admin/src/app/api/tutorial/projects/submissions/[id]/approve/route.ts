import { ProjectRepository } from '@quiz/db-tutorial';
import { ProjectTransitionError } from '@quiz/types';
import { Client } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, logger, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  notes: z.string().optional(),
});

const repository = new ProjectRepository();

const getAppUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  const internalUrl = process.env.INTERNAL_API_URL;
  if (typeof publicUrl === 'string' && publicUrl.trim().length > 0) return publicUrl.trim();
  if (typeof internalUrl === 'string' && internalUrl.trim().length > 0) return internalUrl.trim();
  return 'http://localhost:3003';
};

const getQStash = () => {
  const token = process.env.QSTASH_TOKEN;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required');
  }
  return new Client({ token });
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAdmin(req);
  } catch (error) {
    if (isTutorialAuthError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsedBody.error.issues }, { status: 400 });
  }

  try {
    const submission = await repository.getSubmission(parsedParams.data.id);
    if (submission === undefined) {
      return NextResponse.json({ error: 'Project submission not found' }, { status: 404 });
    }

    const approved = await repository.updateSubmissionStatus(submission.id, 'approved', {
      approvedBy: session.userId,
      notes: parsedBody.data.notes ?? null,
      approvedAt: new Date().toISOString(),
    });

    if (approved === undefined) {
      return NextResponse.json({ error: 'Project submission not found' }, { status: 404 });
    }

    const project = await repository.getProject(submission.projectId);
    if (project?.badgeId !== null && project?.badgeId !== undefined) {
      await getQStash().publishJSON({
        url: new URL('/api/workers/award-project-badge', getAppUrl()).toString(),
        retries: 3,
        body: {
          id: crypto.randomUUID(),
          type: 'project.approved',
          correlationId: submission.id,
          source: 'quiz-platform',
          occurredAt: new Date().toISOString(),
          version: 1,
          data: {
            submissionId: submission.id,
            userId: submission.userId,
            projectId: submission.projectId,
            badgeId: project.badgeId,
          },
        },
      });
    }

    logger.info({
      event: 'project.approved',
      submissionId: submission.id,
      userId: submission.userId,
      adminUserId: session.userId,
    });

    return NextResponse.json({ data: approved }, { status: 200 });
  } catch (error) {
    if (error instanceof ProjectTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to approve project' }, { status: 500 });
  }
}
