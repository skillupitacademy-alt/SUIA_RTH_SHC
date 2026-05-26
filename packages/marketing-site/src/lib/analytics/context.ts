import type { AnalyticsBrandId } from "../../config/analytics";
import type { AnalyticsEventContext } from "./events";
import { ANALYTICS_SCHEMA_VERSION } from "./events";

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function getDeviceType(width?: number): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!width) {
    return "unknown";
  }

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function readUtm(searchParams: URLSearchParams) {
  return {
    source: searchParams.get("utm_source") ?? undefined,
    medium: searchParams.get("utm_medium") ?? undefined,
    campaign: searchParams.get("utm_campaign") ?? undefined,
    term: searchParams.get("utm_term") ?? undefined,
    content: searchParams.get("utm_content") ?? undefined,
  };
}

export function getOrCreateAnonymousId(storage?: Storage): string {
  const key = "quiz.analytics.anonymous_id";

  if (!storage) {
    return createId("anon");
  }

  const existing = storage.getItem(key);
  if (existing) {
    return existing;
  }

  const created = createId("anon");
  storage.setItem(key, created);
  return created;
}

export function getOrCreateSessionId(storage?: Storage): string {
  const key = "quiz.analytics.session_id";

  if (!storage) {
    return createId("sess");
  }

  const existing = storage.getItem(key);
  if (existing) {
    return existing;
  }

  const created = createId("sess");
  storage.setItem(key, created);
  return created;
}

export function buildBrowserAnalyticsContext(brandId: AnalyticsBrandId): AnalyticsEventContext {
  if (typeof window === "undefined") {
    return {
      brandId,
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      user: {
        anonymousId: createId("anon"),
        loggedInState: "anonymous",
      },
      session: {
        sessionId: createId("sess"),
        requestId: createId("req"),
        occurredAt: new Date().toISOString(),
      },
      metadata: {},
    };
  }

  const url = new URL(window.location.href);

  return {
    brandId,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    page: {
      url: url.toString(),
      path: url.pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      hostname: url.hostname,
    },
    attribution: readUtm(url.searchParams),
    device: {
      userAgent: window.navigator.userAgent,
      locale: window.navigator.language,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      type: getDeviceType(window.innerWidth),
    },
    user: {
      anonymousId: getOrCreateAnonymousId(window.localStorage),
      loggedInState: "anonymous",
    },
    session: {
      sessionId: getOrCreateSessionId(window.sessionStorage),
      requestId: createId("req"),
      occurredAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    metadata: {},
  };
}

