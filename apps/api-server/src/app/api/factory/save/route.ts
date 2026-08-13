import { db, questions, questionSkills, skills } from "@quiz/db";
import { inArray, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { verifyAdminOrInfraToken } from "@/modules/auth/admin-audience.util";
import { SemanticSearchService } from "@/modules/intelligence/semantic-search.service";
import { DuplicateDetector } from "@/modules/question/duplicate-detector";
import { computeCodeHash, computeQuestionHash, normalizeConceptKey, normalizeObjectiveKey } from "@/modules/question/question-hash";

export const dynamic = "force-dynamic";

// Define strict types locally to ensure safety without circular deps
type Difficulty = 'simple' | 'intermediate' | 'expert';
type MappingType = 'conceptual' | 'technical' | 'practical';

const generatedQuestionSchema = z.object({
  id: z.string().optional(),
  questionText: z.string().min(1),
  codeSnippet: z.string().optional(),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(['simple', 'intermediate', 'expert']),
  depthLevel: z.number().int().min(1).max(10),
  mappingType: z.enum(['conceptual', 'technical', 'practical']),
  conceptKey: z.string().min(1).optional(),
  objectiveKey: z.string().min(1).optional(),
  skillNames: z.array(z.string()).optional(),
});

const savePayloadSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
  topicId: z.string().uuid(),
  subtopicId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
});

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

    const sanitized = sanitizeJsonField(rawBody);
    const parsed = savePayloadSchema.safeParse(sanitized);

    if (!parsed.success) {
      return ApiResponse.error(badRequest("Invalid payload", "BAD_REQUEST", parsed.error.issues));
    }

    const { questions: checkQuestions, topicId, subtopicId } = parsed.data;

    // ════════════════════════════════════════════════════════════════════
    // LAYERED DUPLICATE ENFORCEMENT (server-side safety net on commit).
    // Each question is evaluated through: exact hash → code → concept →
    // Upstash Vector → private judge. Duplicate verdicts hard-block the
    // whole save (the GUI already blocks per-question; this is the final
    // gate before the unique question_hash constraint fires).
    // ════════════════════════════════════════════════════════════════════
    const verdicts = await Promise.all(
      checkQuestions.map((q) =>
        DuplicateDetector.evaluate(
          {
            questionText: q.questionText,
            codeSnippet: q.codeSnippet,
            conceptKey: q.conceptKey,
            objectiveKey: q.objectiveKey,
            type: q.codeSnippet !== undefined && q.codeSnippet !== null && q.codeSnippet.trim() !== '' ? 'code_mcq' : 'mcq',
            correctAnswer: q.correctAnswer,
          },
          topicId
        )
      )
    );

    const duplicates = verdicts
      .map((v, idx) => (v.status === 'duplicate' || v.status === 'review' ? { index: idx, verdict: v } : null))
      .filter((d): d is { index: number; verdict: typeof verdicts[number] } => d !== null);

    if (duplicates.length > 0) {
      recordCounter('factory.api.save.blocked', 1, { topicId, blockedCount: duplicates.length });
      recordTimer('factory.api.save.duration', Date.now() - start, { outcome: 'blocked_duplicates' });
      return ApiResponse.error(
        badRequest(
          `Batch contains ${duplicates.length} duplicate/review-question(s). Resolve flagged questions in the Review Console and retry.`,
          'VALIDATION_FAILED',
          duplicates.map((d) => ({
            index: d.index,
            status: d.verdict.status,
            reason: d.verdict.reason,
            similarity: d.verdict.similarity,
          }))
        )
      );
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

    // Track inserted question ids for post-commit vector indexing.
    const insertedIds: string[] = [];

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

        // 3. Insert Questions, store duplicate-detection hashes, and Link Skills
        for (const q of checkQuestions) {
            const codeSnippet = (q.codeSnippet !== undefined && q.codeSnippet !== null && q.codeSnippet !== '') ? q.codeSnippet : null;
            const conceptKey = q.conceptKey !== undefined && q.conceptKey.trim() !== '' ? normalizeConceptKey(q.conceptKey) : null;
            const objectiveKey = q.objectiveKey !== undefined && q.objectiveKey.trim() !== '' ? normalizeObjectiveKey(q.objectiveKey) : null;
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
                    codeSnippet,
                    // Duplicate-detection layer (see packages/db/migrations/0027)
                    questionHash: computeQuestionHash(q.questionText),
                    codeHash: computeCodeHash(codeSnippet),
                    conceptKey,
                    objectiveKey,
                    metadata: {
                        depthLevel: q.depthLevel,
                        source: 'factory',
                    },
                    status: "active",
                })
                .returning({ id: questions.id });

            if (insertedQ !== undefined && insertedQ !== null) {
                insertedIds.push(insertedQ.id);
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

    // Fire-and-forget vector indexing for newly inserted questions.
    // The Upstash index was pre-created with a hosted text-compute embedding model.
    checkQuestions.forEach((q, idx) => {
        const id = insertedIds[idx];
        if (id === undefined) return;
        void SemanticSearchService.indexQuestion(
            id,
            q.questionText,
            {
                topicId,
                type: q.codeSnippet !== undefined && q.codeSnippet !== null && q.codeSnippet.trim() !== '' ? 'code_mcq' : 'mcq',
                status: 'active',
                codeSnippet: q.codeSnippet,
                correctAnswer: q.correctAnswer,
                conceptKey: q.conceptKey,
                objectiveKey: q.objectiveKey,
            }
        );
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
