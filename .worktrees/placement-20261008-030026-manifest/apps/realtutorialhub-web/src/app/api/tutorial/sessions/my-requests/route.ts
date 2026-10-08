import { NextRequest, NextResponse } from 'next/server';

import { requireStudent, AssignmentAuthError } from '@/lib/assignment-auth';
import { liveSessionService } from '@/server/live-session.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const data = await liveSessionService.getMyRequests(session.userId);
    return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
