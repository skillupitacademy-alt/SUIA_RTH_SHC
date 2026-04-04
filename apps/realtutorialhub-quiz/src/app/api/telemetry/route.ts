import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Use internal URL to bypass Cloudflare for server-to-server calls
    const rawUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
    // rawUrl already ends with /api, so append only /telemetry
    const telemetryUrl = rawUrl.endsWith("/api") ? `${rawUrl}/telemetry` : `${rawUrl}/api/telemetry`;
    
    // Proxy to central api-server
    const res = await fetch(telemetryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error("API Server telemetry rejection");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TelemetryProxy] Failed", err);
    return NextResponse.json({ error: "Telemetry fallback" }, { status: 202 });
  }
}
