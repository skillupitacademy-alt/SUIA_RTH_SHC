import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { facultyProjectReviews } from '@/lib/faculty-demo-data';
import { getFacultyUpstreamBaseUrl, relayJsonResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.literal('needs_review').optional(),
});

export async function GET(req: NextRequest) {
  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream !== null) {
    try {
      const url = new URL('/api/tutorial/projects/submissions', upstream);
      url.searchParams.set('status', 'needs_review');
      const response = await fetch(url, {
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

  const parsed = querySchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json({ data: facultyProjectReviews }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
