import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, requireAdmin } from '@/lib/tutorial-content-api';
import { liveSessionService } from '@quiz/db-tutorial/live-session.service';
import { SessionRequestNotFoundError } from '@quiz/types';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }),
  meetingLink: z.string().url(),
});

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const { id } = await params;
    const result = await liveSessionService.scheduleRequest(
      session.userId,
      id,
      new Date(parsed.data.scheduledAt),
      parsed.data.meetingLink
    );
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof SessionRequestNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Invalid meeting link') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to schedule request' }, { status: 500 });
  }
}
