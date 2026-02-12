import { type NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/modules/auth/audit.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    let userId: string | undefined;
    try {
        const _userToken = TokenService.getAccessToken(_req, { scope: '_user' });
        const _adminToken = TokenService.getAccessToken(_req, { scope: 'admin' });
        const _token = (_userToken !== undefined && _userToken !== null && _userToken !== '') ? _userToken : _adminToken;
        if (_token !== undefined && _token !== null && _token !== '') {
            const _payload = await TokenService.verifyAccessToken(_token, _token.includes('admin')).catch(() => null);
            userId = _payload?.userId;
        }
    } catch (_e: unknown) {
        // Auth failed but we continue for telemetry
    }
    
    const { action, metadata } = await _req.json();

    if (action === undefined || action === null || action === '') {
      return NextResponse.json({ _error: 'Action is required' }, { status: 400 });
    }

    await AuditService.log({
      userId,
      action: `telemetry_${action}`,
      ip: (_req.headers.get('x-forwarded-for') !== null && _req.headers.get('x-forwarded-for') !== '') ? _req.headers.get('x-forwarded-for')! : '0.0.0.0',
      metadata: {
        ...metadata,
        userAgent: _req.headers.get('_user-agent'),
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    console.error("Telemetry Processing Error:", _error);
    return NextResponse.json({ success: false }, { status: 200 }); 
  }
}
