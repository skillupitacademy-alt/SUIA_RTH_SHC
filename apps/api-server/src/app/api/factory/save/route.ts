import { NextResponse } from "next/server";
import { db, questions, skills, questionSkills } from "@quiz/db";
import { eq, inArray, sql } from "drizzle-orm";
import { TokenService } from "@/modules/auth/token.service";

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
}

export async function POST(req: Request) {
  try {
    // 1. Defense-in-Depth Admin Check (P0-SEC-002)
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) {
      return NextResponse.json({ error: "Authentication required", scope: 'admin' }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);

    const { questions: newQuestions, topicId, subtopicId } = (await req.json()) as SavePayload;

    if (!newQuestions?.length || !topicId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1. Extract all unique skill names from the payload
    const allSkillNames = Array.from(
      new Set(newQuestions.flatMap((q) => q.skillNames || []).map((s) => s.toLowerCase().trim()))
    ).filter(Boolean);

    // 2. Resolve Skills (Find existing IDs, Create new ones)
    const existingSkills = await db
      .select({ id: skills.id, name: skills.name })
      .from(skills)
      .where(inArray(sql`LOWER(${skills.name})`, allSkillNames));

    const existingSkillMap = new Map(existingSkills.map((s) => [s.name.toLowerCase(), s.id]));
    const skillsToCreate = allSkillNames.filter((name) => !existingSkillMap.has(name));

    const newSkillMap = new Map<string, string>();

    // Use transaction for safer bulk writes
    await db.transaction(async (tx) => {
        // Create new skills if needed
        if (skillsToCreate.length > 0) {
            await tx.insert(skills).values(
                skillsToCreate.map((name) => ({
                    name: name,
                    category: "technical" as const, // Cast to literal for enum compatibility
                    mappingType: "technical" as const, // Cast to literal for enum compatibility
                }))
            );
            
            const created = await tx.select({ id: skills.id, name: skills.name })
                .from(skills)
                .where(inArray(skills.name, skillsToCreate));
            
            created.forEach((s) => newSkillMap.set(s.name.toLowerCase(), s.id));
        }

        const finalSkillMap = new Map([...existingSkillMap, ...newSkillMap]);

        // 3. Insert Questions and Link Skills
        for (const q of newQuestions) {
            const [insertedQ] = await tx
                .insert(questions)
                .values({
                    topicId,
                    subtopicId: subtopicId || null,
                    questionText: q.questionText,
                    options: q.options as any, // Cast jsonb to any to satisfy Drizzle
                    correctAnswer: q.correctAnswer,
                    difficulty: q.difficulty as any,
                    mappingType: q.mappingType as any,
                    explanation: q.explanation,
                    codeSnippet: q.codeSnippet,
                    status: "active",
                })
                .returning({ id: questions.id });

            if (insertedQ) {
                const qSkillIds = (q.skillNames || [])
                    .map((name) => finalSkillMap.get(name.toLowerCase().trim()))
                    .filter(Boolean) as string[];

                if (qSkillIds.length > 0) {
                    await tx.insert(questionSkills).values(
                        qSkillIds.map((skillId) => ({
                            questionId: insertedQ.id,
                            skillId: skillId,
                        }))
                    );
                }
            }
        }
    });

    return NextResponse.json({
      success: true,
      insertedCount: newQuestions.length,
      newSkillsCreated: skillsToCreate.length,
    });
  } catch (error) {
    console.error("Factory Save Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied" },
      { status: 403 }
    );
  }
}
