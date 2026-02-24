import { db, exams } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { TokenService } from "@/modules/auth/token.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");

    if (attemptId === null || attemptId.trim() === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Authenticate user
    const token = TokenService.getAccessToken(req, { scope: "user" }) ?? null;
    if (token === null) {
      // Check for internal key as fallback for server-side checks
      const internalKey = req.headers.get("x-internal-key");
      const expectedKey = process.env.INTERNAL_API_KEY;
      if (expectedKey === undefined || expectedKey === null || expectedKey === "") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (internalKey !== expectedKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let userId: string;
    if (token !== null) {
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;
    } else {
      // Internal bypass - get userId from exam
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true },
      });
      if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      userId = exam.userId;
    }

    // 2. Verify ownership
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    if (exam.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Get file reference
    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (!report || report.fileRef === null || report.fileRef === undefined || report.fileRef === "" || report.status !== "ready") {
      return NextResponse.json({ error: "Report not ready or not found" }, { status: 404 });
    }

    // 4. Generate a temporary read-only URL for the private blob
    // This allows the browser to download it without us having to buffer the whole file
    // Vercel Blob 'getDownloadUrl' with a token will return the actual accessible URL
    logger.info({ attemptId }, "[ReportDownload] Generating signed URL for private blob");
    
    // Note: In Vercel Blob, if the store is private, we can use the head/get methods 
    // or just rely on the token. For a direct browser download, 
    // the cleanest way is a redirect to the actual signed URL.
    
    // Using simple fetch and stream approach if signed URL is complex,
    // but vercel-blob's getDownloadUrl handles this.
    // However, for private blobs, we often just fetch it.
    
    const blobResponse = await fetch(report.fileRef, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN ?? ""}`,
      },
    });

    if (!blobResponse.ok) {
      throw new Error(`Failed to fetch from storage: ${blobResponse.statusText}`);
    }

    const blob = await blobResponse.blob();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Report-${attemptId}.pdf"`,
      },
    });

  } catch (error) {
    logger.error({ err: error }, "[ReportDownload] Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
