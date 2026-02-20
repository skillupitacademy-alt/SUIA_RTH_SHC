import { db, notifications, topics, tutorHelpRequests, userRecommendations } from "@quiz/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

const HELP_REQUEST_COOLDOWN_HOURS = 12;

/**
 * POST /api/tutor/help/request
 * Allows a student to request live help for a specific topic.
 */
export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const body = await req.json();
    const topicId: string = typeof body?.topicId === "string" ? body.topicId.trim() : "";
    const priorityRaw: string = typeof body?.priority === "string" ? body.priority.trim() : "low";
    const allowedPriority = ["low", "medium", "high"] as const;
    const priority = allowedPriority.includes(priorityRaw as (typeof allowedPriority)[number])
      ? (priorityRaw as (typeof allowedPriority)[number])
      : "low";

    if (topicId.length === 0) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    // 1. Check if a request already exists/pending or was recently requested (Cooldown)
    const recentRequest = await db.query.tutorHelpRequests.findFirst({
      where: and(
        eq(tutorHelpRequests.userId, payload.userId),
        eq(tutorHelpRequests.topicId, topicId),
        sql`created_at > NOW() - INTERVAL '${sql.raw(HELP_REQUEST_COOLDOWN_HOURS.toString())} HOURS'`
      ),
      orderBy: desc(tutorHelpRequests.createdAt)
    });

    if (recentRequest) {
      if (recentRequest.status === "pending") {
        return NextResponse.json({ message: "Help request already pending for this topic" });
      } else {
        return NextResponse.json({ 
          error: "Cooldown active", 
          message: `You can only request live help once every ${HELP_REQUEST_COOLDOWN_HOURS} hours per topic.` 
        }, { status: 429 });
      }
    }

    // 2. Optional: Verify they have a recommendation for this topic (to prevent spam)
    const reco = await db.query.userRecommendations.findFirst({
      where: and(
        eq(userRecommendations.userId, payload.userId),
        eq(userRecommendations.topicId, topicId)
      ),
      columns: { metadata: true }
    });
    const accuracy =
      typeof (reco?.metadata as { accuracy?: unknown })?.accuracy === "number"
        ? (reco?.metadata as { accuracy?: number }).accuracy
        : undefined;

    // 3. Create help request
    await db.insert(tutorHelpRequests).values({
      userId: payload.userId,
      topicId,
      status: "pending",
      priority: typeof accuracy === "number" && accuracy < 50 ? "high" : priority,
    });

    // 4. Send notification to student
    const topic = await db.query.topics.findFirst({
        where: eq(topics.id, topicId),
        columns: { name: true }
    });
    const topicName = typeof topic?.name === "string" && topic.name.length > 0 ? topic.name : "this topic";

    await db.insert(notifications).values({
      userId: payload.userId,
      type: "help_requested",
      title: "Help Request Logged",
      message: `We've received your request for help with ${topicName}. A tutor will review your progress soon.`,
    });

    return NextResponse.json({ success: true, message: "Help request submitted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
