import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await TokenService.verifyAccessToken(token, true);
    
    const metrics = await AdminEngine.getGrowthZones();
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

