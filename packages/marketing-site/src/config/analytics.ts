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
    hostnamePatterns: ["realtutorialhub.com", "www.realtutorialhub.com"],
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
    hostnamePatterns: ["skillupitacademy.com", "www.skillupitacademy.com"],
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

export const SUPPORTED_ANALYTICS_BRANDS: readonly AnalyticsBrandId[] = [
  "realtutorialhub",
  "skillupitacademy",
] as const;

export function isSupportedAnalyticsBrandId(value: unknown): value is AnalyticsBrandId {
  return value === "realtutorialhub" || value === "skillupitacademy";
}

export interface ServerAnalyticsIngressConfig {
  configuredBrandId?: string;
  allowedLocalOrigins?: Partial<Record<AnalyticsBrandId, readonly string[]>>;
  allowedHosts?: Partial<Record<AnalyticsBrandId, readonly string[]>>;
}

let serverIngressOverrideConfig: ServerAnalyticsIngressConfig | undefined;

export function configureServerAnalyticsIngress(config?: ServerAnalyticsIngressConfig): void {
  serverIngressOverrideConfig = config;
}

export interface ParsedAuthorityHost {
  hostname: string;
  port?: string;
  hostWithPort: string;
}

const HOSTNAME_TOKEN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

export function parseStrictAuthorityHost(rawAuthority: unknown): ParsedAuthorityHost | undefined {
  if (typeof rawAuthority !== "string") {
    return undefined;
  }
  const trimmed = rawAuthority.trim();
  if (!trimmed || trimmed !== rawAuthority) {
    return undefined;
  }
  if (/[\s@/,\\?#]/.test(trimmed)) {
    return undefined;
  }

  const firstColon = trimmed.indexOf(":");
  const lastColon = trimmed.lastIndexOf(":");
  if (firstColon !== lastColon) {
    return undefined;
  }

  let hostnamePart = trimmed;
  let portPart: string | undefined;

  if (firstColon !== -1) {
    hostnamePart = trimmed.slice(0, firstColon);
    portPart = trimmed.slice(firstColon + 1);
    if (!portPart || !/^[0-9]{1,5}$/.test(portPart)) {
      return undefined;
    }
    const portNum = Number(portPart);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      return undefined;
    }
  }

  const normalizedHostname = hostnamePart.toLowerCase();
  if (
    !normalizedHostname ||
    normalizedHostname.includes("..") ||
    !HOSTNAME_TOKEN_REGEX.test(normalizedHostname)
  ) {
    return undefined;
  }

  return {
    hostname: normalizedHostname,
    port: portPart,
    hostWithPort: portPart ? `${normalizedHostname}:${portPart}` : normalizedHostname,
  };
}

export function extractStrictUrlAuthority(rawUrl: unknown): ParsedAuthorityHost | undefined {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return undefined;
  }
  if (/^https?:\/\/[^/?#]*@/i.test(rawUrl)) {
    return undefined;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.username || parsed.password) {
      return undefined;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parseStrictAuthorityHost(parsed.host);
  } catch {
    return undefined;
  }
}

function collectAllowedAuthoritiesForBrand(
  brandId: AnalyticsBrandId,
  options?: ServerAnalyticsIngressConfig,
): { exactHosts: Set<string>; exactHostWithPorts: Set<string> } {
  const exactHosts = new Set<string>();
  const exactHostWithPorts = new Set<string>();

  for (const registeredHost of brandConfigs[brandId].hostnamePatterns) {
    const parsed = parseStrictAuthorityHost(registeredHost.toLowerCase());
    if (parsed) {
      exactHosts.add(parsed.hostname);
      exactHostWithPorts.add(parsed.hostname);
      exactHostWithPorts.add(`${parsed.hostname}:443`);
      exactHostWithPorts.add(`${parsed.hostname}:80`);
    }
  }

  const envHostsRaw = process.env.ANALYTICS_INGRESS_ALLOWED_HOSTS;
  const envHosts =
    typeof envHostsRaw === "string" && envHostsRaw.trim()
      ? envHostsRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  const configuredHosts = [
    ...envHosts,
    ...(serverIngressOverrideConfig?.allowedHosts?.[brandId] ?? []),
    ...(options?.allowedHosts?.[brandId] ?? []),
  ];
  for (const entry of configuredHosts) {
    const parsed = parseStrictAuthorityHost(entry);
    if (parsed) {
      if (parsed.port) {
        exactHostWithPorts.add(parsed.hostWithPort);
      } else {
        exactHosts.add(parsed.hostname);
        exactHostWithPorts.add(parsed.hostname);
      }
    }
  }

  const envOriginsRaw = process.env.ANALYTICS_INGRESS_ALLOWED_ORIGINS;
  const envOrigins =
    typeof envOriginsRaw === "string" && envOriginsRaw.trim()
      ? envOriginsRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  const configuredOrigins = [
    ...envOrigins,
    ...(serverIngressOverrideConfig?.allowedLocalOrigins?.[brandId] ?? []),
    ...(options?.allowedLocalOrigins?.[brandId] ?? []),
  ];

  for (const originEntry of configuredOrigins) {
    const parsedFromUrl = extractStrictUrlAuthority(originEntry);
    const parsed = parsedFromUrl ?? parseStrictAuthorityHost(originEntry);
    if (parsed) {
      if (parsed.port) {
        exactHostWithPorts.add(parsed.hostWithPort);
      } else {
        exactHosts.add(parsed.hostname);
        exactHostWithPorts.add(parsed.hostname);
      }
    }
  }

  return { exactHosts, exactHostWithPorts };
}

export function resolveStrictServerIngressBrandConfig(input: {
  mode: "public-route" | "collector";
  hostHeader?: string | null;
  requestUrl?: string | null;
  forwardedHostHeader?: string | null;
  originHeader?: string | null;
  options?: ServerAnalyticsIngressConfig;
}): BrandAnalyticsConfig {
  const rawConfiguredBrand =
    input.options?.configuredBrandId !== undefined
      ? input.options.configuredBrandId
      : serverIngressOverrideConfig?.configuredBrandId !== undefined
        ? serverIngressOverrideConfig.configuredBrandId
        : process.env.ANALYTICS_INGRESS_BRAND;

  if (typeof rawConfiguredBrand !== "string" || !isSupportedAnalyticsBrandId(rawConfiguredBrand)) {
    throw new Error("analytics_ingress_unavailable");
  }

  const configuredBrandId: AnalyticsBrandId = rawConfiguredBrand;

  const hasHostHeader = input.hostHeader !== undefined && input.hostHeader !== null;
  const parsedHostHeader = hasHostHeader ? parseStrictAuthorityHost(input.hostHeader) : undefined;
  if (hasHostHeader && !parsedHostHeader) {
    throw new Error("invalid_analytics_brand_context");
  }

  const hasRequestUrl =
    typeof input.requestUrl === "string" &&
    (input.requestUrl.startsWith("http://") || input.requestUrl.startsWith("https://"));
  const parsedUrlAuthority = hasRequestUrl ? extractStrictUrlAuthority(input.requestUrl) : undefined;
  if (hasRequestUrl && !parsedUrlAuthority) {
    throw new Error("invalid_analytics_brand_context");
  }

  if (parsedHostHeader && parsedUrlAuthority) {
    if (parsedHostHeader.hostWithPort !== parsedUrlAuthority.hostWithPort) {
      throw new Error("invalid_analytics_brand_context");
    }
  }

  if (input.forwardedHostHeader !== undefined && input.forwardedHostHeader !== null) {
    const parsedForwarded = parseStrictAuthorityHost(input.forwardedHostHeader);
    if (!parsedForwarded) {
      throw new Error("invalid_analytics_brand_context");
    }
    const effectiveAuthority = parsedHostHeader ?? parsedUrlAuthority;
    if (effectiveAuthority && parsedForwarded.hostWithPort !== effectiveAuthority.hostWithPort) {
      throw new Error("invalid_analytics_brand_context");
    }
  }

  if (input.mode === "public-route") {
    const authority = parsedHostHeader ?? parsedUrlAuthority;
    if (!authority) {
      throw new Error("analytics_ingress_unavailable");
    }

    const allowlist = collectAllowedAuthoritiesForBrand(configuredBrandId, input.options);
    const isAllowed = authority.port
      ? allowlist.exactHostWithPorts.has(authority.hostWithPort)
      : allowlist.exactHosts.has(authority.hostname) ||
        allowlist.exactHostWithPorts.has(authority.hostWithPort);

    if (!isAllowed) {
      throw new Error("invalid_analytics_brand_context");
    }

    if (input.originHeader !== undefined && input.originHeader !== null) {
      const parsedOrigin = extractStrictUrlAuthority(input.originHeader);
      if (!parsedOrigin) {
        throw new Error("invalid_analytics_brand_context");
      }
      const isOriginAllowed = parsedOrigin.port
        ? allowlist.exactHostWithPorts.has(parsedOrigin.hostWithPort)
        : allowlist.exactHosts.has(parsedOrigin.hostname) ||
          allowlist.exactHostWithPorts.has(parsedOrigin.hostWithPort);
      if (!isOriginAllowed) {
        throw new Error("invalid_analytics_brand_context");
      }
    }
  } else if (input.originHeader !== undefined && input.originHeader !== null) {
    const parsedOrigin = extractStrictUrlAuthority(input.originHeader);
    if (!parsedOrigin) {
      throw new Error("invalid_analytics_brand_context");
    }
    const allowlist = collectAllowedAuthoritiesForBrand(configuredBrandId, input.options);
    const isOriginAllowed = parsedOrigin.port
      ? allowlist.exactHostWithPorts.has(parsedOrigin.hostWithPort)
      : allowlist.exactHosts.has(parsedOrigin.hostname) ||
        allowlist.exactHostWithPorts.has(parsedOrigin.hostWithPort);
    if (!isOriginAllowed) {
      throw new Error("invalid_analytics_brand_context");
    }
  }

  return brandConfigs[configuredBrandId];
}

export function validateAnalyticsBrandHint(
  rawHint: unknown,
  authoritativeBrandId: AnalyticsBrandId,
): void {
  if (rawHint === undefined || rawHint === null) {
    return;
  }
  if (typeof rawHint !== "string" || !isSupportedAnalyticsBrandId(rawHint)) {
    throw new Error("invalid_analytics_brand_context");
  }
  if (rawHint !== authoritativeBrandId) {
    throw new Error("invalid_analytics_brand_context");
  }
}

export function validateAndPinIngressEventBody(
  body: unknown,
  authoritativeBrandId: AnalyticsBrandId,
): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("invalid_analytics_request_body");
  }

  const record = body as Record<string, unknown>;
  if ("brandId" in record && record.brandId !== undefined) {
    validateAnalyticsBrandHint(record.brandId, authoritativeBrandId);
  }

  if ("context" in record && record.context !== undefined) {
    if (typeof record.context !== "object" || record.context === null || Array.isArray(record.context)) {
      throw new Error("invalid_analytics_brand_context");
    }
    const contextRecord = record.context as Record<string, unknown>;
    if ("brandId" in contextRecord && contextRecord.brandId !== undefined) {
      validateAnalyticsBrandHint(contextRecord.brandId, authoritativeBrandId);
    }
    return {
      ...record,
      context: {
        ...contextRecord,
        brandId: authoritativeBrandId,
      },
    };
  }

  return record;
}

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
