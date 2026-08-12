import { db, topics } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TutorSecurityService } from "@/modules/tutor/tutor.security";

export const dynamic = "force-dynamic";

/**
 * GET /api/tutor/notes/download?topicId=...&expires=...&signature=...
 * Serves the actual notes file with proper Content-Disposition headers.
 */
async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId")?.trim() ?? "";
    const expires = searchParams.get("expires")?.trim() ?? "";
    const signature = searchParams.get("signature")?.trim() ?? "";

    if (topicId.length === 0 || expires.length === 0 || signature.length === 0) {
      return ApiResponse.error(unauthorized("Missing security parameters"), 401);
    }

    const isValid = TutorSecurityService.verifySignature(topicId, expires, signature);
    if (!isValid) {
      return ApiResponse.error(unauthorized("Invalid or expired link"), 403);
    }

    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
      columns: { name: true },
    });

    const realPath = "";
    if (realPath.length === 0) {
      return ApiResponse.error(notFound("Notes", topicId));
    }

    const topicName =
      typeof topic?.name === "string" && topic.name.length > 0 ? topic.name : "topic-notes";
    const safeFilename = `${topicName}.pdf`.replace(/[^a-z0-9.-]/gi, "_");

    const isHttp = realPath.length > 0 && realPath.startsWith("http");
    const isLocalAbsolute = realPath.length > 0 && realPath.startsWith("/");

    if (isHttp) {
      const response = await fetch(realPath);
      if (!response.ok) {
        return ApiResponse.error(new Error("Failed to fetch asset"), 502);
      }
      
      const blob = await response.blob();
      const durationMs = Date.now() - start;
      recordCounter(METRICS.TUTOR.NOTES_VIEW + '.download', 1, { outcome: 'success', topicId });
      recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { outcome: 'success', type: 'download_http' });
      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "X-Duration-Ms": durationMs.toString()
        },
      });
    }

    if (isLocalAbsolute) {
      const origin = new URL(req.url).origin;
      const response = await fetch(`${origin}${realPath}`);
      if (!response.ok) {
        recordCounter(METRICS.TUTOR.NOTES_VIEW + '.download', 1, { outcome: 'failure', reason: 'local_not_found' });
        return ApiResponse.error(notFound("Local file", realPath));
      }
      
      const blob = await response.blob();
      const durationMs = Date.now() - start;
      recordCounter(METRICS.TUTOR.NOTES_VIEW + '.download', 1, { outcome: 'success', topicId });
      recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { outcome: 'success', type: 'download_local' });
      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "X-Duration-Ms": durationMs.toString()
        },
      });
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.download', 1, { outcome: 'redirect', topicId });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { outcome: 'success', type: 'redirect' });
    
    const response = NextResponse.redirect(new URL(realPath, req.url));
    response.headers.set("X-Duration-Ms", durationMs.toString());
    return response;

  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.download', 1, { outcome: 'failure' });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'tutor', operation: 'download_notes' });
