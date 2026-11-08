# FND11 Merge Completion

## Merge Details
- **Merged Commit SHA**: `1b3bfd0eaaf8d65eb106f6ca458176badfd81742`
- **Source Branch**: `fnd11-people-email-foundation`
- **Target Branch**: `remediation/w1-2-batch-05-targeted`
- **Merge Type**: Fast-forward (after rebase)
- **Date**: 2025-01-28

## Changes Merged
- Tenant-scoped email uniqueness implementation
- Email normalization utilities with comprehensive tests
- Foreign-tenant collision detection and rejection (Option B)
- Same-platform user reuse logic
- Updated collision tests

## Files Modified
- `packages/db-people/src/schema/users.ts` - Added normalized_email field
- `packages/db-people/src/utils/email-normalization.ts` - New email normalization logic
- `packages/db-people/src/utils/__tests__/email-normalization.test.ts` - 111 lines of tests
- `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` - Updated collision handling
- `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts` - Updated tests

## Dependencies Unblocked

### FND16 - User Profile Identity Foundation
**Status**: Now unblocked  
**Reason**: Can now safely implement userProfiles.userId foreign key constraint with confidence that email collisions are properly handled at the tenant scope.

### FND18 - Multi-Tenant Lookup/Enrollment
**Status**: Now unblocked  
**Reason**: Email normalization and tenant-scoped uniqueness provides the foundation for cross-tenant enrollment decisions and lookup logic.

## Next Steps
1. FND16 and FND18 implementation can proceed
2. Consider documenting the Option B decision (rejection vs. separate identity) in architecture records
3. Monitor production for any foreign-tenant collision scenarios once deployed
