import { NextResponse } from 'next/server';

import { getSkillupPrograms } from '@/lib/skillup-data';

export async function GET() {
  return NextResponse.json(await getSkillupPrograms());
}
