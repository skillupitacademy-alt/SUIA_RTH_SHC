import { db } from '@quiz/db-tutorial';
import { quizAnswers } from '@quiz/db-tutorial';
import { QuizInteractionRequestSchema } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUserId, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/quiz
 * 
 * Submit quiz answer and track user interaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, QuizInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, questionId, selectedAnswer, correctAnswer, timeSpent } = parsed.data;

    const section = await getTutorialSection(sectionId, 'quiz');
    if (!section) {
      return NextResponse.json(
        { error: 'Quiz section not found' },
        { status: 404 }
      );
    }
    
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Get attempt number (count previous attempts for this question)
    const previousAttempts = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.userId, userId),
          eq(quizAnswers.questionId, questionId)
        )
      );
    
    const attemptNumber = previousAttempts.length + 1;
    
    // Insert quiz answer
    const [answer] = await db
      .insert(quizAnswers)
      .values({
        userId,
        sectionId,
        questionId,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        timeSpent,
        attemptNumber
      })
      .returning();
    const progress = await updateProgressForSection(userId, section);
    
    return NextResponse.json({
      success: true,
      answerId: answer.id,
      isCorrect,
      attemptNumber,
      progress,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again!'
    });
    
  } catch (error) {
    console.error('[Quiz Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutorial/interactions/quiz?userId=xxx&sectionId=xxx
 * 
 * Get user's quiz answers for a section
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    
    if (
      sectionId === null || sectionId === undefined || sectionId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing sectionId' },
        { status: 400 }
      );
    }
    
    const answers = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.userId, userId),
          eq(quizAnswers.sectionId, sectionId)
        )
      );
    
    // Calculate statistics
    const totalQuestions = new Set(answers.map(a => a.questionId)).size;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAttempts = answers.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    
    return NextResponse.json({
      answers,
      statistics: {
        totalQuestions,
        correctAnswers,
        totalAttempts,
        score
      }
    });
    
  } catch (error) {
    console.error('[Quiz Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
