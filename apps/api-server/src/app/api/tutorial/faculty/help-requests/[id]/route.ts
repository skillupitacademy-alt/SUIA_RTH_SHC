import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { markFacultyHelpRequest, resolveFacultyAccess } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  resolvedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<unknown> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid help request id' }, { status: 400 });
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

  const status = parsed.data.status ?? 'open';
  const resolvedAt = parsed.data.resolvedAt === undefined ? undefined : parsed.data.resolvedAt === null ? null : new Date(parsed.data.resolvedAt);
  const row = await markFacultyHelpRequest(access, params.data.id, status, resolvedAt);
  if (row === null) {
    return NextResponse.json({ error: 'Help request not found' }, { status: 404 });
  }

  return NextResponse.json({ data: row }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
