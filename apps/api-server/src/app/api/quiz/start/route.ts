import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { QuizEngine } from '@/modules/quiz-engine/quiz.engine';
import { TokenService } from '@/modules/auth/token.service';
import { ExamBlueprintService } from '@/services/exams/ExamBlueprintService';

const blueprintService = new ExamBlueprintService();

/**
 * START QUIZ
 * POST /api/quiz/start
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const { blueprintId, subjects, topicIds, subtopicIds, questionCount, difficulty } = await req.json();

    // Enterprise Flow: Generate Blueprint on the fly if blueprintId looks like a Domain ID (which it is in this flow)
    // The frontend sends the selected Domain ID as 'blueprintId'.
    // We assume any ID passed here implies a desire to generate a blueprint if 'subjects' are provided.
    
    let targetBlueprintId = blueprintId;

    if (subjects && subjects.length > 0) {
      targetBlueprintId = await blueprintService.generateBlueprint({
        domainId: blueprintId, // Frontend passes domain ID here
        subjectIds: subjects,
        topicIds: topicIds,
        subtopicIds: subtopicIds,
        questionCount: questionCount || 10,
        difficultyPreference: difficulty || 'mixed'
      });
    }

    const config = { 
      subjectIds: subjects, 
      topicIds, 
      subtopicIds, 
      questionCount, 
      difficulty 
    };
    // Pass the NEW blueprint ID to the engine
    const exam = await QuizEngine.startQuiz(payload.userId, targetBlueprintId, config);
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
