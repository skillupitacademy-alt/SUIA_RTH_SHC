import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    
    // Proxy to central api-server
    const res = await fetch(`${apiUrl}/api/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_API_KEY ?? ""
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error("API Server telemetry rejection");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Fail silent for client, but log locally in admin-app
    console.error("[TelemetryProxy] Failed", err);
    return NextResponse.json({ error: "Telemetry fallback" }, { status: 202 });
  }
}
