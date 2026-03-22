import { NextResponse } from 'next/server';

import { facultySessionRequests } from '@/lib/faculty-demo-data';
import { getFacultyUpstreamBaseUrl, relayJsonResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream !== null) {
    try {
      const response = await fetch(new URL('/api/tutorial/sessions/requests', upstream), {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });
      if (response.ok) {
        return relayJsonResponse(response);
      }
    } catch {
      // Demo fallback below.
    }
  }

  return NextResponse.json({ data: facultySessionRequests }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
