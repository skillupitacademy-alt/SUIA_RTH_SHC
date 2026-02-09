import { NextRequest, NextResponse } from 'next/server';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const range = searchParams.get('range') || '30d';

    const scores = await TrendsService.getScoreTrends({ userId, range });
    return NextResponse.json(scores);
  } catch (error: any) {
    console.error('[Trends Scores API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score trends', message: error.message },
      { status: 500 }
    );
  }
}
