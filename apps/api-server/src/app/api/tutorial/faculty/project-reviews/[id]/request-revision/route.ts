import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { decideFacultyProjectSubmission, resolveFacultyAccess } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  notes: z.string().min(1),
});

export async function POST(req: NextRequest, context: { params: Promise<unknown> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 });
  }

  const access = await resolveFacultyAccess(req);
  if (access === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const row = await decideFacultyProjectSubmission(access, params.data.id, 'request_revision', parsed.data.notes);
  if (row === null) {
    return NextResponse.json({ error: 'Project submission not found' }, { status: 404 });
  }

  return NextResponse.json({ data: row }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
