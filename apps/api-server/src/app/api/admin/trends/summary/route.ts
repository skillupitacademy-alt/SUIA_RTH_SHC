import { NextRequest, NextResponse } from 'next/server';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    if (!['7d', '14d', '28d', '90d'].includes(range)) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }

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
