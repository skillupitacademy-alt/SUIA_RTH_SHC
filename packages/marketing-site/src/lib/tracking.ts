import { getAnalyticsRuntimeConfig } from "../config/analytics";
import {
  identifyUser as identifyUserWithBrand,
  setUserProperties as setUserPropertiesWithBrand,
  trackConversion as trackConversionWithBrand,
  trackEvent as trackGovernedEvent,
  trackLead as trackLeadWithBrand,
  trackPageView as trackGovernedPageView,
  trackVideoProgress as trackGovernedVideoProgress,
} from "./analytics/tracker";
import type { AnalyticsBrandId } from "../config/analytics";
import type { AnalyticsEventName, AnalyticsEventPayload } from "./analytics/events";

export function resolveBrandId(): AnalyticsBrandId {
  if (typeof window === "undefined") {
    return "realtutorialhub";
  }

  const config = getAnalyticsRuntimeConfig({ hostname: window.location.hostname });
  return config.brand.brandId;
}

export function trackEvent<TEvent extends AnalyticsEventName>(name: TEvent, payload: AnalyticsEventPayload<TEvent>) {
  trackGovernedEvent(resolveBrandId(), name, payload);
}

export function trackLead(courseName: string, buttonLocation: string) {
  trackLeadWithBrand(resolveBrandId(), courseName, buttonLocation);
}

export function trackPageView(path: string) {
  trackGovernedPageView(resolveBrandId(), path, typeof document !== "undefined" ? document.title : undefined);
}

export function identifyUser(userId: string, traits?: Record<string, string | number | boolean | null | undefined>) {
  return identifyUserWithBrand(resolveBrandId(), userId, traits);
}

export function setUserProperties(properties: Record<string, string | number | boolean | null | undefined>) {
  return setUserPropertiesWithBrand(resolveBrandId(), properties);
}

export function trackConversion<
  TEvent extends Extract<AnalyticsEventName, "education.payment_completed" | "education.demo_session_booked">
>(name: TEvent, payload: AnalyticsEventPayload<TEvent>) {
  trackConversionWithBrand(resolveBrandId(), name, payload);
}

export function trackVideoProgress(percentage: 25 | 50 | 75, payload: Record<string, unknown>) {
  trackGovernedVideoProgress(resolveBrandId(), percentage, payload as never);
}
