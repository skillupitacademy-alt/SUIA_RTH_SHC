import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { withLogging } from "@/lib/withLogging";
import { AdaptiveExamService } from "@/modules/adaptive-engine/adaptive-exam.service";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

/**
 * Endpoint to start a fully personalized adaptive exam session.
 * Flow: Auth -> Analytics -> Blueprint -> Selection -> Session -> Result
 */
async function postHandler(req: NextRequest) {
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required");
    }
    const userId = payload.userId;

    const result = await AdaptiveExamService.startAdaptiveExam(userId);

    return ApiResponse.success(result, 201);
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withCorrelationId(withLogging(postHandler, { component: 'exam', operation: 'start_adaptive_exam' }));
