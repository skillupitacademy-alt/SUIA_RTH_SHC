import type { AnalyticsRuntimeConfig } from "../../../config/analytics";
import type { AnalyticsProvider } from "./types";
import type { AnalyticsEventEnvelope } from "../events";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export class GTMProvider implements AnalyticsProvider {
  readonly id = "gtm";

  constructor(private readonly config: AnalyticsRuntimeConfig) {}

  isAvailable(): boolean {
    return Boolean(this.config.brand.gtmContainerId) && typeof window !== "undefined";
  }

  async track(event: AnalyticsEventEnvelope): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: event.name,
      analytics_schema_version: event.context.schemaVersion,
      brand_id: event.context.brandId,
      session_id: event.context.session.sessionId,
      page_path: event.context.page?.path,
      ...event.payload,
      ...event.context.metadata,
    });
  }

  async trackPageView(input: { path: string; title?: string; location?: string }): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: "education.page_viewed",
      page_path: input.path,
      page_title: input.title,
      page_location: input.location,
    });
  }
}
