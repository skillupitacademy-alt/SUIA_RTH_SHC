import type { PortalIdentity } from '@quiz/types';

export function getAuthCookieName(portalIdentity: PortalIdentity): 'admin_accessToken' | 'accessToken' {
  return portalIdentity === 'admin' ? 'admin_accessToken' : 'accessToken';
}
