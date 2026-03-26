import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createFacultyBatchSession, listFacultyBatchOptions, resolveFacultyAccess } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  batchId: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.coerce.number().int().positive().max(480),
  sessionNotes: z.string().min(1).max(500),
});

export async function GET(req: NextRequest) {
  const access = await resolveFacultyAccess(req);
  if (access === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await listFacultyBatchOptions(access.userId);
  return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
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

  const row = await createFacultyBatchSession(access, {
    batchId: parsed.data.batchId,
    scheduledAt: new Date(parsed.data.scheduledAt),
    durationMinutes: parsed.data.durationMinutes,
    sessionNotes: parsed.data.sessionNotes,
  });

  if (row === null) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  return NextResponse.json({ data: row }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
