import { NextRequest, NextResponse } from 'next/server';

import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';
import { liveSessionService } from '@/server/live-session.service';
import { SessionRequestForbiddenError, SessionRequestNotFoundError } from '@quiz/types';
import { serverErrorResponse } from '@/share-branding/api/server-error';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const session = await requireStudent(req);
    try {
      const result = await liveSessionService.cancelMyRequest(session.userId, requestId);
      return NextResponse.json({ data: result }, { status: 200, headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      if (error instanceof SessionRequestForbiddenError) {
        return NextResponse.json({ error: 'Request access denied' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
      }
      if (error instanceof SessionRequestNotFoundError) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
      }
      return serverErrorResponse(req, 500, 'Failed to cancel request', error);
    }
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: { 'Cache-Control': 'private, no-store' } });
    }
    return serverErrorResponse(req, 500, 'Request cancellation unavailable', error);
  }
}
