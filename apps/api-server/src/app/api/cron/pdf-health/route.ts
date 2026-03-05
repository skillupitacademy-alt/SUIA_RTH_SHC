import { db, exams } from "@quiz/db";
import { desc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";

export const runtime = "nodejs";

async function getHandler(req: NextRequest) {
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
    throw unauthorized("Unauthorized");
  }

  try {
    const testExam = await db.query.exams.findFirst({
      where: eq(exams.status, "completed"),
      orderBy: [desc(exams.completedAt)]
    });

    if (!testExam) {
      return ApiResponse.success({ message: "No completed exams to test with" });
    }

    const { fileSizeKb, pageCount } = await ReportPdfService.generate(testExam.id);

    if (fileSizeKb < 50) { 
      throw new Error(`PDF Health Check Failed: Size too small (${fileSizeKb}KB)`);
    }

    recordCounter('cron.pdf_health.success', 1, { fileSizeKb, pageCount });
    const durationMs = Date.now() - start;
    recordTimer('cron.pdf_health.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success({ 
      status: "healthy",
      fileSizeKb,
      pageCount
    }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });

  } catch (error: unknown) {
    recordCounter('cron.pdf_health.failure', 1);
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'cron_pdf_health' });
