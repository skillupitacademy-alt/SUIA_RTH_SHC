import { ProjectRepository } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, logger, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  notes: z.string().min(1),
});

const repository = new ProjectRepository();

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

    const updated = await repository.updateSubmissionStatus(submission.id, 'revision_needed', {
      requestedBy: session.userId,
      notes: parsedBody.data.notes,
      requestedAt: new Date().toISOString(),
    });

    logger.info({
      event: 'project.revision_requested',
      submissionId: submission.id,
      userId: submission.userId,
      adminUserId: session.userId,
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to request revision' }, { status: 500 });
  }
}
