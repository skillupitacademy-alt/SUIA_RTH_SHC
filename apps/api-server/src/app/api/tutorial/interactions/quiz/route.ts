import { db } from '@quiz/db-tutorial';
import { quizAnswers } from '@quiz/db-tutorial';
import { QuizInteractionRequestSchema } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { extractCorrectAnswerFromContent, getAuthenticatedUserIdAsync, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/quiz
 * 
 * Submit quiz answer and track user interaction
 * 
 * 🔐 SECURITY FIX (INT-01): correctAnswer from the client body is no longer
 * used to determine isCorrect. Instead we look up the user's most recent
 * previous correct answer for this question (stored server-side), or fall
 * back to the client value only for the first attempt while logging a warning.
 * 
 * TODO: Resolve correctAnswer from the section content JSONB (TutorialDocument)
 * to eliminate client trust entirely.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserIdAsync(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, QuizInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, questionId, selectedAnswer, correctAnswer: clientCorrectAnswer, timeSpent } = parsed.data;

    const section = await getTutorialSection(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Quiz section not found' },
        { status: 404 }
      );
    }
    
    // 🔐 SECURITY FIX (INT-01): Resolve correctAnswer strictly from authoritative section content.
    // Client-supplied correctAnswer and student history are NEVER used as scoring authority.
    const authoritativeCorrectAnswer = extractCorrectAnswerFromContent(section.content, questionId);

    if (!authoritativeCorrectAnswer) {
      console.error('[Quiz] Authoritative correct answer missing', {
        sectionId,
        questionId,
      });

      return NextResponse.json(
        {
          error: 'QUIZ_CONFIGURATION_ERROR',
          message: 'Question cannot be scored because its authoritative answer is unavailable.',
        },
        { status: 422 }
      );
    }

    if (clientCorrectAnswer && clientCorrectAnswer !== authoritativeCorrectAnswer) {
      console.warn('[SECURITY][Quiz] Ignored mismatched client correctAnswer', {
        questionId,
        clientValue: clientCorrectAnswer,
        authoritativeValue: authoritativeCorrectAnswer,
        userId: typeof userId === 'string' ? userId.slice(0, 8) : 'unknown',
      });
    }

    const correctAnswer = authoritativeCorrectAnswer;

    // Query previous user answers solely for attempt counting
    const previousAnswers = await db
      .select({ id: quizAnswers.id })
      .from(quizAnswers)
      .where(and(eq(quizAnswers.userId, userId), eq(quizAnswers.questionId, questionId)));

    const isCorrect = selectedAnswer === correctAnswer;
    const attemptNumber = previousAnswers.length + 1;
    
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
 * GET /api/tutorial/interactions/quiz?sectionId=xxx
 * 
 * Get user's quiz answers for a section
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserIdAsync(request);
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
