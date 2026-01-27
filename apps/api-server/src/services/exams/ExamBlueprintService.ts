import { db, questions, examBlueprints, topics, subtopics, subjects, domains } from "@quiz/db";
import { eq, and, or, inArray, sql } from "drizzle-orm";


/**
 * Enterprise Exam Blueprint Generation Service
 * Follows strict rules defined in: docs/execution/EXAM_BLUEPRINT_GENERATION.md
 */

interface BlueprintConfiguration {
  domainId: string;

  subjectIds?: string[];
  topicIds?: string[];
  subtopicIds?: string[];
  questionCount: number;
  difficultyPreference: 'mixed' | 'simple' | 'intermediate' | 'expert';
}

interface DifficultyDistribution {
  simple: number;
  intermediate: number;
  expert: number;
}

export class ExamBlueprintService {
  /**
   * Generates a new exam blueprint based on the provided configuration.
   * Performs resolution, fetching, randomization, and persistence.
   */
  async generateBlueprint(config: BlueprintConfiguration): Promise<string> {
    const { domainId, subjectIds, topicIds, subtopicIds, questionCount, difficultyPreference } = config;

    console.log(`[BlueprintGen] Starting for Domain=${domainId}, Ss=${subjectIds?.length}, Ts=${topicIds?.length}, STs=${subtopicIds?.length}, N=${questionCount}, Diff=${difficultyPreference}`);

    // 1. Calculate Distribution based on Preference
    const distribution = this.calculateDistribution(questionCount, difficultyPreference);
    console.log(`[BlueprintGen] Distribution: ${JSON.stringify(distribution)}`);

    // 2. Fetch Eligible Questions by Bucket
    const simpleQuestions = await this.fetchQuestions(distribution.simple, 'simple', domainId, subjectIds, topicIds, subtopicIds);
    const intermediateQuestions = await this.fetchQuestions(distribution.intermediate, 'intermediate', domainId, subjectIds, topicIds, subtopicIds);
    const expertQuestions = await this.fetchQuestions(distribution.expert, 'expert', domainId, subjectIds, topicIds, subtopicIds);

    // 3. Validate Pool Sufficiency (Strict Mode)
    if (simpleQuestions.length < distribution.simple) {
      throw new Error(`Insufficient pool for SIMPLE questions. Required: ${distribution.simple}, Found: ${simpleQuestions.length}`);
    }
    if (intermediateQuestions.length < distribution.intermediate) {
      throw new Error(`Insufficient pool for INTERMEDIATE questions. Required: ${distribution.intermediate}, Found: ${intermediateQuestions.length}`);
    }
    if (expertQuestions.length < distribution.expert) {
      throw new Error(`Insufficient pool for EXPERT questions. Required: ${distribution.expert}, Found: ${expertQuestions.length}`);
    }

    // 4. Combine IDs
    const timestamp = new Date().toISOString();
    const name = `Enterprise Generated Exam - ${timestamp}`;

    const [blueprint] = await db.insert(examBlueprints).values({
      name: name,
      description: `Dynamically generated enterprise exam (${questionCount} Qs, ${difficultyPreference}).`,
      domains: [domainId],

      subjects: subjectIds || [], 
      topics: topicIds || [],
      subtopics: subtopicIds || [],
      difficultyDistribution: distribution,
      totalQuestions: questionCount,
    }).returning();

    console.log(`[BlueprintGen] Created Blueprint ID: ${blueprint.id}`);
    return blueprint.id;
  }

  /**
   * Calculates distribution based on preference.
   * Mixed: 30/30/40 split.
   * Specific: 100% to selected tier.
   */
  private calculateDistribution(total: number, preference: 'mixed' | 'simple' | 'intermediate' | 'expert'): DifficultyDistribution {
    if (preference === 'mixed') {
      const simple = Math.floor(total * 0.30);
      const intermediate = Math.floor(total * 0.30);
      const expert = total - (simple + intermediate); // Absorbs remainder
      return { simple, intermediate, expert };
    }

    // 100% Specific
    return {
      simple: preference === 'simple' ? total : 0,
      intermediate: preference === 'intermediate' ? total : 0,
      expert: preference === 'expert' ? total : 0,
    };
  }

  /**
   * Fetches random questions matching criteria.
   * Uses hierarchical resolution with "Deepest Selection Wins" logic.
   */
  private async fetchQuestions(
    count: number, 
    difficulty: 'simple' | 'intermediate' | 'expert',
    domainId: string,

    subjectIds: string[] = [],
    topicIds: string[] = [],
    subtopicIds: string[] = []
  ) {
    if (count === 0) return [];

    // 1. Resolve Effective Selections
    const topicParentsOfSubtopics = subtopicIds.length > 0 
        ? (await db.select({ topicId: subtopics.topicId })
                  .from(subtopics)
                  .where(inArray(subtopics.id, subtopicIds))
          ).map(r => r.topicId)
        : [];
    
    const actualTopicIds = topicIds.filter(id => !topicParentsOfSubtopics.includes(id));
    
    const subjectParentsOfTopics = topicIds.length > 0 
        ? (await db.select({ subjectId: topics.subjectId })
                  .from(topics)
                  .where(inArray(topics.id, topicIds))
          ).map(r => r.subjectId)
        : [];
    
    const actualSubjectIds = subjectIds.filter(id => !subjectParentsOfTopics.includes(id));

    // 2. Build Query Conditions
    const subtopicCond = subtopicIds.length > 0 ? inArray(questions.subtopicId, subtopicIds) : null;
    const topicCond = actualTopicIds.length > 0 ? inArray(questions.topicId, actualTopicIds) : null;
    
    let subjectTopicCond = null;
    if (actualSubjectIds.length > 0) {
        const subQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, actualSubjectIds));
        subjectTopicCond = inArray(questions.topicId, subQuery);
    }

    let domainCond = null;
    if (!subtopicCond && !topicCond && !subjectTopicCond) {
        const subjectsSubQuery = db.select({ id: subjects.id }).from(subjects).where(eq(subjects.domainId, domainId));
        const topicsSubQuery = db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectsSubQuery));
        domainCond = inArray(questions.topicId, topicsSubQuery);
    }

    const hierarchyCond = or(
        subtopicCond || undefined, 
        topicCond || undefined, 
        subjectTopicCond || undefined, 
        domainCond || undefined
    );

    // 3. Fetch randomized
    return await db.select({ id: questions.id })
      .from(questions)
      .where(and(
          hierarchyCond,
          eq(questions.status, 'active'),
          eq(questions.difficulty, difficulty)
      ))
      .orderBy(sql`RANDOM()`)
      .limit(count);
  }
}
