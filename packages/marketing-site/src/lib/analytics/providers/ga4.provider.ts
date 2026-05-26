import type { AnalyticsRuntimeConfig } from "../../../config/analytics";
import type { AnalyticsProvider } from "./types";
import type { AnalyticsEventEnvelope } from "../events";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export class GA4Provider implements AnalyticsProvider {
  readonly id = "ga4";

  constructor(private readonly config: AnalyticsRuntimeConfig) {}

  isAvailable(): boolean {
    return Boolean(this.config.brand.ga4MeasurementId) && typeof window !== "undefined";
  }

  async track(event: AnalyticsEventEnvelope): Promise<void> {
    if (!this.isAvailable() || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", event.name, {
      ...event.payload,
      brand_id: event.context.brandId,
      page_path: event.context.page?.path,
      page_location: event.context.page?.url,
      page_title: event.context.page?.title,
      session_id: event.context.session.sessionId,
      schema_version: event.context.schemaVersion,
    });
  }

  async identifyUser(input: { userId: string }): Promise<void> {
    if (!this.isAvailable() || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("config", this.config.brand.ga4MeasurementId, {
      user_id: input.userId,
    });
  }

  async setUserProperties(properties: Record<string, string | number | boolean | null | undefined>): Promise<void> {
    if (!this.isAvailable() || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("set", "user_properties", properties);
  }

  async trackPageView(input: { path: string; title?: string; location?: string }): Promise<void> {
    if (!this.isAvailable() || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "page_view", {
      page_path: input.path,
      page_title: input.title,
      page_location: input.location,
    });
  }
}

