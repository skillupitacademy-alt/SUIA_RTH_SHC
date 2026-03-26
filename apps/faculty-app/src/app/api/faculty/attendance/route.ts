import { NextRequest } from 'next/server';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const upstream = await relayFacultyUpstreamResponse(req.headers, `/api/attendance?${req.nextUrl.searchParams.toString()}`, {
    method: 'GET',
  });

  if (upstream === null) {
    return Response.json({ error: 'Upstream unavailable' }, { status: 503 });
  }

  return upstream;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await relayFacultyUpstreamResponse(req.headers, '/api/attendance', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });

  if (upstream === null) {
    return Response.json({ error: 'Upstream unavailable' }, { status: 503 });
  }

  return upstream;
}
