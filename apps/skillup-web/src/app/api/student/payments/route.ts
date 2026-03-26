import { NextResponse } from 'next/server';

import { getSkillupPayments } from '@/lib/skillup-data';

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupPayments(request));
}
