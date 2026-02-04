import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * Route for fetching live sessions
 */
export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, true);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    const result = await AdminEngine.getLiveSessions(page, limit, { search });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

