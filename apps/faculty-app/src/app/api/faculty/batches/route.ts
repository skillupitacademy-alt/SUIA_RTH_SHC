import { NextResponse } from 'next/server';

import { facultyBatches } from '@/lib/faculty-demo-data';
import { getFacultyUpstreamBaseUrl, relayJsonResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream !== null) {
    try {
      const response = await fetch(new URL('/api/faculty/batches', upstream), {
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

  return NextResponse.json({ data: facultyBatches }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
