import { NextResponse } from 'next/server';

import { studentDashboardSummary, studentSessions } from '@/lib/skillup-demo-data';

export async function GET() {
  return NextResponse.json({
    summary: studentDashboardSummary,
    sessions: studentSessions,
  });
}
