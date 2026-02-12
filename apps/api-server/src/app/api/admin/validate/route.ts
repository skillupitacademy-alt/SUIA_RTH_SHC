import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

type ValidateBody = { topicId: string };

async function _verifyAdmin(_req: NextRequest) {
  const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
  if (_token === null || _token === undefined || _token.trim() === '') return null;
  try {
     const _payload = await TokenService.verifyAccessToken(_token, true);
     return _payload;
  } catch {
     return null;
  }
}

export async function POST(_req: NextRequest) {
  const admin = await _verifyAdmin(_req);
  if (admin === null || admin === undefined) return NextResponse.json({ _error: 'Admin access required' }, { status: 403 });

  try {
    const { topicId } = await _req.json() as ValidateBody;
    const result = await AdminEngine.validateTopic(topicId);
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

