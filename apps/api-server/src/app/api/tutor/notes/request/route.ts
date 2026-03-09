import { METRICS } from "@quiz/observability";
import { NextRequest } from "next/server";

import { badRequest, notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { AdaptiveTutorService } from "@/modules/adaptive-engine/adaptive-tutor.service";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

async function postHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized", "UNAUTHORIZED");
    }
    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required", "UNAUTHORIZED");
    }

    const rawBody = await req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest("Payload too deep or large"));
    }

    const body = sanitizeJsonField(rawBody) as { topicId?: string };
    const topicId = typeof body.topicId === "string" ? body.topicId : undefined;

    if (topicId === undefined || topicId.trim().length === 0) {
      return ApiResponse.error(badRequest("Topic ID is required"));
    }

    const result = await AdaptiveTutorService.requestMasterNotes(payload.userId, topicId);

    if (result === null || result === undefined) {
      recordCounter(METRICS.TUTOR.NOTES_VIEW + '.request', 1, { outcome: 'not_found' });
      return ApiResponse.error(notFound("Study notes", topicId));
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.request', 1, { outcome: 'success' });
    recordTimer(METRICS.TUTOR.NOTES_VIEW + '.duration', durationMs, { type: 'request' });

    return ApiResponse.success({ success: true, message: "Master notes dispatched to your inbox." }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    logger.error({ err: error, route: "/api/tutor/notes/request" }, "[TutorNotes] Request failed");
    recordCounter(METRICS.TUTOR.NOTES_VIEW + '.request', 1, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'tutor', operation: 'request_notes' });
