import { NextResponse } from 'next/server';

import { getSkillupBatches } from '@/lib/skillup-data';

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupBatches(request));
}
