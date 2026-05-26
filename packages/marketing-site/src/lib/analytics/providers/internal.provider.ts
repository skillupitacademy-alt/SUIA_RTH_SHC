import type { AnalyticsRuntimeConfig } from "../../../config/analytics";
import type { AnalyticsProvider } from "./types";
import type { AnalyticsEventEnvelope } from "../events";

export class InternalAnalyticsProvider implements AnalyticsProvider {
  readonly id = "internal";

  constructor(private readonly config: AnalyticsRuntimeConfig) {}

  isAvailable(): boolean {
    return this.config.enabled && Boolean(this.config.brand.internalCollectionEndpoint);
  }

  async track(event: AnalyticsEventEnvelope): Promise<void> {
    if (typeof fetch === "undefined" || !this.config.brand.internalCollectionEndpoint) {
      return;
    }

    await fetch(this.config.brand.internalCollectionEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-analytics-brand": this.config.brand.brandId,
      },
      body: JSON.stringify(event),
      keepalive: true,
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    });
  }
}
