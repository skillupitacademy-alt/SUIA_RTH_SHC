import { type NextRequest, NextResponse } from "next/server";

import { withLogging } from "@/lib/withLogging";
import { AdaptiveExamService } from "@/modules/adaptive-engine/adaptive-exam.service";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

/**
 * Endpoint to start a fully personalized adaptive exam session.
 * Flow: Auth -> Analytics -> Blueprint -> Selection -> Session -> Result
 */
async function handler(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const result = await AdaptiveExamService.startAdaptiveExam(userId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    
    return NextResponse.json(
      { error: "Failed to generate adaptive exam", message },
      { status: 500 }
    );
  }
}

export const POST = withLogging(handler, { component: 'exam', operation: 'start_adaptive_exam' });
