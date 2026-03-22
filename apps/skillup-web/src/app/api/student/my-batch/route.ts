import { NextResponse } from 'next/server';

import { studentBatchDetails, studentSessions } from '@/lib/skillup-demo-data';

export async function GET() {
  return NextResponse.json({
    batch: studentBatchDetails,
    sessions: studentSessions,
  });
}
