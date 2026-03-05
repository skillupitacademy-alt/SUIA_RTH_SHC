import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { AdaptiveTutorService } from "@/modules/adaptive-engine/adaptive-tutor.service";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

/**
 * POST /api/topics/[id]/request-notes
 * Triggers the dispatch of master notes to the student's email and internal inbox.
 */
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  try {
    const { id: topicId } = await params;

    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await container.get(TokenService).verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Unauthorized");
    }

    const success = await AdaptiveTutorService.requestMasterNotes(payload.userId, topicId);

    if (success !== true) {
      throw notFound("Master notes", topicId);
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.HELP_REQUEST + '.success', 1, { type: 'notes' });
    recordTimer(METRICS.TUTOR.HELP_REQUEST + '.duration', durationMs, { type: 'notes' });
    
    return ApiResponse.success({ 
      success: true,
      message: "Notes dispatched successfully. Please check your Inbox and Email." 
    }, 200, {
      "X-Duration-Ms": durationMs.toString()
    });
  } catch (err: unknown) {
    recordCounter(METRICS.TUTOR.HELP_REQUEST + '.failure', 1, { type: 'notes', reason: 'error' });
    return ApiResponse.error(err);
  }
}

export const POST = withLogging(postHandler, { component: 'tutor', operation: 'request_notes' });
