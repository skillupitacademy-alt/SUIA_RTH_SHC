import { NextRequest, NextResponse } from 'next/server';
import { UsageService } from '@/modules/system/usage.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const usage = await UsageService.getAllUsage();
    return NextResponse.json(usage);
  } catch (error: any) {
    console.error('[System Usage API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system usage', message: error.message },
      { status: 500 }
    );
  }
}
