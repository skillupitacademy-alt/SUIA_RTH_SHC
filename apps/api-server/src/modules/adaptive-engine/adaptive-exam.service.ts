import { db, examQuestions, exams, questions } from "@quiz/db";
import { inArray } from "drizzle-orm";

import { UserAnalyticsService } from "../analytics/user-analytics.service";
import { AdaptiveBlueprintService } from "./adaptive-blueprint.service";
import { AdaptivePromotionService } from "./adaptive-promotion.service";
import { AdaptiveQuestionSelectorService } from "./adaptive-question-selector.service";

export class AdaptiveExamService {
  /**
   * Orchestrates the entire adaptive exam generation pipeline.
   */
  static async startAdaptiveExam(userId: string) {
    // 1. Fetch User Analytics
    const snapshot = await UserAnalyticsService.getAdaptiveSnapshot(userId);

    // 2. Promotion Engine Check (Side effect: updates profile level)
    await AdaptivePromotionService.evaluatePromotion(userId, snapshot.difficulty);

    // 3. Generate Dynamic Blueprint
    const blueprint = AdaptiveBlueprintService.generate(snapshot);

    // 4. Select Questions
    const questionIds = await AdaptiveQuestionSelectorService.selectQuestions(userId, blueprint);

    if (questionIds.length === 0) {
      throw new Error("Could not find enough questions for an adaptive exam.");
    }

    // 5. Create Exam Instance (Atomic Transaction)
    const examId = await db.transaction(async (tx) => {
      // Create Exam
      const [exam] = await tx.insert(exams).values({
        userId,
        status: 'started',
        durationSeconds: blueprint.totalQuestions * 90, // 1.5 mins per question
        startedAt: new Date(),
      }).returning({ id: exams.id });

      // Create Exam Questions
      const examQuestionsData = questionIds.map((qId, index) => ({
        examId: exam.id,
        questionId: qId,
        order: index + 1,
      }));

      await tx.insert(examQuestions).values(examQuestionsData);

      return exam.id;
    });

    // 6. Fetch full question objects for the response
    const fullQuestions = await db.query.questions.findMany({
      where: inArray(questions.id, questionIds)
    });

    // Sort them by the original order
    const orderedQuestions = questionIds.map((id, index) => {
        const q = fullQuestions.find(fq => fq.id === id);
        return {
            ...q,
            order: index + 1
        };
    });

    return {
      examId,
      mode: "adaptive",
      blueprint, // Internal visibility
      questions: orderedQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        codeSnippet: q.codeSnippet,
        type: q.type,
        difficulty: q.difficulty,
        order: q.order
      }))
    };
  }
}
