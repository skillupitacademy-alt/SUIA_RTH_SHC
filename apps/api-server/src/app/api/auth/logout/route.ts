import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('refreshToken')?.value;
  const adminToken = req.cookies.get('admin_refreshToken')?.value;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '';

  if (token) {
    await AuthService.logout(token, undefined, ip);
  }
  if (adminToken) {
    await AuthService.logout(adminToken, undefined, ip);
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('refreshToken');
  response.cookies.delete('admin_refreshToken');
  return response;
}
