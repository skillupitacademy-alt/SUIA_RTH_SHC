import { db, exams } from "@quiz/db";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  const start = Date.now();
  const cronAuth = req.headers.get("Authorization") ?? "";
  const isVercelCron =
    process.env.CRON_SECRET != null && cronAuth === `Bearer ${process.env.CRON_SECRET}`;

  const internalKey = req.headers.get("x-internal-key") ?? "";
  const isInternal =
    process.env.INTERNAL_API_KEY != null
      ? internalKey === process.env.INTERNAL_API_KEY
      : internalKey === "secret";

  if (!isVercelCron && !isInternal && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const testExam = await db.query.exams.findFirst({
      where: eq(exams.status, "completed"),
      orderBy: [desc(exams.completedAt)]
    });

    if (!testExam) {
      return NextResponse.json({ message: "No completed exams to test with" });
    }

    const { fileSizeKb, pageCount } = await ReportPdfService.generate(testExam.id);

    if (fileSizeKb < 50) { 
      throw new Error(`PDF Health Check Failed: Size too small (${fileSizeKb}KB)`);
    }

    recordCounter('cron.pdf_health.success', 1, { fileSizeKb, pageCount });
    recordTimer('cron.pdf_health.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json({ 
      status: "healthy",
      fileSizeKb,
      pageCount
    });

  } catch (error: unknown) {
    recordCounter('cron.pdf_health.failure', 1);
    return NextResponse.json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'system', operation: 'cron_pdf_health' });
