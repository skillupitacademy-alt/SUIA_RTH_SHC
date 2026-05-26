import type { MarketingBrand } from "../brand";

export type AnalyticsBrandId = MarketingBrand["id"];
export type AnalyticsEnvironment = "development" | "staging" | "production" | "test";

export interface BrandAnalyticsConfig {
  brandId: AnalyticsBrandId;
  hostnamePatterns: string[];
  ga4MeasurementId?: string;
  ga4MeasurementApiSecret?: string;
  metaPixelId?: string;
  metaConversionApiToken?: string;
  gtmContainerId?: string;
  linkedInPartnerId?: string;
  hotjarSiteId?: string;
  internalCollectionEndpoint?: string;
  internalWarehouseStream?: string;
}

export interface AnalyticsRuntimeConfig {
  appName: string;
  environment: AnalyticsEnvironment;
  debug: boolean;
  enabled: boolean;
  requestTimeoutMs: number;
  dedupeWindowMs: number;
  flushIntervalMs: number;
  batchSize: number;
  rateLimitPerMinute: number;
  brand: BrandAnalyticsConfig;
}

function getEnvironment(): AnalyticsEnvironment {
  const value = process.env.NEXT_PUBLIC_ANALYTICS_ENV ?? process.env.NODE_ENV ?? "development";
  if (value === "production" || value === "staging" || value === "test" || value === "development") {
    return value;
  }

  return "development";
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const brandConfigs: Record<AnalyticsBrandId, BrandAnalyticsConfig> = {
  realtutorialhub: {
    brandId: "realtutorialhub",
    hostnamePatterns: ["realtutorialhub.com", "www.realtutorialhub.com", "localhost"],
    ga4MeasurementId: process.env.NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID,
    ga4MeasurementApiSecret: process.env.RTH_GA4_MEASUREMENT_API_SECRET,
    metaPixelId: process.env.NEXT_PUBLIC_RTH_META_PIXEL_ID,
    metaConversionApiToken: process.env.RTH_META_CAPI_TOKEN,
    gtmContainerId: process.env.NEXT_PUBLIC_RTH_GTM_CONTAINER_ID,
    linkedInPartnerId: process.env.NEXT_PUBLIC_RTH_LINKEDIN_PARTNER_ID,
    hotjarSiteId: process.env.NEXT_PUBLIC_RTH_HOTJAR_SITE_ID,
    internalCollectionEndpoint: process.env.NEXT_PUBLIC_RTH_ANALYTICS_ENDPOINT,
    internalWarehouseStream: process.env.RTH_INTERNAL_ANALYTICS_STREAM,
  },
  skillupitacademy: {
    brandId: "skillupitacademy",
    hostnamePatterns: ["skillupitacademy.com", "www.skillupitacademy.com", "localhost"],
    ga4MeasurementId: process.env.NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID,
    ga4MeasurementApiSecret: process.env.SUIA_GA4_MEASUREMENT_API_SECRET,
    metaPixelId: process.env.NEXT_PUBLIC_SUIA_META_PIXEL_ID,
    metaConversionApiToken: process.env.SUIA_META_CAPI_TOKEN,
    gtmContainerId: process.env.NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID,
    linkedInPartnerId: process.env.NEXT_PUBLIC_SUIA_LINKEDIN_PARTNER_ID,
    hotjarSiteId: process.env.NEXT_PUBLIC_SUIA_HOTJAR_SITE_ID,
    internalCollectionEndpoint: process.env.NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT,
    internalWarehouseStream: process.env.SUIA_INTERNAL_ANALYTICS_STREAM,
  },
};

export function resolveBrandAnalyticsConfig(
  input: { brandId?: AnalyticsBrandId; hostname?: string } = {},
): BrandAnalyticsConfig {
  if (input.brandId) {
    return brandConfigs[input.brandId];
  }

  const hostname = input.hostname?.toLowerCase();

  if (hostname) {
    const matched = Object.values(brandConfigs).find((config) =>
      config.hostnamePatterns.some((pattern) => hostname === pattern || hostname.endsWith(`.${pattern}`)),
    );

    if (matched) {
      return matched;
    }
  }

  return brandConfigs.realtutorialhub;
}

export function getAnalyticsRuntimeConfig(
  input: { brandId?: AnalyticsBrandId; hostname?: string } = {},
): AnalyticsRuntimeConfig {
  const environment = getEnvironment();
  const brand = resolveBrandAnalyticsConfig(input);

  return {
    appName: process.env.NEXT_PUBLIC_ANALYTICS_APP_NAME ?? "marketing-site",
    environment,
    debug: readBoolean(process.env.NEXT_PUBLIC_ANALYTICS_DEBUG, environment !== "production"),
    enabled: readBoolean(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED, true),
    requestTimeoutMs: readNumber(process.env.NEXT_PUBLIC_ANALYTICS_TIMEOUT_MS, 4000),
    dedupeWindowMs: readNumber(process.env.NEXT_PUBLIC_ANALYTICS_DEDUPE_WINDOW_MS, 30_000),
    flushIntervalMs: readNumber(process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL_MS, 2_000),
    batchSize: readNumber(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE, 10),
    rateLimitPerMinute: readNumber(process.env.ANALYTICS_RATE_LIMIT_PER_MINUTE, 120),
    brand,
  };
}
