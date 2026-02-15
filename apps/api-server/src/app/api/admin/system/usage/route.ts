import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const usage = await UsageService.getAllUsage();
    return NextResponse.json(usage);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    console.error('[System Usage API] Error:', _error);
    return NextResponse.json(
      { _error: 'Failed to fetch system usage', message },
      { status: 500 }
    );
  }
}
