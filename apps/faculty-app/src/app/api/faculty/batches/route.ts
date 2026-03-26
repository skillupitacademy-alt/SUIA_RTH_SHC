import { NextRequest, NextResponse } from 'next/server';

import { listFacultyBatches } from '@/lib/faculty-live-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (userId === null || userId.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await listFacultyBatches(userId);
  return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
