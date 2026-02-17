import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await req.json();
    
    // Minimal telemetry log (redacted body)
    logger.info({ route: '/api/telemetry', method: 'POST' }, '[TELEMETRY] Captured');
    
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
