import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/modules/auth/audit.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let userId: string | undefined;
    try {
        const token = TokenService.getAccessToken(req, { scope: 'user' }) || TokenService.getAccessToken(req, { scope: 'admin' });
        if (token) {
            const payload = await TokenService.verifyAccessToken(token, token.includes('admin')).catch(() => null);
            userId = payload?.userId;
        }
    } catch (e) {
        // Auth failed but we continue for telemetry
    }
    
    const { action, metadata } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    await AuditService.log({
      userId,
      action: `telemetry_${action}`,
      ip: req.headers.get('x-forwarded-for') || '0.0.0.0',
      metadata: {
        ...metadata,
        userAgent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TelemetryRoute] Critical failure:', error);
    return NextResponse.json({ success: false }, { status: 200 }); 
  }
}
