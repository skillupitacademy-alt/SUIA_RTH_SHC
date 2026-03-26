import { NextResponse } from 'next/server';

import { getSkillupFaculty } from '@/lib/skillup-data';

export async function GET() {
  return NextResponse.json(await getSkillupFaculty());
}
