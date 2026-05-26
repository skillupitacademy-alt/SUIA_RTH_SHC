import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function resolveCollectorBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ANALYTICS_COLLECTOR_BASE_URL ??
    process.env.ANALYTICS_COLLECTOR_BASE_URL ??
    process.env.NEXT_PUBLIC_RTH_ANALYTICS_ENDPOINT ??
    ''
  )
    .trim()
    .replace(/\/+$/, '');
}

export async function GET() {
  const baseUrl = resolveCollectorBaseUrl();
  const token = process.env.ANALYTICS_ADMIN_TOKEN;

  if (!baseUrl) {
    return NextResponse.json({ ok: false, error: 'collector_base_url_not_configured' }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: 'analytics_admin_token_not_configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${baseUrl}/observability`, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'collector_observability_proxy_failed',
      },
      { status: 500 },
    );
  }
}
