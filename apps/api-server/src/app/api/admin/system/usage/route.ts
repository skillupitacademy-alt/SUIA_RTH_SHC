import { NextResponse } from 'next/server';

import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const usage = await UsageService.getAllUsage();
    return NextResponse.json(usage);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[System Usage API] Error:', error);
    return NextResponse.json(
      { _error: 'Failed to fetch system usage', message },
      { status: 500 }
    );
  }
}
