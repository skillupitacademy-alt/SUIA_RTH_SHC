import { SignatureError } from '@upstash/qstash';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { verifyQStashRequest } from '../qstash';
import { logger } from '@/lib/logger';
import {
  HierarchySyncEnvelopeSchema,
  HierarchySyncService,
} from '@/server/hierarchy-sync.service';

export const dynamic = 'force-dynamic';

const service = new HierarchySyncService();

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await verifyQStashRequest(request);
    const parsed = HierarchySyncEnvelopeSchema.parse(JSON.parse(body));
    await service.sync(parsed.data);
    return new Response('ok', { status: 200 });
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    logger.error({
      event: 'hierarchy.sync_failed',
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response('error', { status: 500 });
  }
}
