import { NextRequest, NextResponse } from 'next/server';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const range = searchParams.get('range') || '90d';

    const skills = await TrendsService.getSkillTrends({ userId, range });
    return NextResponse.json(skills);
  } catch (error: any) {
    console.error('[Trends Skills API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill trends', message: error.message },
      { status: 500 }
    );
  }
}
