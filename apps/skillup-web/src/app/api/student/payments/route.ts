import { NextResponse } from 'next/server';

import { studentInstallments } from '@/lib/skillup-demo-data';

export async function GET() {
  return NextResponse.json({
    installments: studentInstallments,
  });
}
