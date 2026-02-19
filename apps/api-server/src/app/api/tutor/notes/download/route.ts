import { db, topics } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TutorSecurityService } from "@/modules/tutor/tutor.security";

export const dynamic = "force-dynamic";

/**
 * GET /api/tutor/notes/download?topicId=...&expires=...&signature=...
 * Serves the actual notes file after verifying the signature.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId")?.trim() ?? "";
    const expires = searchParams.get("expires")?.trim() ?? "";
    const signature = searchParams.get("signature")?.trim() ?? "";

    if (topicId.length === 0 || expires.length === 0 || signature.length === 0) {
      return new Response("Unauthorized: Missing security parameters", { status: 401 });
    }

    // 1. Verify cryptographic signature
    const isValid = TutorSecurityService.verifySignature(topicId, expires, signature);
    if (!isValid) {
      return new Response("Unauthorized: Invalid or expired link", { status: 403 });
    }

    // 2. Fetch the real path
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
      columns: { notesAssetId: true, detailedNotesPath: true, name: true },
    });

    const notesAssetId =
      typeof topic?.notesAssetId === "string" && topic.notesAssetId.length > 0 ? topic.notesAssetId : null;
    const detailedNotesPath =
      typeof topic?.detailedNotesPath === "string" && topic.detailedNotesPath.length > 0
        ? topic.detailedNotesPath
        : null;
    const realPath = notesAssetId ?? detailedNotesPath;
    if (realPath === null || realPath.length === 0) {
      return new Response("File Not Found", { status: 404 });
    }

    // 3. If it's a remote URL, we can redirect or proxy. 
    // For now, let's assume we redirect to the real one (not ideal for absolute security, 
    // but works for "expiring entry points").
    // Better: If it's indexed content, we could fetch and stream it.
    
    // For this implementation, we'll redirect to the secure asset.
    return NextResponse.redirect(new URL(realPath, req.url));

  } catch (_error: unknown) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
