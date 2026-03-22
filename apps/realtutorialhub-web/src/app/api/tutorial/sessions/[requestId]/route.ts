import { NextRequest, NextResponse } from 'next/server';

import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';
import { liveSessionService } from '@/server/live-session.service';
import { SessionRequestForbiddenError, SessionRequestNotFoundError } from '@quiz/types';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const session = await requireStudent(req);
    try {
      const result = await liveSessionService.cancelMyRequest(session.userId, requestId);
      return NextResponse.json({ data: result }, { status: 200 });
    } catch (error) {
      if (error instanceof SessionRequestForbiddenError) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error instanceof SessionRequestNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to cancel request' }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
