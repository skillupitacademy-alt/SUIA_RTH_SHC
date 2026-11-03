export type RequestBrand = 'realtutorialhub' | 'skillup' | 'skillhubcore';

export function resolveRequestBrand(value?: string | null): RequestBrand | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'skillup') return 'skillup';
  if (normalized === 'realtutorialhub') return 'realtutorialhub';
  if (normalized === 'skillhubcore') return 'skillhubcore';

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

export interface StrictRefreshBrandResult {
  brand?: RequestBrand;
  error?: 'missing_brand' | 'invalid_brand' | 'conflicting_brand';
}

/**
 * Strict refresh-context helper for tenant user/admin refresh requests.
 * Evaluates raw x-brand and x-platform headers:
 * - Missing or empty returns error: 'missing_brand'
 * - 'shared' or unknown non-canonical values return error: 'invalid_brand'
 * - Disagreeing non-empty x-brand and x-platform return error: 'conflicting_brand'
 * - Preserves existing resolveRequestBrandFromHeaders for other callers untouched.
 */
export function resolveStrictRefreshBrandFromHeaders(headers?: HeaderReader | null): StrictRefreshBrandResult {
  const rawBrand = headers?.get('x-brand');
  const rawPlatform = headers?.get('x-platform');

  const hasBrand = typeof rawBrand === 'string' && rawBrand.trim().length > 0;
  const hasPlatform = typeof rawPlatform === 'string' && rawPlatform.trim().length > 0;

  if (!hasBrand && !hasPlatform) {
    return { error: 'missing_brand' };
  }

  const normBrand = hasBrand ? rawBrand!.trim().toLowerCase() : undefined;
  const normPlatform = hasPlatform ? rawPlatform!.trim().toLowerCase() : undefined;

  if (normBrand === 'shared' || normPlatform === 'shared') {
    return { error: 'invalid_brand' };
  }

  if (normBrand !== undefined && normPlatform !== undefined && normBrand !== normPlatform) {
    return { error: 'conflicting_brand' };
  }

  const candidate = normBrand ?? normPlatform!;
  const canonical = resolveRequestBrand(candidate);
  if (canonical === undefined) {
    return { error: 'invalid_brand' };
  }

  return { brand: canonical };
}

export function resolveRequestBrandFromHeaders(headers?: HeaderReader | null, _fallbackHostname?: string | null): RequestBrand | undefined {
  const explicitBrandCandidates = [
    typeof headers?.get('x-brand') === 'string' ? headers?.get('x-brand')?.trim().toLowerCase() : undefined,
    typeof headers?.get('x-platform') === 'string' ? headers?.get('x-platform')?.trim().toLowerCase() : undefined,
  ];

  for (const candidate of explicitBrandCandidates) {
    const resolved = resolveRequestBrand(candidate);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  return undefined;
}

export function resolveRequestHostnameFromHeaders(headers?: HeaderReader | null, fallbackHostname?: string | null): string | undefined {
  const candidates = resolveRequestHostCandidates(headers, fallbackHostname);
  const resolved = candidates.find((candidate) => candidate !== undefined);
  
  // 🔥 DEBUG: Log hostname resolution for cookie domain debugging
  if (resolved !== undefined) {
    console.log('[HOSTNAME_RESOLUTION]', JSON.stringify({
      resolved,
      candidates: candidates.map((c, i) => ({ index: i, value: c })),
    }));
  }
  
  return resolved;
}

function resolveRequestHostCandidates(headers?: HeaderReader | null, fallbackHostname?: string | null) {
  return [
    tryExtractHostname(headers?.get('x-original-host')),
    tryExtractHostname(headers?.get('origin')),
    tryExtractHostname(headers?.get('x-forwarded-host')),
    tryExtractHostname(headers?.get('host')),
    tryExtractHostname(fallbackHostname),
  ];
}
