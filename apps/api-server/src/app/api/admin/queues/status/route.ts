import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { bootstrapCQRS, GetQueueStatusQuery, queryBus } from '@/lib/cqrs';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    bootstrapCQRS();
    const data = await queryBus.dispatch(new GetQueueStatusQuery());

    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error({ err: error }, '[QueueStatus] Failed to fetch queue stats');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 });
  }
}
