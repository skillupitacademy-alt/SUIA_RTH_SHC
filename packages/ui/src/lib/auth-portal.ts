export type PortalIdentity = 'admin' | 'user' | 'infrastructure';

export function resolvePortalIdentityFromHostname(hostname: string): PortalIdentity {
  const normalized = hostname.trim().toLowerCase();

  if (normalized.startsWith('admin.') || normalized.includes('.admin.')) {
    return 'admin';
  }

  if (normalized.startsWith('faculty.')) {
    return 'user';
  }

  return 'user';
}

export function getAuthCookieName(portalIdentity: PortalIdentity): 'admin_accessToken' | 'accessToken' {
  return portalIdentity === 'admin' ? 'admin_accessToken' : 'accessToken';
}
