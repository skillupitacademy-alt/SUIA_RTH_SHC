import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function resolveContentBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SHC_CONTENT_BASE_URL ??
    process.env.MARKETING_CONTENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ''
  )
    .trim()
    .replace(/\/+$/, '');
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await context.params;
  const baseUrl = resolveContentBaseUrl();

  if (!baseUrl) {
    return NextResponse.json({ ok: false, error: 'content_base_url_not_configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${baseUrl}/public/marketing/bootstrap/${brandId}`, {
      headers: {
        accept: 'application/json',
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
        error: error instanceof Error ? error.message : 'marketing_bootstrap_proxy_failed',
      },
      { status: 500 },
    );
  }
}
