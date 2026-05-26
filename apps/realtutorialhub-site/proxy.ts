import { NextRequest, NextResponse } from "next/server";

import { brand } from "./brand";

const ignoredPathPattern = /^\/(_next\/static|_next\/image|favicon\.ico|sitemap\.xml|robots\.txt|.*\.[^/]+$)/;
const experimentCookieName = "shc_exp_home_hero";
const attributionCookieName = "shc_attr";
const controlPlaneCacheTtlMs = 5 * 60 * 1000;

let cachedControlPlane:
  | {
      expiresAt: number;
      value: {
        personalization: {
          deviceHintsEnabled: boolean;
          campaignHintsEnabled: boolean;
          geoHintsEnabled: boolean;
        };
        experiments: Array<{
          key: string;
          enabled: boolean;
        }>;
      };
    }
  | null = null;

function getDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const normalizedUserAgent = userAgent.toLowerCase();
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/.test(normalizedUserAgent)) {
    return "tablet";
  }

  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(normalizedUserAgent)) {
    return "mobile";
  }

  return "desktop";
}

function getStableVariant(seed: string): "control" | "variant-a" {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % 2 === 0 ? "control" : "variant-a";
}

function buildAttributionSnapshot(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const snapshot = {
    campaign: searchParams.get("utm_campaign"),
    medium: searchParams.get("utm_medium"),
    source: searchParams.get("utm_source"),
  };

  if (snapshot.campaign || snapshot.medium || snapshot.source) {
    return JSON.stringify(snapshot);
  }

  return null;
}

async function getControlPlaneSnapshot() {
  const now = Date.now();
  if (cachedControlPlane && cachedControlPlane.expiresAt > now) {
    return cachedControlPlane.value;
  }

  const baseUrl =
    process.env.MARKETING_CONTENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SHC_CONTENT_BASE_URL ??
    process.env.SHARED_CONTENT_API_BASE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/public/marketing/control-plane/${brand.id}`, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      personalization: {
        deviceHintsEnabled: boolean;
        campaignHintsEnabled: boolean;
        geoHintsEnabled: boolean;
      };
      experiments: Array<{
        key: string;
        enabled: boolean;
      }>;
    };

    cachedControlPlane = {
      expiresAt: now + controlPlaneCacheTtlMs,
      value: data,
    };

    return data;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  if (ignoredPathPattern.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const controlPlane = await getControlPlaneSnapshot();
  const homeHeroExperimentEnabled =
    controlPlane?.experiments.find((item) => item.key === "home-hero")?.enabled ?? true;

  const existingVariant = request.cookies.get(experimentCookieName)?.value;
  const userAgent = request.headers.get("user-agent") ?? "";
  const deviceType = getDeviceType(userAgent);
  const variantSeed =
    existingVariant ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("user-agent") ??
    brand.id;
  const variant =
    !homeHeroExperimentEnabled
      ? "control"
      : existingVariant === "control" || existingVariant === "variant-a"
        ? existingVariant
        : getStableVariant(variantSeed);
  const attributionSnapshot = buildAttributionSnapshot(request);

  const personalizationHints = [
    controlPlane?.personalization.geoHintsEnabled ? "geo" : null,
    controlPlane?.personalization.campaignHintsEnabled ?? true ? "campaign" : null,
    controlPlane?.personalization.deviceHintsEnabled ?? true ? "device" : null,
    homeHeroExperimentEnabled ? "experiment" : null,
  ]
    .filter(Boolean)
    .join(",");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-brand", brand.id);
  requestHeaders.set("x-device-type", deviceType);
  requestHeaders.set("x-experiment-home-hero", variant);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-brand", brand.id);
  response.headers.set("x-device-type", deviceType);
  response.headers.set("x-experiment-home-hero", variant);
  response.headers.set("x-personalization-hints", personalizationHints || "campaign,device");
  response.headers.set("vary", "x-forwarded-host, x-forwarded-proto, user-agent");

  response.cookies.set(experimentCookieName, variant, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (attributionSnapshot !== null) {
    response.cookies.set(attributionCookieName, attributionSnapshot, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
