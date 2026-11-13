import { type NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';

import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { logger } from '@/lib/logger';
import { verifyQStashSignature } from '@/lib/qstash-verify';
import { withLogging } from '@/lib/withLogging';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const entitySchema = z.object({
  entityType: z.enum(['domain', 'subject', 'topic', 'subtopic']),
  entityId: z.string().uuid(),
}).strict();
const reconciliationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: entitySchema.optional(),
  entities: z.array(entitySchema).min(1).max(100).optional(),
}).strict();

async function handler(req: NextRequest) {
  const startedAt = Date.now();

  try {
    const { valid, body } = await verifyQStashSignature(req);
    if (!valid) {
      return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
    }

    let input: unknown;
    try { input = JSON.parse(body.trim() || '{}'); }
    catch { return NextResponse.json({ success: false, error: 'Invalid reconciliation scope' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } }); }
    const parsed = reconciliationSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid reconciliation scope' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
    }
    const summary = await HierarchySyncService.retryFailed(parsed.data);
    const durationMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        success: summary.complete,
        ...summary,
      },
      {
        // A continuation requires an explicitly signed request with nextCursor.
        // Repeating this page is safe, but cannot complete a larger scan by itself.
        status: summary.failed > 0 ? 503 : summary.complete ? 200 : 409,
        headers: {
          'X-Duration-Ms': durationMs.toString(),
          'Cache-Control': 'private, no-store',
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

    return NextResponse.json({ success: false }, { status: 500, headers: { 'Cache-Control': 'private, no-store' } });
  }
}

export const POST = withCorrelationId(withLogging(handler, { component: 'worker', operation: 'retry_hierarchy_sync' }));
