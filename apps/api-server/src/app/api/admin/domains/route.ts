import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await TokenService.verifyAccessToken(token);

    if (!(await verifyAdmin(payload))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await AdminEngine.getDomains();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[ADMIN_DOMAINS] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
