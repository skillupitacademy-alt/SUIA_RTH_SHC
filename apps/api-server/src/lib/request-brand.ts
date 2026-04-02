export type RequestBrand = 'realtutorialhub' | 'skillup';

export function resolveRequestBrand(hostname?: string | null): RequestBrand | undefined {
  if (typeof hostname !== 'string' || hostname.trim().length === 0) return undefined;

  const lowerHost = hostname.trim().toLowerCase();
  if (lowerHost.includes('skillup')) return 'skillup';
  if (lowerHost.includes('realtutorialhub')) return 'realtutorialhub';

  return undefined;
}

type HeaderReader = {
  get(name: string): string | null;
};

export function tryExtractHostname(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  const first = trimmed.split(',')[0]?.trim();
  if (first === undefined || first.length === 0) return undefined;

  try {
    if (first.includes('://')) {
      return new URL(first).hostname.toLowerCase();
    }
  } catch {
    // fall through to hostname normalization
  }

  return first.replace(/:\d+$/, '').toLowerCase();
}

export function resolveRequestBrandFromHeaders(headers?: HeaderReader | null, fallbackHostname?: string | null): RequestBrand | undefined {
  const candidates = resolveRequestHostCandidates(headers, fallbackHostname);

  for (const candidate of candidates) {
    const resolved = resolveRequestBrand(candidate);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  return undefined;
}

export function resolveRequestHostnameFromHeaders(headers?: HeaderReader | null, fallbackHostname?: string | null): string | undefined {
  return resolveRequestHostCandidates(headers, fallbackHostname).find((candidate) => candidate !== undefined);
}

function resolveRequestHostCandidates(headers?: HeaderReader | null, fallbackHostname?: string | null) {
  return [
    tryExtractHostname(headers?.get('x-forwarded-host')),
    tryExtractHostname(headers?.get('x-original-host')),
    tryExtractHostname(headers?.get('origin')),
    tryExtractHostname(headers?.get('host')),
    tryExtractHostname(fallbackHostname),
  ];
}
