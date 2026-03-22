import { Client } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { findSessionRequestById } from '@/lib/faculty-demo-data';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  meetingLink: z.string().url(),
});

const getQStash = () => {
  const token = process.env.QSTASH_TOKEN;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required');
  }
  return new Client({ token });
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const request = findSessionRequestById(id);
  if (request === undefined) {
    return NextResponse.json({ error: 'Session request not found' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await getQStash().publishJSON({
      url: `${process.env.INTERNAL_API_URL ?? 'http://localhost:3001'}/api/workers/session-accepted`,
      body: {
        id: crypto.randomUUID(),
        type: 'session.accepted',
        correlationId: id,
        source: 'faculty-app',
        occurredAt: new Date().toISOString(),
        version: 1,
        data: {
          userId: request.studentId,
          sessionId: id,
          meetingLink: parsed.data.meetingLink,
          scheduledAt: request.scheduledAt,
        },
      },
    });
  } catch {
    // Allow local demo use without QStash secrets.
  }

  return NextResponse.json({ data: { ...request, status: 'accepted', meetingLink: parsed.data.meetingLink } }, { status: 200 });
}
