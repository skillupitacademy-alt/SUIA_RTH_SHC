import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from './admin.engine';
import { TokenService } from '../auth/token.service';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const isAdmin = payload.roles.includes('ADMIN') || payload.roles.includes('SUPER_ADMIN');

    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { action, targetId } = await req.json();

    switch (action) {
      case 'publish_question':
        return NextResponse.json(await AdminEngine.publishQuestion(targetId, payload.userId));
      case 'approve_domain':
        return NextResponse.json(await AdminEngine.approveDomain(targetId, payload.userId));
      case 'validate_topic':
        return NextResponse.json(await AdminEngine.validateTopic(targetId));
      default:
        return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
