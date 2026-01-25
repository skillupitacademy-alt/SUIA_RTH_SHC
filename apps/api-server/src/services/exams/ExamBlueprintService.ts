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
    const { domainId, subjectId, topicId, questionCount } = config;

    console.log(`[BlueprintGen] Starting for Domain=${domainId}, S=${subjectId}, T=${topicId}, N=${questionCount}`);

    // 1. Calculate Distribution (30/30/40)
    const distribution = this.calculateDistribution(questionCount);
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

    // 4. Combine IDs (We don't strictly need to shuffle the combined list if we just store the definition, 
    //    but if we were creating an 'exam_session' we would. 
    //    Here we are creating a *Blueprint*. The Blueprint stores the *distribution*, not the specific questions usually.
    //    However, the prompt says "Selection rules (no duplicates...)".
    //    If the 'exam_blueprints' table structure doesn't hold question IDs (it doesn't, see schema), 
    //    then this selection is verified but meant to be 'instantiated' later by the exam session creator using similar logic.
    //    BUT, for "Populate exam_blueprints table only", we act as if we are defining the *intent*.
    //    "Selection rules ... failure handling" -> This implies we must CHECK if we *can* fulfill it.
    
    //    Result: We persist the successfully validated configuration as a Blueprint.
    
    const timestamp = new Date().toISOString();
    const name = `Enterprise Generated Exam - ${timestamp}`;

    const [blueprint] = await db.insert(examBlueprints).values({
      id: uuidv4(),
      name: name,
      description: `Dynamically generated enterprise exam with mixed difficulty (${questionCount} questions).`,
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
   * Calculates the 30/30/40 split with remainder safety.
   */
  private calculateDistribution(total: number): DifficultyDistribution {
    const simple = Math.floor(total * 0.30);
    const intermediate = Math.floor(total * 0.30);
    const expert = total - (simple + intermediate); // Absorbs remainder
    return { simple, intermediate, expert };
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
      // Find topics in this subject
      // WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = subjectId)
      const subQuery = db.select({ id: topics.id })
                         .from(topics)
                         .where(eq(topics.subjectId, subjectId));
      conditions.push(inArray(questions.topicId, subQuery));
    } else {
      // Find topics in domains -> subjects
      // WHERE topic_id IN (SELECT id FROM topics WHERE subject_id IN (SELECT id FROM subjects WHERE domain_id = domainId))
      
      const subjectsSubQuery = db.select({ id: subjects.id })
                                 .from(subjects)
                                 .where(eq(subjects.domainId, domainId));
                                 
      const topicsSubQuery = db.select({ id: topics.id })
                               .from(topics)
                               .where(inArray(topics.subjectId, subjectsSubQuery));

      conditions.push(inArray(questions.topicId, topicsSubQuery));
    }

    // Fetch randomized
    // Drizzle with PostgreSQL: .orderBy(sql`RANDOM()`)
    return await db.select({ id: questions.id })
      .from(questions)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`) // Randomize for 'Selection rules'
      .limit(count);
  }
}
