import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  meetingLink: z.string().url(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid session request id' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const response = await relayFacultyUpstreamResponse(
    req.headers,
    `/api/tutorial/faculty/live-sessions/${params.data.id}/accept`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ meetingLink: parsed.data.meetingLink }),
    }
  );
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
