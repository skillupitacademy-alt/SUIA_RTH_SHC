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
    
    // Use blueprintId if provided, otherwise fallback to domainId
    const targetId = blueprintId || domainId;

    if (!targetId) {
      return NextResponse.json({ error: 'blueprintId or domainId is required' }, { status: 400 });
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
