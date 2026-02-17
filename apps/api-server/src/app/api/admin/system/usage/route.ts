import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:system-usage' });

export async function GET() {
  try {
    const usage = await UsageService.getAllUsage();
    return NextResponse.json(usage);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error({ error: message }, 'System usage fetch failed');
    return NextResponse.json(
      { _error: 'Failed to fetch system usage', message },
      { status: 500 }
    );
  }
}
