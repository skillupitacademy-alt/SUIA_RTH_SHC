import { describe, expect, it } from 'vitest';

import { getAuthCookieName } from '../auth-portal';

describe('auth portal helpers', () => {
  it('maps portal identity to the correct auth cookie', () => {
    expect(getAuthCookieName('admin')).toBe('admin_accessToken');
    expect(getAuthCookieName('user')).toBe('accessToken');
    expect(getAuthCookieName('faculty')).toBe('accessToken');
    expect(getAuthCookieName('super_admin')).toBe('accessToken');
    expect(getAuthCookieName('infrastructure')).toBe('accessToken');
  });
});
