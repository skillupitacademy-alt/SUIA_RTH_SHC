import { NextResponse } from 'next/server';

import { studentJobMatches, studentPlacementProfile } from '@/lib/skillup-demo-data';

export async function GET() {
  return NextResponse.json({
    profile: studentPlacementProfile,
    jobs: studentJobMatches,
  });
}
