import { NextResponse } from 'next/server';

export function getFacultyUpstreamBaseUrl() {
  const values = [
    process.env.INTERNAL_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().replace(/\/+$/, '');
    }
  }

  return null;
}

export async function relayJsonResponse(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType !== null) {
    headers.set('content-type', contentType);
  }
  headers.set('cache-control', 'no-store');
  return new NextResponse(await response.text(), {
    status: response.status,
    headers,
  });
}
