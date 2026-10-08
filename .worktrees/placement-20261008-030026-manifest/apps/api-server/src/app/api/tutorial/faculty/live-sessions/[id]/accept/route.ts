import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { acceptFacultyLiveSession, resolveFacultyAccess } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  meetingLink: z.string().url(),
});

export async function POST(req: NextRequest, context: { params: Promise<unknown> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid session request id' }, { status: 400 });
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

  const row = await acceptFacultyLiveSession(access, params.data.id, parsed.data.meetingLink);
  if (row === null) {
    return NextResponse.json({ error: 'Session request not found' }, { status: 404 });
  }

  return NextResponse.json({ data: row }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
