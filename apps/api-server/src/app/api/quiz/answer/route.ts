import { NextRequest, NextResponse } from 'next/server';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const body = await req.json();
    
    const result = await ExamEngine.submitAnswer(
      body.examId,
      body.questionId,
      body.answer,
      payload.userId
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
