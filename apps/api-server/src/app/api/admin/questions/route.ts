import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token);

    if (!(await verifyAdmin(payload))) {
        console.warn(`[ADMIN_QUESTIONS] Forbidden: User ${payload.userId} lacks admin role.`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const filters = {
        domainId: searchParams.get('domainId') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
        topicId: searchParams.get('topicId') || undefined,
        subtopicId: searchParams.get('subtopicId') || undefined,
        skillIds: searchParams.getAll('skillIds').length > 0 ? searchParams.getAll('skillIds') : undefined,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
    };

    const data = await AdminEngine.getQuestions(page, limit, filters);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[ADMIN_QUESTIONS] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, true);

    const body = await req.json();
    const result = await AdminEngine.createQuestion(body, payload.userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ADMIN_QUESTIONS_POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

