import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { db } from '@quiz/db';
import { userRoles, roles } from '@quiz/db';
import { eq, and, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await TokenService.verifyAccessToken(token);

    // Verify Admin Role
    const userRole = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
            eq(userRoles.userId, payload.userId),
            inArray(roles.name, ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN'])
        ))
        .limit(1);

    if (userRole.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Phase 8: Hierarchical Filters
    const filters = {
        domainId: searchParams.get('domainId') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
        topicId: searchParams.get('topicId') || undefined,
        subtopicId: searchParams.get('subtopicId') || undefined,
        status: searchParams.get('status') || undefined,
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
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await TokenService.verifyAccessToken(token);

    // Verify Admin Role
    const userRole = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
            eq(userRoles.userId, payload.userId),
            inArray(roles.name, ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN'])
        ))
        .limit(1);

    if (userRole.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const result = await AdminEngine.createQuestion(body, payload.userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ADMIN_QUESTIONS_POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
