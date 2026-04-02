export type ProxyRequestOptions = {
  requestId: string;
  gatewaySecret: string;
  userId?: string;
  upstreamPath?: string;
};

export async function proxyRequest(request: Request, upstream: string, options: ProxyRequestOptions): Promise<Response> {
  const url = new URL(request.url);
  const targetPath = options.upstreamPath ?? url.pathname;
  const upstreamUrl = new URL(`${targetPath}${url.search}`, upstream).toString();
  const headers = new Headers(request.headers);

  headers.set('X-Request-ID', options.requestId);
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Original-Host', url.hostname);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  if (typeof options.gatewaySecret === 'string' && options.gatewaySecret.length > 0) {
    headers.set('X-Gateway-Secret', options.gatewaySecret);
  }
  if (options.userId !== undefined) {
    headers.set('X-User-ID', options.userId);
  }

  headers.delete('CF-Connecting-IP');
  headers.delete('cf-connecting-ip');
  headers.delete('X-Forwarded-For');
  headers.delete('x-forwarded-for');

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.clone().arrayBuffer();

  return fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  });
}
