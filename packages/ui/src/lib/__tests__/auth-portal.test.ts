import { describe, expect, it } from 'vitest';

import { getAuthCookieName, resolvePortalIdentityFromHostname } from '../auth-portal';

describe('auth portal helpers', () => {
  it('detects admin hostnames as admin portal', () => {
    expect(resolvePortalIdentityFromHostname('admin.realtutorialhub.com')).toBe('admin');
    expect(resolvePortalIdentityFromHostname('ADMIN.REALTUTORIALHUB.COM')).toBe('admin');
  });

  it('defaults non-admin hosts to user portal', () => {
    expect(resolvePortalIdentityFromHostname('quiz.realtutorialhub.com')).toBe('user');
    expect(resolvePortalIdentityFromHostname('realtutorialhub.com')).toBe('user');
  });

  it('maps portal identity to the correct auth cookie', () => {
    expect(getAuthCookieName('admin')).toBe('admin_accessToken');
    expect(getAuthCookieName('user')).toBe('accessToken');
  });
});
