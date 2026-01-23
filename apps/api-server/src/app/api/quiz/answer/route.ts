import { NextRequest, NextResponse } from 'next/server';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

/**
 * SUBMIT ANSWER
 * POST /api/quiz/answer
 */
export async function POST(req: NextRequest) {
  try {
    const { examId, examQuestionId, answer } = await req.json();
    const result = await ExamEngine.submitAnswer(examId, examQuestionId, answer);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
