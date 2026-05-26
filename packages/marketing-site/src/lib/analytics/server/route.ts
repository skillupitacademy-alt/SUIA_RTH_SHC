import { NextResponse, type NextRequest } from "next/server";

import { resolveBrandAnalyticsConfig } from "../../../config/analytics";
import { ingestAnalyticsEvent } from "./pipeline";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function handleAnalyticsTrackRequest(request: NextRequest) {
  try {
    const hostname = request.headers.get("host") ?? undefined;
    const brandHeader = request.headers.get("x-analytics-brand");
    const brandConfig = resolveBrandAnalyticsConfig({
      brandId:
        brandHeader === "realtutorialhub" || brandHeader === "skillupitacademy"
          ? brandHeader
          : undefined,
      hostname,
    });

    const body = await request.json();
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
    const message = error instanceof Error ? error.message : "analytics_request_failed";
    const status =
      message === "analytics_rate_limit_exceeded"
        ? 429
        : message.startsWith("invalid_")
          ? 400
          : 500;

    console.error("[analytics:ingest_failed]", error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}

