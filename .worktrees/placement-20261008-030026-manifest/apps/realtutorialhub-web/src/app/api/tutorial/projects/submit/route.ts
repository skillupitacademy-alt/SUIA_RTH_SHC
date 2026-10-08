import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withObservability } from '@/middleware/observability.middleware';
import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { ProjectService } from '@/server/project.service';
import { ProjectNotEligibleError } from '@quiz/types';

export const dynamic = 'force-dynamic';

const projectService = new ProjectService();

const submitSchema = z.object({
  projectId: z.string().uuid(),
  deliverable: z.record(z.unknown()),
});

async function handler(req: NextRequest) {
  let session;
  try {
    session = await requireStudent(req);
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await projectService.submitProject(session.userId, parsed.data.projectId, parsed.data.deliverable);
    return NextResponse.json({ data: result }, { status: 202 });
  } catch (error) {
    if (error instanceof ProjectNotEligibleError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to submit project' }, { status: 500 });
  }
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const POST = withObservability(handler);
