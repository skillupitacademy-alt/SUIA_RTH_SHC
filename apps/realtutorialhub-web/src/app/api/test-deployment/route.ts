import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'deployment-test',
    timestamp: Date.now(),
    message: 'BFF routes are working',
  });
}