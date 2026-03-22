import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { facultyHelpRequests } from '@/lib/faculty-demo-data';
import { getFacultyUpstreamBaseUrl, relayJsonResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  subtopicId: z.string().optional(),
});

function filterDemoRequests(status?: 'open' | 'in_progress' | 'resolved') {
  return facultyHelpRequests.filter((request) => (status === undefined ? true : request.status === status));
}

export async function GET(req: NextRequest) {
  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream !== null) {
    try {
      const url = new URL('/api/tutorial/assignments/help-requests', upstream);
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });
      if (response.ok) {
        return relayJsonResponse(response);
      }
    } catch {
      // Fall back to demo content below.
    }
  }

  const parsed = querySchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
    subtopicId: req.nextUrl.searchParams.get('subtopicId') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: filterDemoRequests(parsed.data.status),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
