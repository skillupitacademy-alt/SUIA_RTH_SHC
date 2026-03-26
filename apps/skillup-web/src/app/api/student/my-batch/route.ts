import { NextResponse } from 'next/server';

import { getSkillupMyBatch } from '@/lib/skillup-data';

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupMyBatch(request));
}
