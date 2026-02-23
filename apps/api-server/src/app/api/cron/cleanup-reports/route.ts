import { db, reports } from "@quiz/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { storage } from "@/lib/storage";

export async function GET(req: NextRequest) {
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

    // 1. Cleanup failed/pending reports older than 24h
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

    // 2. Keep only last 3 reports per user (Retention Policy)
    // This is more complex, we'll do it per user found in the reports table
    const distinctUsers = await db.selectDistinct({ userId: reports.userId }).from(reports);

    for (const { userId } of distinctUsers) {
      const userReports = await db.query.reports.findMany({
        where: eq(reports.userId, userId),
        orderBy: [desc(reports.createdAt)],
        offset: 3 // Skip the first 3 (latest)
      });

      for (const oldReport of userReports) {
        // Delete from storage if possible
        if (oldReport.fileRef !== null && oldReport.fileRef !== undefined && oldReport.fileRef !== "" && typeof storage.delete === "function") {
          try {
            await storage.delete(oldReport.fileRef);
          } catch (e: unknown) {
            logger.error({ err: e, fileRef: oldReport.fileRef }, "[Cleanup] Failed to delete from storage");
          }
        }
        
        await db.delete(reports).where(eq(reports.id, oldReport.id));
        deletedCount++;
      }
    }

    logger.info({ deletedCount }, "[Cleanup Cron] Completed");
    return NextResponse.json({ status: "success", deletedCount });

  } catch (error: unknown) {
    logger.error({ err: error }, "[Cleanup Cron] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
