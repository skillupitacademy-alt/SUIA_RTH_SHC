import { db, topics } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TutorSecurityService } from "@/modules/tutor/tutor.security";

export const dynamic = "force-dynamic";

/**
 * GET /api/tutor/notes/download?topicId=...&expires=...&signature=...
 * Serves the actual notes file with proper Content-Disposition headers.
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

    // 2. Fetch the real path & metadata
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
    
    const realPathRaw = notesAssetId ?? detailedNotesPath;
    const realPath = typeof realPathRaw === "string" ? realPathRaw : "";
    if (realPath.length === 0) {
      return new Response("File Not Found", { status: 404 });
    }

    const topicName =
      typeof topic?.name === "string" && topic.name.length > 0 ? topic.name : "topic-notes";
    const safeFilename = `${topicName}.pdf`.replace(/[^a-z0-9.-]/gi, "_");

    const isHttp = realPath.length > 0 && realPath.startsWith("http");
    const isLocalAbsolute = realPath.length > 0 && realPath.startsWith("/");

    // 3. Resolve and Stream Content (Best for security + Content-Disposition control)
    if (isHttp) {
      const response = await fetch(realPath);
      if (!response.ok) return new Response("Failed to fetch asset", { status: 502 });
      
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
        },
      });
    }

    // If it's a local public path (starts with /), we can also try to fetch it or redirect
    // But since we want Content-Disposition, a proxy-fetch is safer.
    if (isLocalAbsolute) {
      const origin = new URL(req.url).origin;
      const response = await fetch(`${origin}${realPath}`);
      if (!response.ok) return new Response("Local file not found", { status: 404 });
      
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
        },
      });
    }

    // Fallback: If it's a raw asset ID or relative path, we try to redirect as a last resort
    // although this won't have the filename header.
    return NextResponse.redirect(new URL(realPath, req.url));

  } catch (_error: unknown) {
    console.error("[NotesDownload] Server Error", _error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
