import { db, questions, examBlueprints, topics, subjects, domains } from "@quiz/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Enterprise Exam Blueprint Generation Service
 * Follows strict rules defined in: docs/execution/EXAM_BLUEPRINT_GENERATION.md
 */

interface BlueprintConfiguration {
  domainId: string;
  subjectId?: string;
  topicId?: string;
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
    const { domainId, subjectId, topicId, questionCount, difficultyPreference } = config;

    console.log(`[BlueprintGen] Starting for Domain=${domainId}, S=${subjectId}, T=${topicId}, N=${questionCount}, Diff=${difficultyPreference}`);

    // 1. Calculate Distribution based on Preference
    const distribution = this.calculateDistribution(questionCount, difficultyPreference);
    console.log(`[BlueprintGen] Distribution: ${JSON.stringify(distribution)}`);

    // 2. Fetch Eligible Questions by Bucket
    const simpleQuestions = await this.fetchQuestions(distribution.simple, 'simple', domainId, subjectId, topicId);
    const intermediateQuestions = await this.fetchQuestions(distribution.intermediate, 'intermediate', domainId, subjectId, topicId);
    const expertQuestions = await this.fetchQuestions(distribution.expert, 'expert', domainId, subjectId, topicId);

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
      id: uuidv4(),
      name: name,
      description: `Dynamically generated enterprise exam (${questionCount} Qs, ${difficultyPreference}).`,
      domains: [domainId],
      subjects: subjectId ? [subjectId] : [], 
      topics: topicId ? [topicId] : [],
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
   * Uses Drizzle ORM with subqueries for hierarchy resolution.
   */
  private async fetchQuestions(
    count: number, 
    difficulty: 'simple' | 'intermediate' | 'expert',
    domainId: string,
    subjectId?: string,
    topicId?: string
  ) {
    if (count === 0) return [];

    // Base filters
    const conditions = [
      eq(questions.status, 'active'),
      eq(questions.difficulty, difficulty)
    ];

    // Hierarchy Filters
    if (topicId) {
      conditions.push(eq(questions.topicId, topicId));
    } else if (subjectId) {
      const subQuery = db.select({ id: topics.id })
                         .from(topics)
                         .where(eq(topics.subjectId, subjectId));
      conditions.push(inArray(questions.topicId, subQuery));
    } else {
      const subjectsSubQuery = db.select({ id: subjects.id })
                                 .from(subjects)
                                 .where(eq(subjects.domainId, domainId));
                                 
      const topicsSubQuery = db.select({ id: topics.id })
                               .from(topics)
                               .where(inArray(topics.subjectId, subjectsSubQuery));

      conditions.push(inArray(questions.topicId, topicsSubQuery));
    }

    // Fetch randomized
    return await db.select({ id: questions.id })
      .from(questions)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(count);
  }
}
