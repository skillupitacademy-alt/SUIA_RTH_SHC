import { NextRequest, NextResponse } from 'next/server';

import { getSkillupAttendance } from '@/lib/skillup-data';
import { requireStudentAuth } from '@/lib/student-auth';

export async function GET(request: NextRequest) {
  const auth = await requireStudentAuth(request);
  if (auth.ok === false) {
    return auth.response;
  }

  return NextResponse.json(await getSkillupAttendance(auth.userId));
}
