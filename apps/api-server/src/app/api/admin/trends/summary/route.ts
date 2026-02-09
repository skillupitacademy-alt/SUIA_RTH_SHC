import { NextRequest, NextResponse } from 'next/server';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '90d';

    const summary = await TrendsService.getTrendSummary({ range });
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[Trends Summary API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend summary', message: error.message },
      { status: 500 }
    );
  }
}
