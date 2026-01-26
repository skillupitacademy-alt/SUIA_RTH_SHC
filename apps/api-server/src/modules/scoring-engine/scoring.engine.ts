import { db, examQuestions, resultsByDimension, exams, questions } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
export const dynamic = 'force-dynamic';

export class ScoringEngine {
  static async calculateExamResults(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: true,
          }
        }
      }
    });

    if (!exam) throw new Error('Exam not found');

    const dimensions: Record<string, { total: number; correct: number; name?: string }> = {};

    // 1. Resolve Hierarchy Data
    const topicIds = [...new Set(exam.examQuestions.map(eq => eq.question.topicId))];
    const topicData = await db.query.topics.findMany({
      where: (topics, { inArray }) => inArray(topics.id, topicIds as string[]),
      with: {
        subject: {
          with: {
            domain: true
          }
        },
        topicSkills: {
          with: {
            skill: true
          }
        },
        subtopics: true
      }
    });

    const topicMap = new Map(topicData.map(t => [t.id, t]));

    // 2. Analyze performance by various dimensions
    for (const eqRecord of exam.examQuestions) {
      const q = eqRecord.question;
      const t = topicMap.get(q.topicId);
      if (!t) continue;

      const dims = [
        { type: 'domain', id: t.subject.domain.id, name: t.subject.domain.name },
        { type: 'subject', id: t.subject.id, name: t.subject.name },
        { type: 'topic', id: t.id, name: t.name },
        { type: 'difficulty', id: q.difficulty, name: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) },
      ];

      // Add Subtopic if present
      if (q.subtopicId) {
          const st = t.subtopics.find(s => s.id === q.subtopicId);
          if (st) {
            dims.push({ type: 'subtopic', id: st.id, name: st.name });
          }
      }

      // Add Skills
      t.topicSkills.forEach(ts => {
        dims.push({ type: 'skill', id: ts.skill.id, name: ts.skill.name });
      });

      for (const d of dims) {
        const key = `${d.type}:${d.id}`;
        if (!dimensions[key]) dimensions[key] = { total: 0, correct: 0, name: d.name };
        dimensions[key].total++;
        if (eqRecord.isCorrect) dimensions[key].correct++;
      }
    }

    // 3. Prepare data for results_by_dimension
    const resultsData = Object.entries(dimensions).map(([key, stats]) => {
      const [type, id] = key.split(':');
      return {
        examId,
        dimensionType: type,
        dimensionId: id as string,
        name: stats.name,
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
       };
    });

    // Clear old results if any (idempotency)
    await db.delete(resultsByDimension).where(eq(resultsByDimension.examId, examId));

    if (resultsData.length > 0) {
      await db.insert(resultsByDimension).values(resultsData as any);
    }

    // 4. Update total score and finalize exam
    const totalCorrect = exam.examQuestions.filter(q => q.isCorrect).length;
    const finalScore = Math.round((totalCorrect / exam.examQuestions.length) * 100);

    await db.update(exams)
      .set({ 
        totalScore: finalScore, 
        completedAt: new Date(), 
        status: 'completed' 
      })
      .where(eq(exams.id, examId));

    return finalScore;
  }
}
