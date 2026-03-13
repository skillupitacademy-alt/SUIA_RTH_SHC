import { 
  db, 
  domains, 
  examBlueprints,
  examQuestions, 
  exams, 
  questions, 
  subjects, 
  topics, 
  userProfiles,
  users} from '@quiz/db';
import { eq, sql } from 'drizzle-orm';

import { withSpan } from '@/lib/tracer';

import type { ExportMeta,RawAttemptRow } from './exportTypes';

export class ExportQueryBuilder {
  async fetchRawAttempts(examId: string): Promise<RawAttemptRow[]> {
    return withSpan('ExportQueryBuilder.fetchRawAttempts', async (span) => {
      span.setAttribute('examId', examId);
      
      const rows = await db.execute(sql`
        SELECT 
          u.id as "studentId",
          up.name as "studentName",
          u.email as "studentEmail",
          e.id as "sessionId",
          e.started_at as "sessionDate",
          LEFT(e.id::text, 8) as "vectorId",
          
          d.name as "domain",
          sub.name as "subject",
          t.name as "topic",
          st.name as "subtopic",
          
          q.id as "questionId",
          q.question_text as "questionText",
          q.correct_answer as "correctAnswer",
          eq.user_answer as "userAnswer",
          eq.is_correct as "isCorrect",
          q.difficulty as "difficulty",
          (eq.response_metadata->>'timeSpentSeconds')::int as "timeSpentSeconds",
          35 as "thresholdSeconds",
          
          sk.name as "skillName",
          sk.category as "skillCategory",
          
          mv.stable_count,
          mv.logic_count,
          mv.error_count
        FROM exams e
        JOIN users u ON u.id = e.user_id
        JOIN user_profiles up ON up.user_id = u.id
        JOIN exam_questions eq ON eq.exam_id = e.id
        JOIN questions q ON q.id = eq.question_id
        JOIN topics t ON t.id = q.topic_id
        JOIN subjects sub ON sub.id = t.subject_id
        JOIN domains d ON d.id = sub.domain_id
        LEFT JOIN subtopics st ON st.id = q.subtopic_id
        LEFT JOIN question_skills qs ON qs.question_id = q.id
        LEFT JOIN skills sk ON sk.id = qs.skill_id
        LEFT JOIN attempt_analytics_mv mv ON mv.exam_id = e.id
        WHERE e.id = ${examId}
      `);

      type RawAttemptDbRow = {
        studentId: string;
        studentName: string;
        studentEmail: string;
        sessionId: string;
        sessionDate: string;
        vectorId: string;
        domain: string;
        subject: string;
        topic: string;
        subtopic: string | null;
        questionId: string;
        questionText: string;
        correctAnswer: string;
        userAnswer: string | null;
        isCorrect: boolean | null;
        difficulty: string | null;
        timeSpentSeconds: number | null;
        skillName: string | null;
        skillCategory: string | null;
        stable_count?: number | null;
        logic_count?: number | null;
        error_count?: number | null;
      };

      return (rows.rows as RawAttemptDbRow[]).map((row) => {
        const timeSpent = row.timeSpentSeconds ?? 0;
        const isCorrect = row.isCorrect === true;
        
        // Compute on the fly as requested
        const isImpulsive = !isCorrect && timeSpent < 35;
        const isDiligent = isCorrect && timeSpent > 35;
        
        const difficulty = (row.difficulty ?? 'simple').toLowerCase();
        const masteryWeight = difficulty === 'expert' ? 3 : (difficulty === 'intermediate' ? 2 : 1);
        const weightedScore = isCorrect ? masteryWeight : 0;

        const stableCount = row.stable_count ?? 0;
        const logicCount = row.logic_count ?? 0;
        const errorCount = row.error_count ?? 0;
        let pattern: 'stable' | 'logic' | 'neural_error' | null = null;
        if (stableCount + logicCount + errorCount > 0) {
          if (errorCount >= logicCount && errorCount >= stableCount) pattern = 'neural_error';
          else if (logicCount >= stableCount) pattern = 'logic';
          else pattern = 'stable';
        }

        return {
          studentId: row.studentId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          sessionId: row.sessionId,
          sessionDate: row.sessionDate,
          vectorId: row.vectorId,
          domain: row.domain,
          subject: row.subject,
          topic: row.topic,
          subtopic: row.subtopic ?? 'General',
          questionId: row.questionId,
          questionText: row.questionText,
          correctAnswer: row.correctAnswer,
          userAnswer: row.userAnswer,
          isCorrect: isCorrect,
          difficulty: row.difficulty ?? 'simple',
          timeSpentSeconds: timeSpent,
          thresholdSeconds: 35,
          skillName: row.skillName ?? 'General Reasoning',
          skillCategory: row.skillCategory,
          processingPattern: pattern,
          isImpulsive,
          isDiligent,
          masteryWeight,
          weightedScore
        } as RawAttemptRow;
      });
    });
  }

  async fetchHistoricalAttempts(userId: string, currentExamId: string): Promise<RawAttemptRow[]> {
    return withSpan('ExportQueryBuilder.fetchHistoricalAttempts', async (span) => {
      span.setAttribute('userId', userId);
      
      const rows = await db.execute(sql`
        SELECT 
          u.id as "studentId",
          up.name as "studentName",
          u.email as "studentEmail",
          e.id as "sessionId",
          e.started_at as "sessionDate",
          LEFT(e.id::text, 8) as "vectorId",
          
          d.name as "domain",
          sub.name as "subject",
          t.name as "topic",
          st.name as "subtopic",
          
          q.id as "questionId",
          q.question_text as "questionText",
          q.correct_answer as "correctAnswer",
          eq.user_answer as "userAnswer",
          eq.is_correct as "isCorrect",
          q.difficulty as "difficulty",
          (eq.response_metadata->>'timeSpentSeconds')::int as "timeSpentSeconds",
          35 as "thresholdSeconds",
          
          sk.name as "skillName",
          sk.category as "skillCategory"
        FROM exams e
        JOIN users u ON u.id = e.user_id
        JOIN user_profiles up ON up.user_id = u.id
        JOIN exam_questions eq ON eq.exam_id = e.id
        JOIN questions q ON q.id = eq.question_id
        JOIN topics t ON t.id = q.topic_id
        JOIN subjects sub ON sub.id = t.subject_id
        JOIN domains d ON d.id = sub.domain_id
        LEFT JOIN subtopics st ON st.id = q.subtopic_id
        LEFT JOIN question_skills qs ON qs.question_id = q.id
        LEFT JOIN skills sk ON sk.id = qs.skill_id
        WHERE e.user_id = ${userId} 
          AND e.id != ${currentExamId}
          AND e.status = 'completed'
        ORDER BY e.started_at ASC
      `);

      type HistoricalAttemptDbRow = {
        studentId: string;
        studentName: string;
        studentEmail: string;
        sessionId: string;
        sessionDate: string;
        vectorId: string;
        domain: string;
        subject: string;
        topic: string;
        subtopic: string | null;
        questionId: string;
        questionText: string;
        correctAnswer: string;
        userAnswer: string | null;
        isCorrect: boolean | null;
        difficulty: string | null;
        timeSpentSeconds: number | null;
        skillName: string | null;
        skillCategory: string | null;
      };

      return (rows.rows as HistoricalAttemptDbRow[]).map((row) => {
        const timeSpent = row.timeSpentSeconds ?? 0;
        const isCorrect = row.isCorrect === true;
        
        const difficulty = (row.difficulty ?? 'simple').toLowerCase();
        const masteryWeight = difficulty === 'expert' ? 3 : (difficulty === 'intermediate' ? 2 : 1);
        
        const pattern: 'stable' | 'logic' | 'neural_error' | null = null;

        return {
          studentId: row.studentId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          sessionId: row.sessionId,
          sessionDate: row.sessionDate,
          vectorId: row.vectorId,
          domain: row.domain,
          subject: row.subject,
          topic: row.topic,
          subtopic: row.subtopic ?? 'General',
          questionId: row.questionId,
          questionText: row.questionText,
          correctAnswer: row.correctAnswer,
          userAnswer: row.userAnswer,
          isCorrect: isCorrect,
          difficulty: row.difficulty ?? 'simple',
          timeSpentSeconds: timeSpent,
          thresholdSeconds: 35,
          skillName: row.skillName ?? 'General Reasoning',
          skillCategory: row.skillCategory,
          processingPattern: pattern,
          isImpulsive: !isCorrect && timeSpent < 35,
          isDiligent: isCorrect && timeSpent > 35,
          masteryWeight,
          weightedScore: isCorrect ? masteryWeight : 0
        } as RawAttemptRow;
      });
    });
  }

  async fetchUserMeta(examId: string): Promise<ExportMeta> {
    return withSpan('ExportQueryBuilder.fetchUserMeta', async (_span) => {
      const result = await db.select({
        email: users.email,
        name: userProfiles.name,
        examId: exams.id,
        startedAt: exams.startedAt,
        domainId: domains.id,
        domainName: domains.name,
        subjectId: subjects.id,
        subjectName: subjects.name,
        topicId: topics.id,
        topicName: topics.name
      })
      .from(exams)
      .innerJoin(users, eq(exams.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(examBlueprints, eq(exams.blueprintId, examBlueprints.id))
      // Approximate lineage from the first question's hierarchy or many-to-one
      // Mirroring ReportEngine.getPremiumExamReport() logic potentially
      .innerJoin(examQuestions, eq(exams.id, examQuestions.examId))
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .innerJoin(topics, eq(questions.topicId, topics.id))
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .innerJoin(domains, eq(subjects.domainId, domains.id))
      .where(eq(exams.id, examId))
      .limit(1);

      if (result.length === 0) throw new Error('Exam metadata not found');
      
      const r = result[0];
      return {
        candidateName: r.name,
        candidateEmail: r.email,
        vectorId: r.examId.substring(0, 8).toUpperCase(),
        examId: r.examId,
        startedAt: r.startedAt.toISOString(),
        lineage: {
          domain: r.domainName,
          subject: r.subjectName,
          topic: r.topicName
        }
      };
    });
  }
}
