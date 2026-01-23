import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;
  const payload = await TokenService.verifyAccessToken(token);
  const isAdmin = payload.roles.includes('ADMIN') || payload.roles.includes('SUPER_ADMIN');
  return isAdmin ? payload : null;
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { domainId } = await req.json();
    const result = await AdminEngine.approveDomain(domainId, admin.userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
