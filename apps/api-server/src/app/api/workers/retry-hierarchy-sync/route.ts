import { type NextRequest,NextResponse } from 'next/server';

import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { logger } from '@/lib/logger';
import { verifyQStashSignature } from '@/lib/qstash-verify';
import { withLogging } from '@/lib/withLogging';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handler(req: NextRequest) {
  const startedAt = Date.now();

  try {
    const { valid } = await verifyQStashSignature(req);
    if (!valid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const summary = await HierarchySyncService.retryFailed();
    const durationMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        success: true,
        ...summary,
      },
      {
        status: 200,
        headers: {
          'X-Duration-Ms': durationMs.toString(),
        },
      },
    );
  } catch (error) {
    logger.error(
      {
        event: 'hierarchy.retry_failed_worker_error',
        error: error instanceof Error ? error.message : String(error),
      },
      'Hierarchy retry worker failed',
    );

    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export const POST = withCorrelationId(withLogging(handler, { component: 'worker', operation: 'retry_hierarchy_sync' }));
