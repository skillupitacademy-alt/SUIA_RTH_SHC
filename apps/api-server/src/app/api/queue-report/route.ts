import { db, exams } from "@quiz/db";
import { eq } from "drizzle-orm";
import { after, NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { TokenService } from "@/modules/auth/token.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = await req.json().catch(() => ({} as unknown));
    const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

    const attemptFromBody = typeof body.attemptId === "string" ? body.attemptId : "";
    const attemptFromParams = searchParams.get("id") ?? searchParams.get("attemptId") ?? "";
    const attemptId = (attemptFromBody || attemptFromParams).trim();

    const isTrue = (val: unknown) => val === true || val === "true";
    const force = isTrue(body.force) || searchParams.get("force") === "true";

    if (attemptId === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Auth Validation (User Token or Internal Key)
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY ?? "secret";
    const isInternal = internalKeyHeader !== "" && internalSecret !== "" && internalKeyHeader === internalSecret;
    
    let userId: string;

    if (isInternal) {
      const examMatch = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true }
      });
      if (!examMatch) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      userId = examMatch.userId;
    } else {
      const token = TokenService.getAccessToken(req, { scope: "user" });
      if (token == null || token === "") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;

      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true }
      });

      if (!exam) {
        return NextResponse.json(
          { error: "Exam not found", reason: "not_found", attemptId },
          { status: 404 }
        );
      }

      if (exam.userId !== userId) {
        return NextResponse.json(
          { error: "Exam does not belong to this user", reason: "ownership_mismatch", attemptId },
          { status: 403 }
        );
      }

      if (exam.status !== "completed") {
        return NextResponse.json(
          { error: "Exam is not completed", reason: "not_completed", attemptId },
          { status: 400 }
        );
      }
    }

    // 2. State Machine Init
    await ReportRepository.createReportIfNotExists({ attemptId, userId, status: "pending" });

    // 3. Fire-and-forget Generation Trigger (Internal API call)
    let apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    
    if (apiBase === "" || apiBase.includes("localhost")) {
      // derive from request if possible to avoid DNS loops or missing ENVs
      const url = new URL(req.url);
      apiBase = `${url.protocol}//${url.host}/api`;
    }

    const generateUrl = `${apiBase}/generate-report`;
    
    // Use after() as the replacement for waitUntil in this environment
    // to ensure the background task survives the Vercel function lifecycle
    after(async () => {
      try {
        await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": process.env.INTERNAL_API_KEY ?? "secret"
          },
          body: JSON.stringify({ attemptId, force }),
          signal: AbortSignal.timeout(30000)
        });
      } catch (err) {
        logger.error({ err, attemptId, url: generateUrl }, "[QueueReport] Background trigger failed");
      }
    });

    return NextResponse.json({ status: "queued", attemptId });

  } catch (error: unknown) {
    logger.error({ err: error }, "[QueueReport] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
