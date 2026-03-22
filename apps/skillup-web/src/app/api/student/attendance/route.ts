import { NextResponse } from 'next/server';

import { studentAttendanceHistory } from '@/lib/skillup-demo-data';

export async function GET() {
  return NextResponse.json({
    history: studentAttendanceHistory,
  });
}
