import { NextRequest, NextResponse } from 'next/server';

import { getFacultyIdentity, relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const identity = await getFacultyIdentity(req);
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await relayFacultyUpstreamResponse(identity, req.headers, '/api/tutorial/faculty/project-reviews');
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
