import { NextRequest, NextResponse } from 'next/server';

import { loadFacultyReviewQueue, resolveFacultyAccess } from '@/lib/tutorial-faculty-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const access = await resolveFacultyAccess(req);
  if (access === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await loadFacultyReviewQueue(access);
  return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
