import { NextRequest, NextResponse } from 'next/server';
import { withObservability } from '@/middleware/observability.middleware';
import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { assignmentHelpSchema, assignmentService } from '@/lib/assignment';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const user = await requireStudent(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = assignmentHelpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    try {
      const request = await assignmentService.submitHelpRequest(
        user.userId,
        parsed.data.subtopicId,
        parsed.data.assignmentId,
        parsed.data.question
      );

      return NextResponse.json({ data: request }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.statusCode === 403 ? 'Forbidden' : 'Unauthorized' }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const POST = withObservability(handler);
