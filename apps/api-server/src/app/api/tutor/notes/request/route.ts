import { METRICS } from "@quiz/observability";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { AdaptiveTutorService } from "@/modules/adaptive-engine/adaptive-tutor.service";
import { TokenService } from "@/modules/auth/token.service";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const body = (await req.json().catch(() => ({}))) as { topicId?: unknown };
    const { topicId } = body as { topicId?: string };

    if (typeof topicId !== "string" || topicId.length === 0) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    const result = await AdaptiveTutorService.requestMasterNotes(payload.userId, topicId);

    if (!result) {
      recordCounter(METRICS.TUTOR.NOTES_VIEW + '.request', 1, { outcome: 'not_found' });
      return NextResponse.json({ 
        error: "Study notes for this topic are currently being prepared and are not yet available for dispatch." 
      }, { status: 404 });
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.request', 1, { outcome: 'success' });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { type: 'request' });

    return NextResponse.json({ success: true, message: "Master notes dispatched to your inbox." }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error({ err: error, route: "/api/tutor/notes/request" }, "[TutorNotes] Request failed");
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.request', 1, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withLogging(handler, { component: 'tutor', operation: 'request_notes' });
