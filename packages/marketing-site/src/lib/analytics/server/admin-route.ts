import { NextResponse, type NextRequest } from "next/server";

import { getAnalyticsDeadLetterQueue, getAnalyticsObservabilityState } from "./pipeline";

function isAuthorized(request: NextRequest) {
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const adminToken = process.env.ANALYTICS_ADMIN_TOKEN;

  if (!adminToken) {
    return false;
  }

  return bearerToken === adminToken;
}

export async function handleAnalyticsObservabilityRequest(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    ...getAnalyticsObservabilityState(),
    deadLetterQueue: getAnalyticsDeadLetterQueue(),
  });
}

