export type ProxyRequestOptions = {
  requestId: string;
  gatewaySecret: string;
  userId?: string;
  shadowUserId?: string;
  originalUserId?: string;
  portal?: 'admin' | 'user';
  brand?: string;
  roles?: string[]; // 🔥 ADD: User roles for RBAC
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
  
  // 🔥 CRITICAL FIX: Preserve the original public hostname for cookie domain resolution
  // The Cloudflare Worker hostname (url.hostname) is internal, but we need the public domain
  // for cookies to work across services. Use the CF Worker request hostname as the original.
  const originHostname = tryExtractHostname(headers.get('origin'));
  const cfWorkerHostname = url.hostname; // This is the public domain from the CF route
  const originalHostname = originHostname ?? cfWorkerHostname;

  // 🔥 CORRELATION ID: Generate if not present for end-to-end tracing
  const correlationId = headers.get('x-correlation-id') || crypto.randomUUID();
  headers.set('X-Correlation-ID', correlationId);
  
  headers.set('X-Request-ID', options.requestId);
  headers.set('X-Forwarded-Host', cfWorkerHostname);
  headers.set('X-Original-Host', originalHostname);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  
  // 🔥 INTERNAL SECRET: Validate API server trusts gateway (Phase 3: Standardized header)
  if (typeof options.gatewaySecret === 'string' && options.gatewaySecret.length > 0) {
    headers.set('X-Internal-Secret', options.gatewaySecret);
    
    // 📊 OBSERVABILITY: Log header standardization (Phase 3)
    console.log(JSON.stringify({
      tag: 'PHASE_3_HEADER',
      action: 'set_internal_secret',
      source: 'api_gateway',
      path: targetPath,
      hasSecret: true,
    }));
  }
  
  // 🚀 OPTIMIZATION: Inject user identity headers from JWT validation
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
  
  // 🔥 BRAND RESOLUTION: Inject brand header
  if (typeof options.brand === 'string' && options.brand.length > 0) {
    headers.set('X-Brand', options.brand);
    headers.set('X-Platform', options.brand);
  }

  // 🔥 RBAC: Forward user roles for permission checks
  if (Array.isArray(options.roles) && options.roles.length > 0) {
    const rolesHeader = options.roles.join(',');
    headers.set('X-User-Roles', rolesHeader);
    console.log('🔥 [PROXY_ROLES_SET]', JSON.stringify({
      roles: options.roles,
      rolesHeader,
      path: targetPath,
      correlationId
    }));
  } else {
    console.log('⚠️ [PROXY_ROLES_MISSING]', JSON.stringify({
      roles: options.roles,
      rolesType: typeof options.roles,
      rolesIsArray: Array.isArray(options.roles),
      path: targetPath,
      correlationId
    }));
  }

  // 🔥 DEVICE TRACKING: Forward device headers for multi-device session management
  const deviceId = request.headers.get('x-device-id');
  const deviceName = request.headers.get('x-device-name');
  if (deviceId) {
    headers.set('X-Device-ID', deviceId);
  }
  if (deviceName) {
    headers.set('X-Device-Name', deviceName);
  }

  // 🔥 CRITICAL: Forward brand explicitly (source of truth)
  if (options.brand) {
    headers.set('X-Brand', options.brand);
    console.log('🔥 [PROXY_BRAND_SET]', JSON.stringify({
      brand: options.brand,
      path: targetPath,
      correlationId
    }));
  }

  // 🔥 CRITICAL FIX: Forward cookies to BFF endpoints
  // BFF routes need cookies for authentication when requests come through gateway
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
    console.log('🍪 [PROXY_COOKIE_FORWARDED]', JSON.stringify({
      hasCookie: true,
      cookieLength: cookieHeader.length,
      path: targetPath,
      correlationId
    }));
  }

  // Clean up headers that shouldn't be forwarded
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
