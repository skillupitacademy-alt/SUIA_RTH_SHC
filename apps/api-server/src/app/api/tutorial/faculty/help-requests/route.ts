import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { loadFacultyHelpRequests, resolveFacultyAccess } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
});

export async function GET(req: NextRequest) {
  const access = await resolveFacultyAccess(req);
  if (access === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
  }

  const data = await loadFacultyHelpRequests(access);
  const filtered = parsed.data.status === undefined ? data : data.filter((item) => item.status === parsed.data.status);
  return NextResponse.json({ data: filtered }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
