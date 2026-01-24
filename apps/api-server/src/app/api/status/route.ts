import { NextRequest, NextResponse } from 'next/server';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';

export async function GET(req: NextRequest) {
  const response = NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  setCsrfToken(response);
  return response;
}
