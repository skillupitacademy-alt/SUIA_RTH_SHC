import { db, exams, examQuestions } from '@quiz/db';
import { eq, and, sql, lt } from 'drizzle-orm';
import { cacheService } from '../core/cache.service';
import { ScoringEngine } from '../scoring-engine/scoring.engine';


export class SessionService {
  /**
   * Recovers a session or auto-submits if time has expired.
   */
  static async syncSession(examId: string, userId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    let exam: any = null;

    try {
      exam = await cacheService.get(cacheKey);
    } catch (e) {
      console.warn('[Session] Cache lookup failed', e);
    }

    if (!exam) {
      exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
          blueprint: true,
        },
      });

      if (exam) {
        try {
          await cacheService.set(cacheKey, exam, 1000 * 60 * 2); // 2 min TTL for active session meta
        } catch (e) {
          console.warn('[Session] Cache storage failed', e);
        }
      }
    }

    if (!exam) throw new Error('Session not found');
    
    // STRICT OWNERSHIP CHECK: Enforce even on cache hits
    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    if (exam.status === 'completed') return exam;

    const startTime = new Date(exam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Task D: Prioritize durationSeconds
    const durationSeconds = exam.durationSeconds || (exam.blueprint?.timeLimit ? exam.blueprint.timeLimit * 60 : 3600);

    if (timeElapsedSeconds > durationSeconds) {
      // Auto-submit: Mark as processing and trigger scoring (non-blocking)
      await db.update(exams)
        .set({ status: 'processing' as any })
        .where(eq(exams.id, examId));

      ScoringEngine.calculateExamResults(examId).catch(err => {
        console.error(`[SessionService] Async auto-submit scoring failed for ${examId}:`, err);
      });

      // Return the updated status immediately
      return { ...exam, status: 'processing' };
    }

    return exam;
  }

  /**
   * Resumes a session from the last unanswered question.
   * Task A: Returns a sanitized "student-safe" payload.
   */
  static async resumePayload(examId: string, userId: string) {
    const exam = await this.syncSession(examId, userId);
    
    // Fetch full state for internal calculations but sanitize before returning
    const fullExam = await db.query.exams.findFirst({
      where: and(eq(exams.id, examId), eq(exams.userId, userId)),
      with: {
        examQuestions: {
          orderBy: (eq, { asc }) => [asc(eq.order)],
          with: { question: true }
        }
      }
    });

    if (!fullExam) throw new Error('Exam state lost');

    // Calculate progress
    const answeredCount = fullExam.examQuestions.filter(q => q.userAnswer !== null).length;
    
    // Find first unanswered question
    const currentEq = fullExam.examQuestions.find(q => q.userAnswer === null) || fullExam.examQuestions[fullExam.examQuestions.length - 1];

    const startTime = new Date(fullExam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const durationSeconds = fullExam.durationSeconds || (exam.blueprint?.timeLimit ? exam.blueprint.timeLimit * 60 : 3600);

    return {
      examId: fullExam.id,
      // Mapped legacy fields for ExamInterface.tsx compatibility
      id: fullExam.id,
      startedAt: fullExam.startedAt,
      status: fullExam.status,
      remainingTimeSeconds: Math.max(0, durationSeconds - timeElapsedSeconds),
      progress: {
        totalQuestions: fullExam.examQuestions.length,
        answeredCount,
      },
      // Full question list (sanitized)
      questions: fullExam.examQuestions.map(eq => ({
        id: eq.question.id,
        text: eq.question.questionText, // ExamInterface expects 'text' or 'questionText'? Checking interface... actually usually matches DB or has adaptation. 
        // Let's provide both to be safe or standard. The DB has questionText.
        questionText: eq.question.questionText,
        options: eq.question.options,
        codeSnippet: eq.question.codeSnippet,
        type: eq.question.type,
        difficulty: eq.question.difficulty,
        userAnswer: eq.userAnswer
      })),
      currentQuestion: currentEq ? {
        id: currentEq.question.id,
        questionText: currentEq.question.questionText,
        options: currentEq.question.options,
        codeSnippet: currentEq.question.codeSnippet,
        type: currentEq.question.type,
        difficulty: currentEq.question.difficulty,
        topicId: currentEq.question.topicId,
        subtopicId: currentEq.question.subtopicId,
        order: currentEq.order
      } : null
    };
  }
}
