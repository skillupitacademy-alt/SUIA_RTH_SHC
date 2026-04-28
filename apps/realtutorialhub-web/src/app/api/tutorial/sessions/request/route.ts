import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withObservability } from '@/middleware/observability.middleware';
import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';
import { liveSessionService } from '@/server/live-session.service';
import { SessionRequestDuplicateError } from '@quiz/types';

export const dynamic = 'force-dynamic';

const schema = z.object({
  subtopicId: z.string().uuid(),
  doubtText: z.string().min(1).optional(),
});

async function handler(req: NextRequest) {
  try {
    const session = await requireStudent(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    try {
      const request = await liveSessionService.requestSession(session.userId, parsed.data.subtopicId, parsed.data.doubtText);
      return NextResponse.json({ data: { requestId: request.id } }, { status: 201 });
    } catch (error) {
      if (error instanceof SessionRequestDuplicateError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to request session' }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const POST = withObservability(handler);
