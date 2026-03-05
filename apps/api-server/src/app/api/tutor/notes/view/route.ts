import { db, notesAccessLogs, topics, userRecommendations } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';
import { TutorSecurityService } from "@/modules/tutor/tutor.security";

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized", "UNAUTHORIZED");
    }
    const payload = await container.get(TokenService).verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required", "UNAUTHORIZED");
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId")?.trim() ?? "";

    if (topicId.length === 0) {
      return ApiResponse.error(badRequest("topicId is required"));
    }

    const recommendation = await db.query.userRecommendations.findFirst({
      where: and(
        eq(userRecommendations.userId, payload.userId),
        eq(userRecommendations.topicId, topicId)
      ),
    });

    if (recommendation === null || recommendation === undefined) {
      return ApiResponse.error(forbidden("No recommendation found for this topic"));
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
      return ApiResponse.error(notFound("Notes", topicId));
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

    return ApiResponse.success({ url: signedUrl }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    recordCounter(METRICS.TUTOR.NOTES_VIEW, 1, { outcome: 'failure' });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'tutor', operation: 'view_notes' });
