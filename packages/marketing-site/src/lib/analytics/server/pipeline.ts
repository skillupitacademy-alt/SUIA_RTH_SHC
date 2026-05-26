import { createHash } from "node:crypto";

import { getAnalyticsRuntimeConfig } from "../../../config/analytics";
import type { AnalyticsBrandId } from "../../../config/analytics";
import { evaluateAutomationRules } from "../automation";
import { processAttributionEvent } from "../attribution/attribution-engine";
import type { AnalyticsEventEnvelope } from "../events";
import { isAnalyticsEventName, normalizeAnalyticsEvent } from "../events";
import { evaluateFunnelProgress } from "../funnel";
import { upsertFeatures } from "../../ai-features/feature-store";
import { buildChurnFeatures } from "../../ai-features/churn-features";
import { buildRecommendationFeatures } from "../../ai-features/recommendation-features";
import { buildRetentionFeatures } from "../../ai-features/retention-features";
import { publishEvent } from "../../event-bus/publisher";
import { updateLeadScore } from "../lead-scoring";
import { addJourneyEvent, buildSankeyExport } from "../journey/journey-builder";
import { resolveIdentity } from "../identity/identity-resolver";
import {
  getAnalyticsHealthSnapshot,
  recordAnalyticsAccepted,
  recordAnalyticsDeduped,
  recordAnalyticsFailure,
} from "../observability";
import { endSession, updateSession } from "../session/session-manager";
import { auditPayload } from "../../data-quality/payload-auditor";
import { checkCompleteness } from "../../data-quality/completeness-checker";
import { detectSchemaDrift } from "../../data-quality/drift-detector";
import { validateWarehouseReadyEvent } from "../../data-quality/schema-validator";
import { buildWarehouseEventRow } from "../warehouse";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface DeadLetterEntry {
  event: AnalyticsEventEnvelope;
  reason: string;
  failedAt: string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const dedupeStore = new Map<string, number>();
const deadLetterQueue: DeadLetterEntry[] = [];
const analyticsQueue: AnalyticsEventEnvelope[] = [];

function createDedupeKey(event: AnalyticsEventEnvelope) {
  const hash = createHash("sha256");
  hash.update(event.name);
  hash.update(JSON.stringify(event.payload));
  hash.update(event.context.user.anonymousId);
  hash.update(event.context.session.sessionId);
  return hash.digest("hex");
}

function rateLimitKey(ip: string, brandId: AnalyticsBrandId) {
  return `${brandId}:${ip}`;
}

function enforceRateLimit(ip: string, brandId: AnalyticsBrandId) {
  const config = getAnalyticsRuntimeConfig({ brandId });
  const key = rateLimitKey(ip, brandId);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }

  if (current.count >= config.rateLimitPerMinute) {
    throw new Error("analytics_rate_limit_exceeded");
  }

  current.count += 1;
}

async function dispatchToGA4(event: AnalyticsEventEnvelope) {
  const config = getAnalyticsRuntimeConfig({ brandId: event.context.brandId });
  if (!config.brand.ga4MeasurementId || !config.brand.ga4MeasurementApiSecret) {
    return;
  }

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${config.brand.ga4MeasurementId}&api_secret=${config.brand.ga4MeasurementApiSecret}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: event.context.user.anonymousId,
        user_id: event.context.user.userId,
        timestamp_micros: Date.parse(event.context.session.occurredAt) * 1000,
        events: [
          {
            name: event.name,
            params: {
              ...event.payload,
              brand_id: event.context.brandId,
              session_id: event.context.session.sessionId,
              page_location: event.context.page?.url,
              page_path: event.context.page?.path,
              traffic_source: event.context.attribution?.source,
              traffic_medium: event.context.attribution?.medium,
              traffic_campaign: event.context.attribution?.campaign,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    },
  );
}

async function dispatchToMetaCapi(event: AnalyticsEventEnvelope) {
  const config = getAnalyticsRuntimeConfig({ brandId: event.context.brandId });
  if (!config.brand.metaPixelId || !config.brand.metaConversionApiToken) {
    return;
  }

  await fetch(`https://graph.facebook.com/v19.0/${config.brand.metaPixelId}/events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      access_token: config.brand.metaConversionApiToken,
      data: [
        {
          event_name: event.name,
          event_time: Math.floor(Date.parse(event.context.session.occurredAt) / 1000),
          action_source: "website",
          event_source_url: event.context.page?.url,
          event_id: createDedupeKey(event),
          user_data: {
            client_user_agent: event.context.device?.userAgent,
          },
          custom_data: {
            ...event.payload,
            brand_id: event.context.brandId,
          },
        },
      ],
    }),
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });
}

async function dispatchToInternalWarehouse(event: AnalyticsEventEnvelope) {
  const config = getAnalyticsRuntimeConfig({ brandId: event.context.brandId });
  const resolvedIdentity = resolveIdentity({
    anonymousId: event.context.user.anonymousId,
    sessionId: event.context.session.sessionId,
    userId: event.context.user.userId,
    email: typeof event.context.metadata.hashed_email === "string" ? event.context.metadata.hashed_email : undefined,
    phone: typeof event.context.metadata.hashed_phone === "string" ? event.context.metadata.hashed_phone : undefined,
    userAgent: event.context.device?.userAgent,
    locale: event.context.device?.locale,
    campaignId: event.context.attribution?.campaign,
  });
  const funnelProgress = evaluateFunnelProgress(event);
  const leadScore = updateLeadScore(event);
  const sessionSnapshot = updateSession({
    sessionId: event.context.session.sessionId,
    at: event.context.session.occurredAt,
    type:
      event.name === "education.payment_completed"
        ? "conversion"
        : event.name === "education.whatsapp_lead_started" || event.name === "education.demo_session_booked"
          ? "lead"
          : event.name.startsWith("education.video_progress_")
            ? "video"
            : event.name === "education.page_viewed"
              ? "page"
              : "click",
    path: event.context.page?.path,
  });
  const sessionClosure = event.name === "education.payment_completed" ? endSession(event.context.session.sessionId) : undefined;
  const warehouseRow = buildWarehouseEventRow(event, leadScore, funnelProgress);
  const automations = evaluateAutomationRules(event, leadScore);
  const attribution = processAttributionEvent({
    identityId: resolvedIdentity.node.id,
    source: event.context.attribution?.source,
    medium: event.context.attribution?.medium,
    campaign: event.context.attribution?.campaign,
    occurredAt: event.context.session.occurredAt,
    revenue: event.payload.value,
  });
  addJourneyEvent(resolvedIdentity.node.id, event);
  upsertFeatures(resolvedIdentity.node.id, {
    ...buildRetentionFeatures(sessionSnapshot),
    ...buildChurnFeatures(sessionSnapshot),
    ...buildRecommendationFeatures(leadScore),
  });

  console.info("[analytics:warehouse]", {
    stream: config.brand.internalWarehouseStream ?? "stdout",
    brandId: event.context.brandId,
    eventName: event.name,
    sessionId: event.context.session.sessionId,
    requestId: event.context.session.requestId,
    leadScore: leadScore.score,
    leadTemperature: leadScore.temperature,
    funnels: funnelProgress.map((item) => item.funnelId),
    automations: automations.map((item) => item.ruleId),
    journey: buildSankeyExport(resolvedIdentity.node.id),
    attribution,
    sessionSnapshot,
    sessionClosure,
    warehouseRow,
  });

  await publishEvent("analytics.validated", {
    eventName: event.name,
    brandId: event.context.brandId,
    identityId: resolvedIdentity.node.id,
    leadScore: leadScore.score,
    sessionQualityScore: sessionSnapshot.qualityScore,
  });

  if (automations.length > 0) {
    await publishEvent("automation.trigger", {
      brandId: event.context.brandId,
      identityId: resolvedIdentity.node.id,
      rules: automations.map((item) => item.ruleId),
    });
  }

  await publishEvent("ai.features", {
    identityId: resolvedIdentity.node.id,
    leadTemperature: leadScore.temperature,
    journeyLength: buildSankeyExport(resolvedIdentity.node.id).path.length,
  });
}

export function getAnalyticsDeadLetterQueue() {
  return [...deadLetterQueue];
}

export function getAnalyticsObservabilityState() {
  return {
    health: getAnalyticsHealthSnapshot(),
    deadLetterDepth: deadLetterQueue.length,
    queuedEvents: analyticsQueue.length,
  };
}

export async function enqueueAnalyticsEvent(event: AnalyticsEventEnvelope) {
  analyticsQueue.push(event);
  await processAnalyticsQueue();
}

async function processAnalyticsQueue() {
  while (analyticsQueue.length > 0) {
    const event = analyticsQueue.shift();
    if (!event) {
      return;
    }

    try {
      await Promise.all([
        dispatchToGA4(event),
        dispatchToMetaCapi(event),
        dispatchToInternalWarehouse(event),
      ]);
    } catch (error) {
      recordAnalyticsFailure("provider");
      deadLetterQueue.push({
        event,
        reason: error instanceof Error ? error.message : "unknown_dispatch_error",
        failedAt: new Date().toISOString(),
      });
      console.error("[analytics:dispatch_failed]", error);
    }
  }
}

export async function ingestAnalyticsEvent(input: {
  body: unknown;
  ipAddress: string;
  brandId: AnalyticsBrandId;
}) {
  enforceRateLimit(input.ipAddress, input.brandId);

  if (
    typeof input.body !== "object" ||
    input.body === null ||
    !("name" in input.body) ||
    typeof input.body.name !== "string" ||
    !isAnalyticsEventName(input.body.name)
  ) {
    throw new Error("invalid_analytics_event_name");
  }

  const event = normalizeAnalyticsEvent({
    ...(input.body as AnalyticsEventEnvelope),
    context: {
      ...(input.body as AnalyticsEventEnvelope).context,
      brandId: input.brandId,
    },
  });
  const warehouseValidation = validateWarehouseReadyEvent(event);
  const payloadAudit = auditPayload(event);
  const completeness = checkCompleteness(event);
  const schemaDrift = detectSchemaDrift(event.name, event.payload as Record<string, unknown>);

  if (!warehouseValidation.valid || payloadAudit.oversized) {
    recordAnalyticsFailure("validation");
    throw new Error("invalid_analytics_payload");
  }

  const dedupeKey = createDedupeKey(event);
  const config = getAnalyticsRuntimeConfig({ brandId: input.brandId });
  const previousSeenAt = dedupeStore.get(dedupeKey);
  const now = Date.now();

  if (previousSeenAt && now - previousSeenAt < config.dedupeWindowMs) {
    recordAnalyticsDeduped();
    return {
      accepted: true,
      deduped: true,
      eventId: dedupeKey,
    };
  }

  dedupeStore.set(dedupeKey, now);
  recordAnalyticsAccepted(event);
  await enqueueAnalyticsEvent(event);

  return {
    accepted: true,
    deduped: false,
    eventId: dedupeKey,
    quality: {
      warehouseValidation,
      payloadAudit,
      completeness,
      schemaDrift,
    },
  };
}
