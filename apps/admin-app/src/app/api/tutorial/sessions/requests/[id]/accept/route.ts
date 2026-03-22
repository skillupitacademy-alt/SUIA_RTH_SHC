import { NextRequest, NextResponse } from 'next/server';

import { isTutorialAuthError, requireAdmin } from '@/lib/tutorial-content-api';
import { liveSessionService } from '@quiz/db-tutorial/live-session.service';
import { SessionRequestNotFoundError } from '@quiz/types';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAdmin(req);
  } catch (error) {
    if (isTutorialAuthError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await liveSessionService.acceptRequest(session.userId, id);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof SessionRequestNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to accept request' }, { status: 500 });
  }
}
