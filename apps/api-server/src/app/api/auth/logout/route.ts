import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('refreshToken')?.value;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  if (token) {
    await AuthService.logout(token, undefined, ip);
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('refreshToken');
  return response;
}
