import { NextResponse, type NextRequest } from "next/server";

import {
  resolveStrictServerIngressBrandConfig,
  type ServerAnalyticsIngressConfig,
  validateAnalyticsBrandHint,
  validateAndPinIngressEventBody,
} from "../../../config/analytics";
import { ingestAnalyticsEvent } from "./pipeline";

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

function sanitizeAnalyticsErrorCode(error: unknown): { status: 400 | 429 | 500 | 503; code: string } {
  const rawMessage = error instanceof Error ? error.message : "";
  if (rawMessage === "analytics_ingress_unavailable") {
    return { status: 503, code: "analytics_ingress_unavailable" };
  }
  if (rawMessage === "analytics_rate_limit_exceeded") {
    return { status: 429, code: "analytics_rate_limit_exceeded" };
  }
  if (rawMessage === "invalid_analytics_brand_context") {
    return { status: 400, code: "invalid_analytics_brand_context" };
  }
  if (rawMessage.startsWith("invalid_")) {
    return { status: 400, code: rawMessage };
  }
  if (error instanceof Error && error.name === "ZodError") {
    return { status: 400, code: "invalid_analytics_event_schema" };
  }
  return { status: 500, code: "analytics_request_failed" };
}

export async function handleAnalyticsTrackRequest(
  request: NextRequest | Request,
  options?: ServerAnalyticsIngressConfig,
) {
  try {
    const brandConfig = resolveStrictServerIngressBrandConfig({
      mode: "public-route",
      hostHeader: request.headers.get("host"),
      requestUrl: request.url,
      forwardedHostHeader: request.headers.get("x-forwarded-host"),
      originHeader: request.headers.get("origin"),
      options,
    });

    const brandHeader = request.headers.get("x-analytics-brand");
    validateAnalyticsBrandHint(brandHeader, brandConfig.brandId);

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new Error("invalid_analytics_request_body");
    }

    const body = validateAndPinIngressEventBody(rawBody, brandConfig.brandId);
    const result = await ingestAnalyticsEvent({
      body,
      ipAddress: getClientIp(request),
      brandId: brandConfig.brandId,
    });

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 202 },
    );
  } catch (error) {
    const { status, code } = sanitizeAnalyticsErrorCode(error);

    console.error("[analytics:ingest_failed]", { error: code, status });

    return NextResponse.json(
      {
        ok: false,
        error: code,
      },
      { status },
    );
  }
}

