import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const data = await DashboardEngine.getPerformanceBreakdownMetadata(_payload.userId);
    
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
