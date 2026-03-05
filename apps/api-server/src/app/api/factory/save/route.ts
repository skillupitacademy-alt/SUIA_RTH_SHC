import { db, questions, questionSkills, skills } from "@quiz/db";
import { inArray, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { verifyAdminOrInfraToken } from "@/modules/auth/admin-audience.util";

// Define strict types locally to ensure safety without circular deps
type Difficulty = 'simple' | 'intermediate' | 'expert';
type MappingType = 'conceptual' | 'technical' | 'practical';

interface GeneratedQuestion {
    id?: string;
    questionText: string;
    codeSnippet?: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: Difficulty;
    depthLevel: number;
    mappingType: MappingType;
    skillNames: string[];
}

interface SavePayload {
  questions: GeneratedQuestion[];
  topicId: string;
  subtopicId?: string;
  skillId?: string;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    // 1. Defense-in-Depth Admin Check (P0-SEC-002)
    try {
      await verifyAdminOrInfraToken(req);
    } catch {
      return ApiResponse.error(unauthorized("Authentication required"));
    }

    const rawBody = await req.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest("Payload too deep or large"));
    }

    const { questions: checkQuestions, topicId, subtopicId } = sanitizeJsonField(rawBody) as SavePayload;

    if (!checkQuestions?.length || !topicId) {
      return ApiResponse.error(badRequest("Invalid payload"));
    }

    // 1. Extract all unique skill names from the payload
    const allSkillNames = Array.from(
      new Set(checkQuestions.flatMap((q) => (q.skillNames !== undefined && q.skillNames !== null ? q.skillNames : [])).map((s) => s.toLowerCase().trim()))
    ).filter(Boolean);

    // 2. Resolve Skills (Find existing IDs, Create new ones)
    const existingSkills = await db
      .select({ id: skills.id, name: skills.name })
      .from(skills)
      .where(inArray(sql`LOWER(${skills.name})`, allSkillNames.length > 0 ? allSkillNames : ['__none__']));

    const existingSkillMap = new Map(existingSkills.map((s) => [s.name.toLowerCase(), s.id]));
    const skillsToCreate = allSkillNames.filter((name) => !existingSkillMap.has(name));

    const newSkillMap = new Map<string, string>();

    // Use transaction for safer bulk writes
    await db.transaction(async (tx) => {
        // Create new skills if needed
        if (skillsToCreate.length > 0) {
            await tx.insert(skills).values(
                skillsToCreate.map((name: string) => ({
                    name: name,
                    category: "technical" as const,
                    mappingType: "technical" as const,
                }))
            );
            
            const created = await tx.select({ id: skills.id, name: skills.name })
                .from(skills)
                .where(inArray(skills.name, skillsToCreate));
            
            created.forEach((s) => newSkillMap.set(s.name.toLowerCase(), s.id));
        }

        const finalSkillMap = new Map([...existingSkillMap, ...newSkillMap]);

        // 3. Insert Questions and Link Skills
        for (const q of checkQuestions) {
            const [insertedQ] = await tx
                .insert(questions)
                .values({
                    topicId,
                    subtopicId: (subtopicId !== undefined && subtopicId !== null && subtopicId !== '') ? subtopicId : null,
                    questionText: q.questionText,
                    options: q.options as string[],
                    correctAnswer: q.correctAnswer,
                    difficulty: q.difficulty as Difficulty,
                    mappingType: q.mappingType as MappingType,
                    explanation: q.explanation,
                    codeSnippet: (q.codeSnippet !== undefined && q.codeSnippet !== null && q.codeSnippet !== '') ? q.codeSnippet : null,
                    status: "active",
                })
                .returning({ id: questions.id });

            if (insertedQ !== undefined && insertedQ !== null) {
                const qSkillNames = (q.skillNames !== undefined && q.skillNames !== null) ? q.skillNames : [];
                const qSkillIds = qSkillNames
                    .map((name: string) => finalSkillMap.get(name.toLowerCase().trim()))
                    .filter(Boolean) as string[];

                if (qSkillIds.length > 0) {
                    await tx.insert(questionSkills).values(
                        qSkillIds.map((skillId: string) => ({
                            questionId: insertedQ.id,
                            skillId: skillId,
                        }))
                    );
                }
            }
        }
    });

    recordCounter('factory.api.save.success', 1, { topicId });
    recordTimer('factory.api.save.duration', Date.now() - start, { outcome: 'success' });
    
    return ApiResponse.success({
      success: true,
      insertedCount: checkQuestions.length,
      newSkillsCreated: skillsToCreate.length,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Factory Save Error");
    recordCounter('factory.api.save.failure', 1, { reason: 'internal_error' });
    recordTimer('factory.api.save.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(handler, { component: 'factory', operation: 'save_questions' });
