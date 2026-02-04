
import { NextResponse } from "next/server";
import { db, questions } from "@quiz/db";
import { eq, and, inArray } from "drizzle-orm";
import { TokenService } from "@/modules/auth/token.service";
import { verifyAdmin } from "@/modules/auth/rbac.service";

interface DuplicateCheckPayload {
  questions: { questionText: string }[];
  topicId: string;
}

export async function POST(req: Request) {
  try {
    // 1. Defense-in-Depth Admin Check (P0-SEC-002)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await TokenService.verifyAccessToken(token);
    const isAdmin = await verifyAdmin(payload);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { questions: checkQuestions, topicId } = (await req.json()) as DuplicateCheckPayload;

    if (!checkQuestions?.length || !topicId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1. Fetch all existing question texts for this topic
    // Optimization: In a real large-scale system, we'd use hashes or a vector DB.
    // For now, fetching texts for the topic is acceptable given typical topic sizes (<1000 questions).
    const existingQuestions = await db
      .select({ id: questions.id, text: questions.questionText })
      .from(questions)
      .where(and(
        eq(questions.topicId, topicId),
        eq(questions.status, "active")
      ));

    // 2. Normalize helper
    const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');

    // 3. Create Map of Normalized Text -> ID
    const existingMap = new Map<string, string>();
    existingQuestions.forEach(q => {
        existingMap.set(normalize(q.text), q.id);
    });

    // 4. Check inputs
    const duplicates = checkQuestions.map((q, idx) => {
        const norm = normalize(q.questionText);
        if (existingMap.has(norm)) {
            return {
                index: idx,
                originalId: existingMap.get(norm),
                isDuplicate: true
            };
        }
        return null;
    }).filter(Boolean);

    return NextResponse.json({
      details: duplicates,
      foundCount: duplicates.length
    });

  } catch (error) {
    console.error("Duplicate Check Error:", error);
    return NextResponse.json(
      { error: "Failed to check duplicates" },
      { status: 500 }
    );
  }
}
