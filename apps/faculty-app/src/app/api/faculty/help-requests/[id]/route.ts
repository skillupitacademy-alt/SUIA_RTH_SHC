import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { findHelpRequestById } from '@/lib/faculty-demo-data';
import { getFacultyUpstreamBaseUrl, relayJsonResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  resolvedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid help request id' }, { status: 400 });
  }

  const upstream = getFacultyUpstreamBaseUrl();
  if (upstream !== null) {
    try {
      const body = await req.json();
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
      }

      const response = await fetch(new URL(`/api/tutorial/assignments/help-requests/${params.data.id}`, upstream), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (response.ok) {
        return relayJsonResponse(response);
      }
    } catch {
      // Demo fallback below.
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = findHelpRequestById(params.data.id);
  if (existing === undefined) {
    return NextResponse.json({ error: 'Help request not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: {
        ...existing,
        status: parsed.data.status ?? existing.status,
        resolvedAt: parsed.data.resolvedAt ?? existing.resolvedAt,
      },
    },
    { status: 200 }
  );
}
