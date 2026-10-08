import { NextRequest, NextResponse } from 'next/server';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const response = await relayFacultyUpstreamResponse(req.headers, `/api/tutorial/faculty/help-requests${req.nextUrl.search}`);
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
