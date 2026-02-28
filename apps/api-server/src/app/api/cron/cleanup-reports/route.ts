import { db, reports } from "@quiz/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { storage } from "@/lib/storage";
import { withLogging } from "@/lib/withLogging";

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
    let deletedCount = 0;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleReports = await db.query.reports.findMany({
      where: and(
        lt(reports.createdAt, oneDayAgo),
        inArray(reports.status, ["pending", "generating", "failed"])
      )
    });

    for (const report of staleReports) {
      await db.delete(reports).where(eq(reports.id, report.id));
      deletedCount++;
    }

    const distinctUsers = await db.selectDistinct({ userId: reports.userId }).from(reports);

    for (const { userId } of distinctUsers) {
      const userReports = await db.query.reports.findMany({
        where: eq(reports.userId, userId),
        orderBy: [desc(reports.createdAt)],
        offset: 3 
      });

      for (const oldReport of userReports) {
        if (oldReport.fileRef !== null && oldReport.fileRef !== undefined && oldReport.fileRef !== "" && typeof storage.delete === "function") {
          try {
            await storage.delete(oldReport.fileRef);
          } catch (_e: unknown) {
            // we let withLogging handle the error context, but this is a inner loop
          }
        }
        
        await db.delete(reports).where(eq(reports.id, oldReport.id));
        deletedCount++;
      }
    }

    recordCounter('cron.cleanup_reports.success', 1, { deletedCount });
    recordTimer('cron.cleanup_reports.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json({ status: "success", deletedCount });

  } catch (error: unknown) {
    recordCounter('cron.cleanup_reports.failure', 1);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'system', operation: 'cron_cleanup_reports' });
