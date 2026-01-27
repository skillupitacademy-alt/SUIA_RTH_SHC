import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await TokenService.verifyAccessToken(token);

    if (!(await verifyAdmin(payload))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { topicId, subtopicId, skillId, skillIds, questions } = await req.json();

    if (!topicId || !Array.isArray(questions)) {
        return NextResponse.json({ error: 'Missing required fields: topicId and questions array' }, { status: 400 });
    }

    const result = await AdminEngine.bulkCreateQuestionsWithContext(
        questions, 
        { topicId, subtopicId, skillId, skillIds }, 
        payload.userId
    );
    
    return NextResponse.json({ 
        success: true, 
        count: result.length,
        message: `Successfully uploaded ${result.length} questions` 
    });
  } catch (error: any) {
    console.error('[ADMIN_QUESTIONS_BULK] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
