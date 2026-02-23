import { db, exams } from "@quiz/db";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Simple cron auth check (Vercel provides this header)
  const cronAuth = req.headers.get("Authorization") ?? "";
  const isVercelCron =
    process.env.CRON_SECRET != null && cronAuth === `Bearer ${process.env.CRON_SECRET}`;

  // Also allow internal key for local testing
  const internalKey = req.headers.get("x-internal-key") ?? "";
  const isInternal =
    process.env.INTERNAL_API_KEY != null
      ? internalKey === process.env.INTERNAL_API_KEY
      : internalKey === "secret";

  if (!isVercelCron && !isInternal && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find a completed exam to test with
    const testExam = await db.query.exams.findFirst({
      where: eq(exams.status, "completed"),
      orderBy: [desc(exams.completedAt)]
    });

    if (!testExam) {
      return NextResponse.json({ message: "No completed exams to test with" });
    }

    const start = Date.now();
    
    // 2. Perform test generation
    const { buffer: _buf, fileSizeKb, pageCount } = await ReportPdfService.generate(testExam.id);
    const duration = Date.now() - start;

    // 3. Validate
    if (fileSizeKb < 50) { // Should be at least 50KB for a 7-page report
      throw new Error(`PDF Health Check Failed: Size too small (${fileSizeKb}KB)`);
    }

    logger.info({ 
      duration, 
      fileSizeKb, 
      pageCount,
      attemptId: testExam.id 
    }, "[PDF Health Check] Success");

    return NextResponse.json({ 
      status: "healthy",
      duration,
      fileSizeKb,
      pageCount
    });

  } catch (error: unknown) {
    logger.error({ err: error }, "[PDF Health Check] FAILED");
    return NextResponse.json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
