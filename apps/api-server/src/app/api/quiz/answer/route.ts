import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

/**
 * SUBMIT ANSWER
 * POST /api/quiz/answer
 */
export async function POST(req: NextRequest) {
  try {
    const { examId, questionId, answer } = await req.json();
    const result = await ExamEngine.submitAnswer(examId, questionId, answer);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
