import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  status: z.enum(['pending', 'accepted', 'scheduled', 'completed', 'cancelled']).optional(),
  meetingLink: z.string().url().optional().nullable(),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
  cancelledReason: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid session request id' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const response = await relayFacultyUpstreamResponse(req.headers, `/api/tutorial/faculty/live-sessions/${params.data.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
