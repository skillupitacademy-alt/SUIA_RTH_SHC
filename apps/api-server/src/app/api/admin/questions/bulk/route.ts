import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
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

async function handler(_req: NextRequest) {
  const start = Date.now();
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
    if (!parsed.success) {
        return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { topicId, subtopicId, skillId, skillIds, questions } = parsed.data;

    const result = await AdminEngine.bulkCreateQuestionsWithContext(
        questions, 
        { topicId, subtopicId, skillId, skillIds }, 
        _payload.userId
    );

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'success', count: result.length });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'success' });
    
    return NextResponse.json({ 
        success: true, 
        count: result.length,
        message: `Successfully uploaded ${result.length} questions` 
    }, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'bulk_upload_questions' });
