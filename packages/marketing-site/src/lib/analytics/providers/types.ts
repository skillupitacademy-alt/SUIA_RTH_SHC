import type { AnalyticsRuntimeConfig } from "../../../config/analytics";
import type {
  AnalyticsEventEnvelope,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "../events";

export interface AnalyticsProvider {
  readonly id: string;
  isAvailable(): boolean;
  load?(): Promise<void>;
  track<TEvent extends AnalyticsEventName>(event: AnalyticsEventEnvelope<TEvent>): Promise<void>;
  identifyUser?(input: {
    userId: string;
    traits?: Record<string, string | number | boolean | null | undefined>;
  }): Promise<void>;
  setUserProperties?(properties: Record<string, string | number | boolean | null | undefined>): Promise<void>;
  trackPageView?(input: {
    path: string;
    title?: string;
    location?: string;
  }): Promise<void>;
}

export interface AnalyticsTrackerOptions {
  config: AnalyticsRuntimeConfig;
  providers: AnalyticsProvider[];
  debug?: boolean;
  onError?: (error: unknown, event?: AnalyticsEventEnvelope) => void;
  onDispatch?: (event: AnalyticsEventEnvelope, providerId: string) => void;
}

export interface TrackEventInput<TEvent extends AnalyticsEventName> {
  name: TEvent;
  payload: AnalyticsEventPayload<TEvent>;
}

