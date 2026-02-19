import { NextRequest, NextResponse } from "next/server";

import { AdaptiveTutorService } from "@/modules/adaptive-engine/adaptive-tutor.service";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/topics/[id]/request-notes
 * Triggers the dispatch of master notes to the student's email and internal inbox.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params;

    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const success = await AdaptiveTutorService.requestMasterNotes(payload.userId, topicId);

    if (!success) {
      return NextResponse.json({ 
        error: "Master notes not available for this topic yet." 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Notes dispatched successfully. Please check your Inbox and Email." 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to dispatch notes";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
