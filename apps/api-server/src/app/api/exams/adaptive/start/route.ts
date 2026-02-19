import { type NextRequest, NextResponse } from "next/server";

import { AdaptiveExamService } from "@/modules/adaptive-engine/adaptive-exam.service";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

/**
 * Endpoint to start a fully personalized adaptive exam session.
 * Flow: Auth -> Analytics -> Blueprint -> Selection -> Session -> Result
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Identity Verification
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    // 2. Orchestrate Exam Start
    const result = await AdaptiveExamService.startAdaptiveExam(userId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Adaptive Exam API Error]:", error);
    
    return NextResponse.json(
      { error: "Failed to generate adaptive exam", message },
      { status: 500 }
    );
  }
}
