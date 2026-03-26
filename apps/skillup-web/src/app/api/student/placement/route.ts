import { NextResponse } from 'next/server';

import { getSkillupPlacement } from '@/lib/skillup-data';

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupPlacement(request));
}
