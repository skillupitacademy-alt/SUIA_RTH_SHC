import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { TrendsService } from '@/modules/metrics/trends.service';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:trends:scores' });

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const userId = searchParams.get('userId') ?? undefined;
    const range = searchParams.get('range') ?? '7d';

    if (!['7d', '14d', '28d', '90d'].includes(range)) {
      return NextResponse.json({ _error: 'Invalid range' }, { status: 400 });
    }

    const scores = await TrendsService.getScoreTrends({ userId, range });
    return NextResponse.json({ scores });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    log.error({ error: message }, 'Trends Scores API failed');
    return NextResponse.json(
      { _error: 'Failed to fetch score trends', message },
      { status: 500 }
    );
  }
}
