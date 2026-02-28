import { db, topics } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TutorSecurityService } from "@/modules/tutor/tutor.security";

export const dynamic = "force-dynamic";

/**
 * GET /api/tutor/notes/download?topicId=...&expires=...&signature=...
 * Serves the actual notes file with proper Content-Disposition headers.
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId")?.trim() ?? "";
    const expires = searchParams.get("expires")?.trim() ?? "";
    const signature = searchParams.get("signature")?.trim() ?? "";

    if (topicId.length === 0 || expires.length === 0 || signature.length === 0) {
      return new Response("Unauthorized: Missing security parameters", { status: 401 });
    }

    const isValid = TutorSecurityService.verifySignature(topicId, expires, signature);
    if (!isValid) {
      return new Response("Unauthorized: Invalid or expired link", { status: 403 });
    }

    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
      columns: { notesAssetId: true, detailedNotesPath: true, name: true },
    });

    const notesAssetId =
      typeof topic?.notesAssetId === "string" && topic.notesAssetId.length > 0 ? topic.notesAssetId : null;
    const detailedNotesPath =
      typeof topic?.detailedNotesPath === "string" && topic.detailedNotesPath.length > 0
        ? topic.detailedNotesPath
        : null;
    
    const realPathRaw = notesAssetId ?? detailedNotesPath;
    const realPath = typeof realPathRaw === "string" ? realPathRaw : "";
    if (realPath.length === 0) {
      return new Response("File Not Found", { status: 404 });
    }

    const topicName =
      typeof topic?.name === "string" && topic.name.length > 0 ? topic.name : "topic-notes";
    const safeFilename = `${topicName}.pdf`.replace(/[^a-z0-9.-]/gi, "_");

    const isHttp = realPath.length > 0 && realPath.startsWith("http");
    const isLocalAbsolute = realPath.length > 0 && realPath.startsWith("/");

    if (isHttp) {
      const response = await fetch(realPath);
      if (!response.ok) {
        return new Response("Failed to fetch asset", { status: 502 });
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
        return new Response("Local file not found", { status: 404 });
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
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.download', 1, { outcome: 'failure' });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { outcome: 'failure' });
    return new Response(message, { 
        status: 500,
        headers: { "X-Duration-Ms": durationMs.toString() }
    });
  }
}

export const GET = withLogging(handler, { component: 'tutor', operation: 'download_notes' });
