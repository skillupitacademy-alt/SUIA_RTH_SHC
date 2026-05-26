import { getAnalyticsRuntimeConfig } from "../../config/analytics";
import type { AnalyticsBrandId } from "../../config/analytics";
import { buildBrowserAnalyticsContext } from "./context";
import { enrichAnalyticsEvent } from "./enrichment";
import type { AnalyticsEventContext, AnalyticsEventEnvelope, AnalyticsEventName, AnalyticsEventPayload } from "./events";
import { resolveIdentity } from "./identity/identity-resolver";
import { normalizeAnalyticsEvent } from "./events";
import { updateSession } from "./session/session-manager";
import { GA4Provider } from "./providers/ga4.provider";
import { GTMProvider } from "./providers/gtm.provider";
import { InternalAnalyticsProvider } from "./providers/internal.provider";
import { MetaProvider } from "./providers/meta.provider";
import type { AnalyticsProvider, AnalyticsTrackerOptions } from "./providers/types";
import { canDispatchProvider } from "../privacy/consent-manager";
import { analyticsLogger } from "../observability/logger";
import { incrementMetric } from "../observability/metrics";
import { recordProviderHealth } from "../observability/provider-health";
import { recordEventHealth } from "../observability/event-health";
import { startSpan, endSpan } from "../observability/tracing";

function createDedupeKey(event: AnalyticsEventEnvelope) {
  return `${event.name}:${event.context.session.sessionId}:${JSON.stringify(event.payload)}`;
}

class AnalyticsTracker {
  private readonly queue: AnalyticsEventEnvelope[] = [];
  private readonly dedupeCache = new Map<string, number>();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;
  private isFlushing = false;

  constructor(private readonly options: AnalyticsTrackerOptions) {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        void this.flush();
      });
    }
  }

  trackEvent<TEvent extends AnalyticsEventName>(
    name: TEvent,
    payload: AnalyticsEventPayload<TEvent>,
    partialContext?: Partial<AnalyticsEventContext>,
  ) {
    const baseContext = buildBrowserAnalyticsContext(this.options.config.brand.brandId);
    const resolvedIdentity = resolveIdentity({
      anonymousId: baseContext.user.anonymousId,
      sessionId: baseContext.session.sessionId,
      userAgent: baseContext.device?.userAgent,
      locale: baseContext.device?.locale,
      campaignId: baseContext.attribution?.campaign,
    });
    const sessionSnapshot = updateSession({
      sessionId: baseContext.session.sessionId,
      at: baseContext.session.occurredAt,
      type:
        name === "education.payment_completed"
          ? "conversion"
          : name === "education.whatsapp_lead_started" || name === "education.demo_session_booked"
            ? "lead"
            : name.startsWith("education.video_progress_")
              ? "video"
              : name === "education.page_viewed"
                ? "page"
                : "click",
      path: baseContext.page?.path,
    });
    const enriched = enrichAnalyticsEvent({
      name,
      payload,
      context: {
        ...baseContext,
        ...partialContext,
        user: {
          ...baseContext.user,
          ...partialContext?.user,
        },
        session: {
          ...baseContext.session,
          ...partialContext?.session,
        },
        metadata: {
          ...baseContext.metadata,
          identity_id: resolvedIdentity.node.id,
          identity_confidence: resolvedIdentity.node.confidence,
          identity_match_type: resolvedIdentity.matchType,
          session_quality_score: sessionSnapshot.qualityScore,
          session_quality_classification: sessionSnapshot.qualityClassification,
          ...partialContext?.metadata,
        },
      },
    });
    const event = normalizeAnalyticsEvent(enriched);

    const dedupeKey = createDedupeKey(event);
    const now = Date.now();
    const previousSeenAt = this.dedupeCache.get(dedupeKey);
    if (previousSeenAt && now - previousSeenAt < this.options.config.dedupeWindowMs) {
      incrementMetric("analytics.events.deduped");
      return;
    }

    this.dedupeCache.set(dedupeKey, now);
    this.queue.push(event);
    recordEventHealth(event.name);
    incrementMetric("analytics.events.accepted");
    this.scheduleFlush();
  }

  identifyUser(userId: string, traits?: Record<string, string | number | boolean | null | undefined>) {
    return Promise.all(
      this.options.providers
        .filter((provider) => provider.isAvailable() && provider.identifyUser)
        .map((provider) => provider.identifyUser!({ userId, traits })),
    );
  }

  setUserProperties(properties: Record<string, string | number | boolean | null | undefined>) {
    return Promise.all(
      this.options.providers
        .filter((provider) => provider.isAvailable() && provider.setUserProperties)
        .map((provider) => provider.setUserProperties!(properties)),
    );
  }

  trackPageView(path: string, title?: string) {
    const location = typeof window !== "undefined" ? window.location.href : undefined;

    return Promise.all(
      this.options.providers
        .filter((provider) => provider.isAvailable() && provider.trackPageView)
        .map((provider) => provider.trackPageView!({ path, title, location })),
    );
  }

  async flush() {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.options.config.batchSize);

    try {
      for (const event of batch) {
        await Promise.all(
          this.options.providers
            .filter((provider) => provider.isAvailable() && canDispatchProvider(provider.id))
            .map(async (provider) => {
              const span = startSpan("analytics.provider.dispatch", {
                provider_id: provider.id,
                event_name: event.name,
              });
              const startedAt = Date.now();
              try {
                await provider.track(event);
                recordProviderHealth(provider.id, Date.now() - startedAt, false);
                this.options.onDispatch?.(event, provider.id);
                analyticsLogger("info", "analytics_provider_dispatch", {
                  providerId: provider.id,
                  eventName: event.name,
                });
              } catch (error) {
                incrementMetric("analytics.provider.failures");
                recordProviderHealth(provider.id, Date.now() - startedAt, true);
                this.options.onError?.(error, event);
              } finally {
                endSpan(span);
              }
            }),
        );
      }
    } finally {
      this.isFlushing = false;

      if (this.queue.length > 0) {
        this.scheduleFlush();
      }
    }
  }

  private scheduleFlush() {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      void this.flush();
    }, this.options.config.flushIntervalMs);
  }
}

let trackerSingleton: AnalyticsTracker | undefined;

export function createAnalyticsTracker(brandId: AnalyticsBrandId, providers?: AnalyticsProvider[]) {
  const config = getAnalyticsRuntimeConfig({ brandId });

  return new AnalyticsTracker({
    config,
    providers:
      providers ??
      [
        new GTMProvider(config),
        new GA4Provider(config),
        new MetaProvider(config),
        new InternalAnalyticsProvider(config),
      ],
    debug: config.debug,
    onError: (error, event) => {
      if (config.debug) {
        console.error("[analytics:error]", error, event);
      }
    },
    onDispatch: (event, providerId) => {
      if (config.debug) {
        console.debug("[analytics:dispatch]", providerId, event.name, event.payload);
      }
    },
  });
}

export function getAnalyticsTracker(brandId: AnalyticsBrandId) {
  trackerSingleton ??= createAnalyticsTracker(brandId);
  return trackerSingleton;
}

export function trackEvent<TEvent extends AnalyticsEventName>(
  brandId: AnalyticsBrandId,
  name: TEvent,
  payload: AnalyticsEventPayload<TEvent>,
  context?: Partial<AnalyticsEventContext>,
) {
  getAnalyticsTracker(brandId).trackEvent(name, payload, context);
}

export function trackPageView(brandId: AnalyticsBrandId, path: string, title?: string) {
  void getAnalyticsTracker(brandId).trackPageView(path, title);
  trackEvent(brandId, "education.page_viewed", {}, {
    page:
      typeof window !== "undefined"
        ? {
            url: window.location.href,
            path,
            title,
            referrer: document.referrer || undefined,
            hostname: window.location.hostname,
          }
        : undefined,
  });
}

export function identifyUser(
  brandId: AnalyticsBrandId,
  userId: string,
  traits?: Record<string, string | number | boolean | null | undefined>,
) {
  return getAnalyticsTracker(brandId).identifyUser(userId, traits);
}

export function setUserProperties(
  brandId: AnalyticsBrandId,
  properties: Record<string, string | number | boolean | null | undefined>,
) {
  return getAnalyticsTracker(brandId).setUserProperties(properties);
}

export function trackConversion<TEvent extends Extract<AnalyticsEventName, "education.payment_completed" | "education.demo_session_booked">>(
  brandId: AnalyticsBrandId,
  name: TEvent,
  payload: AnalyticsEventPayload<TEvent>,
) {
  trackEvent(brandId, name, payload);
}

export function trackVideoProgress(
  brandId: AnalyticsBrandId,
  progress: 25 | 50 | 75,
  payload:
    | AnalyticsEventPayload<"education.video_progress_25">
    | AnalyticsEventPayload<"education.video_progress_50">
    | AnalyticsEventPayload<"education.video_progress_75">,
) {
  if (progress === 25) {
    trackEvent(brandId, "education.video_progress_25", payload as AnalyticsEventPayload<"education.video_progress_25">);
    return;
  }

  if (progress === 50) {
    trackEvent(brandId, "education.video_progress_50", payload as AnalyticsEventPayload<"education.video_progress_50">);
    return;
  }

  trackEvent(brandId, "education.video_progress_75", payload as AnalyticsEventPayload<"education.video_progress_75">);
}

export function trackLead(brandId: AnalyticsBrandId, courseName: string, buttonLocation: string) {
  trackEvent(brandId, "education.whatsapp_lead_started", {
    courseName,
    buttonLocation,
    leadChannel: "whatsapp",
    currency: "INR",
  });
}
