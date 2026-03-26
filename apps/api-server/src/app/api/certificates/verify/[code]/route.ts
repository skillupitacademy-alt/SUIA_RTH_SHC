import { NextRequest, NextResponse } from 'next/server';

import { loadCertificateVerification } from '@/lib/certificate-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const verification = await loadCertificateVerification(code);

  if (verification.status === 'not_found') {
    return NextResponse.json({ data: verification }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ data: verification }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
