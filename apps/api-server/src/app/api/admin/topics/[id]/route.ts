import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, true);

    const body = await req.json();
    const result = await AdminEngine.updateTopic(id, body, payload.userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ADMIN_TOPIC_PATCH] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, true);

    if (!(await verifyAdmin(payload))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await AdminEngine.deleteTopic(id, payload.userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ADMIN_TOPIC_DELETE] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
