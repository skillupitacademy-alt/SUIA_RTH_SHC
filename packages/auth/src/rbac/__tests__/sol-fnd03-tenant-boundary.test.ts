import { describe, expect, it } from 'vitest';
import { OwnershipRBACService, type OwnershipContext } from '../ownership.service';
import { PERMISSIONS } from '../permissions';

function foreignContext(): OwnershipContext {
  return {
    requestingUserId: 'local-user',
    requestingTenant: 'skillup',
    resourceOwnerId: 'local-user',
    resourceTenant: 'realtutorialhub',
    userRoles: ['student'],
  };
}

describe('Sol FND03 required tenant boundaries', () => {
  it('allows the verified same-tenant local owner', () => {
    expect(OwnershipRBACService.hasPermissionOrOwnership({
      ...foreignContext(), resourceTenant: 'skillup',
    }, PERMISSIONS.PROFILE_READ)).toBe(true);
  });

  it('rejects absent tenant context at the public service entry', () => {
    const invalid = {
      requestingUserId: 'local-user', resourceOwnerId: 'local-user', userRoles: ['student'],
    } as unknown as OwnershipContext;
    expect(OwnershipRBACService.hasPermissionOrOwnership(invalid, PERMISSIONS.PROFILE_READ))
      .toBe(false);
  });

  it('rejects missing tenants in the direct owner helper', () => {
    const missing = undefined as unknown as string;
    expect(OwnershipRBACService.isOwner('local-user', missing, 'local-user', missing))
      .toBe(false);
  });

  it('does not turn a tenant admin role into cross-tenant authority', () => {
    expect(OwnershipRBACService.hasPermissionOrOwnership({
      ...foreignContext(), userRoles: ['admin'],
    }, PERMISSIONS.PROFILE_WRITE)).toBe(false);
  });

  it('keeps access summaries denied across tenant boundaries', () => {
    const result = OwnershipRBACService.canAccessResource(
      foreignContext(), PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE,
    );
    expect(result.canRead).toBe(false);
    expect(result.canWrite).toBe(false);
  });

  it('does not equate different local subjects through a supplied projection ID', () => {
    expect(OwnershipRBACService.isOwner(
      'learner-a', 'skillup', 'learner-b', 'skillup', 'projection', 'projection',
    )).toBe(false);
  });
});
