import { db, notifications, topics, tutorHelpRequests, userRecommendations } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, desc, eq, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

const HELP_REQUEST_COOLDOWN_HOURS = 12;

async function postHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await TokenService.verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required");
    }

    const rawBody = await req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      throw badRequest("Payload too deep or large");
    }

    const body = sanitizeJsonField(rawBody) as { topicId?: string; priority?: string };
    const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";
    const priorityRaw = typeof body.priority === "string" ? body.priority.trim() : "low";
    const allowedPriority = ["low", "medium", "high"] as const;
    const priority = allowedPriority.includes(priorityRaw as (typeof allowedPriority)[number])
      ? (priorityRaw as (typeof allowedPriority)[number])
      : "low";

    if (topicId.length === 0) {
      throw badRequest("topicId is required");
    }

    const recentRequest = await db.query.tutorHelpRequests.findFirst({
      where: and(
        eq(tutorHelpRequests.userId, payload.userId),
        eq(tutorHelpRequests.topicId, topicId),
        sql`created_at > NOW() - INTERVAL '${sql.raw(HELP_REQUEST_COOLDOWN_HOURS.toString())} HOURS'`
      ),
      orderBy: desc(tutorHelpRequests.createdAt)
    });

    if (recentRequest !== null && recentRequest !== undefined) {
      if (recentRequest.status === "pending") {
        return ApiResponse.success({ message: "Help request already pending for this topic" });
      } else {
        return ApiResponse.error(new Error(`You can only request live help once every ${HELP_REQUEST_COOLDOWN_HOURS} hours per topic.`), 429);
      }
    }

    const reco = await db.query.userRecommendations.findFirst({
      where: and(
        eq(userRecommendations.userId, payload.userId),
        eq(userRecommendations.topicId, topicId)
      ),
      columns: { metadata: true }
    });
    
    type RecommendationMetadata = { accuracy?: number };
    const recoMetadata = reco?.metadata as RecommendationMetadata | undefined;
    const accuracy =
      typeof recoMetadata?.accuracy === "number"
        ? recoMetadata.accuracy
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

    return ApiResponse.success({ success: true, message: "Help request submitted successfully" }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    recordCounter(METRICS.TUTOR.HELP_REQUEST, 1, { outcome: 'failure' });
    recordTimer(METRICS.TUTOR.HELP_REQUEST + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'tutor', operation: 'request_help' });
