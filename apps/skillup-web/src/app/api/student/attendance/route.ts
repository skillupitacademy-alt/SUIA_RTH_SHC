import { NextResponse } from 'next/server';

import { getSkillupAttendance } from '@/lib/skillup-data';

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupAttendance(request));
}
