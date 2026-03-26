import { NextRequest, NextResponse } from 'next/server';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const response = await relayFacultyUpstreamResponse(request.headers, `/api/tutorial/faculty/help-requests${request.nextUrl.search}`);
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
