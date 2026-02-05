import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

async function verifyAdmin(req: NextRequest) {
  const token = TokenService.getAccessToken(req, { scope: 'admin' });
  if (!token) return null;
  try {
     const payload = await TokenService.verifyAccessToken(token, true);
     return payload;
  } catch {
     return null;
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { topicId } = await req.json();
    const result = await AdminEngine.validateTopic(topicId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

