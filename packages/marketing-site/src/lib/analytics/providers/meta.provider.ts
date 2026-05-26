import type { AnalyticsRuntimeConfig } from "../../../config/analytics";
import type { AnalyticsProvider } from "./types";
import type { AnalyticsEventEnvelope } from "../events";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const standardEventMap: Partial<Record<string, string>> = {
  "education.course_viewed": "ViewContent",
  "education.course_enroll_clicked": "Lead",
  "education.checkout_started": "InitiateCheckout",
  "education.payment_completed": "Purchase",
  "education.whatsapp_lead_started": "Contact",
  "education.page_viewed": "PageView",
};

export class MetaProvider implements AnalyticsProvider {
  readonly id = "meta";

  constructor(private readonly config: AnalyticsRuntimeConfig) {}

  isAvailable(): boolean {
    return Boolean(this.config.brand.metaPixelId) && typeof window !== "undefined";
  }

  async track(event: AnalyticsEventEnvelope): Promise<void> {
    if (!this.isAvailable() || typeof window.fbq !== "function") {
      return;
    }

    const standardEvent = standardEventMap[event.name];
    const payload = {
      ...event.payload,
      brand_id: event.context.brandId,
      content_name: event.payload.courseName,
      content_category: event.payload.courseCategory,
      value: event.payload.value,
      currency: event.payload.currency,
    };

    if (standardEvent) {
      window.fbq("track", standardEvent, payload);
      return;
    }

    window.fbq("trackCustom", event.name, payload);
  }

  async trackPageView(): Promise<void> {
    if (!this.isAvailable() || typeof window.fbq !== "function") {
      return;
    }

    window.fbq("track", "PageView");
  }
}

