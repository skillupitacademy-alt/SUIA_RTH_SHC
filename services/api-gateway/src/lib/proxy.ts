export type ProxyRequestOptions = {
  requestId: string;
  gatewaySecret: string;
  userId?: string;
  shadowUserId?: string;
  originalUserId?: string;
  portal?: 'admin' | 'user';
  brand?: string;
  upstreamPath?: string;
};

function tryExtractHostname(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const first = trimmed.split(',')[0]?.trim();
  if (first === undefined || first.length === 0) {
    return undefined;
  }

  try {
    if (first.includes('://')) {
      return new URL(first).hostname.toLowerCase();
    }
  } catch {
    // fall through to hostname normalization
  }

  return first.replace(/:\d+$/, '').toLowerCase();
}

export async function proxyRequest(request: Request, upstream: string, options: ProxyRequestOptions): Promise<Response> {
  const url = new URL(request.url);
  const targetPath = options.upstreamPath ?? url.pathname;
  const upstreamUrl = new URL(`${targetPath}${url.search}`, upstream).toString();
  const headers = new Headers(request.headers);
  const originHostname = tryExtractHostname(headers.get('origin'));
  const originalHostname = originHostname ?? url.hostname;

  headers.set('X-Request-ID', options.requestId);
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Original-Host', originalHostname);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  if (typeof options.gatewaySecret === 'string' && options.gatewaySecret.length > 0) {
    headers.set('X-Gateway-Secret', options.gatewaySecret);
  }
  if (options.userId !== undefined) {
    headers.set('X-User-ID', options.userId);
  }
  if (options.shadowUserId !== undefined) {
    headers.set('X-Shadow-User-ID', options.shadowUserId);
  }
  if (options.originalUserId !== undefined) {
    headers.set('X-Original-User-ID', options.originalUserId);
  }
  if (options.portal !== undefined) {
    headers.set('X-Portal-Identity', options.portal);
  }
  if (typeof options.brand === 'string' && options.brand.length > 0) {
    headers.set('X-Brand', options.brand);
    headers.set('X-Platform', options.brand);
  }

  headers.delete('Host');
  headers.delete('host');
  headers.delete('CF-Connecting-IP');
  headers.delete('cf-connecting-ip');
  headers.delete('X-Forwarded-For');
  headers.delete('x-forwarded-for');

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.clone().arrayBuffer();

  return fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  });
}
