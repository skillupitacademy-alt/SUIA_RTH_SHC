import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health check endpoint to verify API routes are working
 */
export async function GET() {
  console.log(JSON.stringify({
    tag: 'HEALTH_CHECK',
    message: '✅ Health check endpoint hit',
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json({
    status: 'ok',
    service: 'skillhubcore-admin',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasGatewayUrl: !!process.env.GATEWAY_URL_SKILLHUBCORE,
    },
  });
}
