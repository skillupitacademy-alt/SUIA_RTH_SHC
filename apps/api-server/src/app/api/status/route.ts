import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";

async function handler() {
  const start = Date.now();
  recordCounter('system.api.status.check', 1);
  recordTimer('system.api.status.duration', Date.now() - start);
  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.2.0'
  });
}

export const GET = withLogging(handler, { component: 'system', operation: 'health_check' });
