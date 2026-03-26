import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getFacultyAttendanceRoster, upsertFacultyAttendance } from '@/lib/faculty-live-data';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  batchId: z.string().min(1),
  sessionId: z.string().min(1),
  attendanceRecords: z.array(
    z.object({
      studentId: z.string().min(1),
      present: z.boolean(),
    })
  ).min(1),
});

const querySchema = z.object({
  batchId: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (userId === null || userId.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    batchId: req.nextUrl.searchParams.get('batchId') ?? undefined,
    sessionId: req.nextUrl.searchParams.get('sessionId') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
  }

  const roster = await getFacultyAttendanceRoster(userId, parsed.data.batchId, parsed.data.sessionId);
  if (roster === null) {
    return NextResponse.json({ error: 'Attendance roster not found' }, { status: 404 });
  }

  return NextResponse.json({ data: roster }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (userId === null || userId.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const savedCount = await upsertFacultyAttendance(userId, parsed.data.batchId, parsed.data.sessionId, parsed.data.attendanceRecords);
  if (savedCount === null) {
    return NextResponse.json({ error: 'Attendance roster not found' }, { status: 404 });
  }

  return NextResponse.json({ data: { saved: parsed.data.attendanceRecords.length } }, { status: 200 });
}
