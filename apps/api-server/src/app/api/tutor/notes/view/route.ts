import { db, notesAccessLogs, topics, userRecommendations } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { TutorSecurityService } from "@/modules/tutor/tutor.security";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId")?.trim() ?? "";

    if (topicId.length === 0) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    const recommendation = await db.query.userRecommendations.findFirst({
      where: and(
        eq(userRecommendations.userId, payload.userId),
        eq(userRecommendations.topicId, topicId)
      ),
    });

    if (!recommendation) {
      return NextResponse.json({ error: "No recommendation found for this topic" }, { status: 403 });
    }

    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
      columns: { detailedNotesPath: true, notesAssetId: true },
    });

    const notesAssetId =
      typeof topic?.notesAssetId === "string" && topic.notesAssetId.length > 0 ? topic.notesAssetId : null;
    const detailedNotesPath =
      typeof topic?.detailedNotesPath === "string" && topic.detailedNotesPath.length > 0
        ? topic.detailedNotesPath
        : null;
    const notesPath = notesAssetId ?? detailedNotesPath;

    if (notesPath === null || notesPath.length === 0) {
      return NextResponse.json({ error: "Notes not available for this topic" }, { status: 404 });
    }

    await db.insert(notesAccessLogs).values({
      userId: payload.userId,
      topicId: topicId,
      deliveredVia: "web_viewer",
    });

    const expires = Math.floor(Date.now() / 1000) + 3600;
    const signatureParams = TutorSecurityService.signNotesUrl(topicId, expires);
    const signedUrl = `/api/tutor/notes/download?topicId=${topicId}&${signatureParams}`;

    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.NOTES_VIEW, 1, { outcome: 'success', topicId });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { outcome: 'success' });

    return NextResponse.json({ url: signedUrl }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.TUTOR.NOTES_VIEW, 1, { outcome: 'failure' });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', Date.now() - start, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'tutor', operation: 'view_notes' });
