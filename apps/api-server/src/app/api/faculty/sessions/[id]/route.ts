import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { resolveFacultyAccess, updateFacultyBatchSession } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  durationMinutes: z.coerce.number().int().positive().max(480).optional(),
  sessionNotes: z.string().min(1).max(500).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<unknown> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }

  const access = await resolveFacultyAccess(req);
  if (access === null) {
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

  const row = await updateFacultyBatchSession(access, params.data.id, {
    scheduledAt: parsed.data.scheduledAt === undefined ? undefined : new Date(parsed.data.scheduledAt),
    durationMinutes: parsed.data.durationMinutes,
    sessionNotes: parsed.data.sessionNotes,
    status: parsed.data.status,
  });

  if (row === null) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ data: row }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
