export type RequestBrand = 'realtutorialhub' | 'skillup';

export function resolveRequestBrand(hostname?: string | null): RequestBrand | undefined {
  if (typeof hostname !== 'string' || hostname.trim().length === 0) return undefined;

  const lowerHost = hostname.trim().toLowerCase();
  if (lowerHost.includes('skillup')) return 'skillup';
  if (lowerHost.includes('realtutorialhub')) return 'realtutorialhub';

  return undefined;
}
