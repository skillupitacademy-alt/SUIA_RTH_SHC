import { NextRequest, NextResponse } from 'next/server';

import { listFacultyBatches } from '@/lib/faculty-live-data';
import { getEffectiveUserId } from '@/lib/request-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = getEffectiveUserId(request.headers);
  if (userId === null || userId.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await listFacultyBatches(userId);
  return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
