import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const body = await req.json();

    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');

    if (!idempotencyKey) {
      return NextResponse.json({ 
        error: 'Missing Idempotency-Key header. This endpoint requires a unique key for reliable session orchestration.' 
      }, { status: 400 });
    }

    const { domainId, blueprintId, ...config } = body;
    
    // Step 6 Hardening: Input Validation & Caps
    // 1. Question Count Cap
    if (config.questionCount !== undefined) {
        if (typeof config.questionCount !== 'number' || config.questionCount < 5 || config.questionCount > 50) {
            return NextResponse.json({ 
                error: 'questionCount must be between 5 and 50' 
            }, { status: 422 });
        }
    }

    // 2. Selection Array Caps (Max 20 items per filter to prevent DB query explosion)
    const arrayFields = ['subjectIds', 'topicIds', 'subtopicIds'];
    for (const field of arrayFields) {
        if (config[field] && Array.isArray(config[field])) {
            if (config[field].length > 20) {
                 return NextResponse.json({ 
                    error: `${field} cannot contain more than 20 items` 
                }, { status: 422 });
            }
        }
    }

    // 3. Difficulty Validation
    // Allowed values matches DB distribution keys + user-friendly aliases if supported by selection engine
    // Based on user request: mixed/foundations/elite vs simple/intermediate/expert
    const allowedDifficulties = ['simple', 'intermediate', 'expert', 'mixed', 'foundations', 'elite'];
    if (config.difficulty && !allowedDifficulties.includes(config.difficulty)) {
        return NextResponse.json({ 
            error: `Invalid difficulty. Allowed: ${allowedDifficulties.join(', ')}` 
        }, { status: 422 });
    }

    // Use blueprintId if provided, otherwise fallback to domainId
    const targetId = blueprintId || domainId;

    if (!targetId) {
      return NextResponse.json({ error: 'blueprintId or domainId is required' }, { status: 400 });
    }

    // 4. UUID Format Validation (Basic Regex)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
         return NextResponse.json({ error: 'Invalid ID format for blueprintId/domainId' }, { status: 422 });
    }

    const examData = await ExamEngine.startExam(
      payload.userId, 
      targetId, 
      idempotencyKey, 
      config
    );

    return NextResponse.json(examData);
  } catch (error: any) {
    console.error('[QUIZ_START] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
