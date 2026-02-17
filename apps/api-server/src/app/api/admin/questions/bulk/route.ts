import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CreateQuestionInput } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { bulkQuestionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

type BulkQuestionBody = {
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  skillIds?: string[];
  questions: CreateQuestionInput[];
};

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);

    if (!(await _verifyAdmin(_payload))) {
        return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }

    const rawBody = await _req.json() as BulkQuestionBody;
    const parsed = bulkQuestionSchema.safeParse(rawBody);
    const { topicId, subtopicId, skillId, skillIds, questions } = parsed.success ? parsed.data : rawBody;

    if (topicId === null || topicId === undefined || topicId.trim() === '' || !Array.isArray(questions)) {
        return NextResponse.json({ _error: 'Missing required fields: topicId and questions array' }, { status: 400 });
    }

    const result = await AdminEngine.bulkCreateQuestionsWithContext(
        questions, 
        { topicId, subtopicId, skillId, skillIds }, 
        _payload.userId
    );
    
    return NextResponse.json({ 
        success: true, 
        count: result.length,
        message: `Successfully uploaded ${result.length} questions` 
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_QUESTIONS_BULK] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

