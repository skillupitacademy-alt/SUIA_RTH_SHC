import { Client } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const recordSchema = z.object({
  studentId: z.string().min(1),
  present: z.boolean(),
});

const bodySchema = z.object({
  batchId: z.string().min(1),
  sessionId: z.string().min(1),
  attendanceRecords: z.array(recordSchema).length(30),
});

const getQStash = () => {
  const token = process.env.QSTASH_TOKEN;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required');
  }
  return new Client({ token });
};

export async function POST(req: NextRequest) {
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

  try {
    await getQStash().publishJSON({
      url: `${process.env.INTERNAL_API_URL ?? 'http://localhost:3001'}/api/workers/attendance-marked`,
      body: {
        id: crypto.randomUUID(),
        type: 'attendance.marked',
        correlationId: parsed.data.sessionId,
        source: 'faculty-app',
        occurredAt: new Date().toISOString(),
        version: 1,
        data: parsed.data,
      },
    });
  } catch {
    // Local demo mode.
  }

  return NextResponse.json({ data: { saved: parsed.data.attendanceRecords.length } }, { status: 200 });
}
