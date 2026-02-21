import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/modules/auth/token.service";
import { AdaptiveTutorService } from "@/modules/adaptive-engine/adaptive-tutor.service";

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const body = await req.json();
    const { topicId } = body;

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    const result = await AdaptiveTutorService.requestMasterNotes(payload.userId, topicId);

    if (!result) {
      return NextResponse.json({ 
        error: "Study notes for this topic are currently being prepared and are not yet available for dispatch." 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Master notes dispatched to your inbox." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
