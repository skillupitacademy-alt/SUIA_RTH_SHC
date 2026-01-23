import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

/**
 * SUBMIT/COMPLETE EXAM
 * POST /api/quiz/submit
 */
export async function POST(req: NextRequest) {
  try {
    const { examId } = await req.json();
    const result = await ExamEngine.completeExam(examId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
