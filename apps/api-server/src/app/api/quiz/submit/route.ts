import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * SUBMIT/COMPLETE EXAM
 * POST /api/quiz/submit
 */
export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const { examId } = await req.json();
    const idempotencyKey = req.headers.get('idempotency-key') || undefined;
    
    // Step 5 Hardening: Pass idempotency key for safe retries
    const result = await ExamEngine.completeExam(examId, payload.userId, idempotencyKey);
    
    if (result.status === 'processing') {
        return NextResponse.json(result, { status: 202 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('do not own')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('Exam not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
