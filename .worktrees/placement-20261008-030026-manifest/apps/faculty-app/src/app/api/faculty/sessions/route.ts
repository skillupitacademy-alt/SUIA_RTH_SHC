import { NextRequest, NextResponse } from 'next/server';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const response = await relayFacultyUpstreamResponse(req.headers, '/api/faculty/sessions', { method: 'GET' });
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const response = await relayFacultyUpstreamResponse(req.headers, '/api/faculty/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
