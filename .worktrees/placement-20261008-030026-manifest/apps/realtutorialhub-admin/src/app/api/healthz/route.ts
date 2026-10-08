import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'realtutorialhub-admin', ts: Date.now() });
}
