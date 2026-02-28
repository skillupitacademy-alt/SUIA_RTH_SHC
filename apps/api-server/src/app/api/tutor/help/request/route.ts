import { db, notifications, topics, tutorHelpRequests, userRecommendations } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

const HELP_REQUEST_COOLDOWN_HOURS = 12;

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const body = (await req.json().catch(() => ({}))) as { topicId?: unknown; priority?: unknown };
    const topicId: string = typeof body?.topicId === "string" ? body.topicId.trim() : "";
    const priorityRaw: string = typeof body?.priority === "string" ? body.priority.trim() : "low";
    const allowedPriority = ["low", "medium", "high"] as const;
    const priority = allowedPriority.includes(priorityRaw as (typeof allowedPriority)[number])
      ? (priorityRaw as (typeof allowedPriority)[number])
      : "low";

    if (topicId.length === 0) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

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

    await db.insert(tutorHelpRequests).values({
      userId: payload.userId,
      topicId,
      status: "pending",
      priority: typeof accuracy === "number" && accuracy < 50 ? "high" : priority,
    });

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

    const durationMs = Date.now() - start;
    recordCounter(METRICS.TUTOR.HELP_REQUEST, 1, { outcome: 'success', topicId });
    recordTimer(METRICS.TUTOR.HELP_REQUEST + '.duration', durationMs, { outcome: 'success' });

    return NextResponse.json({ success: true, message: "Help request submitted successfully" }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.TUTOR.HELP_REQUEST, 1, { outcome: 'failure' });
    recordTimer(METRICS.TUTOR.HELP_REQUEST + '.duration', Date.now() - start, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withLogging(handler, { component: 'tutor', operation: 'request_help' });
