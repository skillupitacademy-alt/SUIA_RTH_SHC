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
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const { examId } = await req.json();
    const result = await ExamEngine.completeExam(examId, payload.userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
