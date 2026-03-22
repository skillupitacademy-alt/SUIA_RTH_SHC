import { NextResponse } from 'next/server';

import { skillupPrograms } from '@/lib/skillup-demo-data';

export async function GET() {
  return NextResponse.json({
    programs: skillupPrograms,
  });
}
