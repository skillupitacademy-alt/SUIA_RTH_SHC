import { NextResponse } from 'next/server';

import { getSkillupStudentDashboard } from '@/lib/skillup-data';

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupStudentDashboard(request));
}
