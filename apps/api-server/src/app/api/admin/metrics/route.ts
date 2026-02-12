import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });

    const _payload = await TokenService.verifyAccessToken(_token, true); // true for isAdmin check
    
    const metrics = await AdminEngine.getPlatformMetrics();
    return NextResponse.json(metrics);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 403 });
  }
}

