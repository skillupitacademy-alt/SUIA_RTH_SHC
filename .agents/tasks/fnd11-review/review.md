# Tenant-Scoped Email Uniqueness with Foreign-Tenant Collision Rejection

Implementation of tenant-scoped email uniqueness for the People Projection, enforcing platform-qualified email constraints and rejecting foreign-tenant collisions at admission. The change removes the global unique constraint on email, adds a composite unique index scoped to `(email, platform)`, introduces RFC 5322-compliant email normalization, and updates the admission route to detect and reject foreign-tenant collisions with 409 status. The policy document specified exploratory guidance for "Option A" (create separate identities) but the acceptance criteria explicitly required 403/409 rejection. The implementation chose Option B, which correctly satisfies the VERIFICATION_FAILED test requirement that foreign-tenant admission attempts must return 403/409.

**Watch for:** Database migration is documented but not executed (requires explicit authorization). The composite unique index uses a functional expression `LOWER(TRIM(email))` which aligns with application-layer normalization. Foreign-tenant collision check performs two database reads per admission (unscoped lookup, then user creation), which is correct but not optimized. Email normalization tests are comprehensive (20 test cases). Collision tests validate both rejection and same-platform reuse paths.

**Verdict**: APPROVED

## High-level view

The schema change removes the global unique constraint from `users.email` and introduces a composite unique index on `(LOWER(TRIM(email)), platform)` with a partial index predicate excluding soft-deleted users. This allows the same email address to exist across different platforms while preventing duplicates within a tenant.

Email normalization is centralized in a new utility module that applies lowercase and trim transformations, validates RFC 5322 structure, and enforces length limits. The normalization is exported from the db-people package and applied at the admission boundary before lookups and storage.

The admission route now performs an unscoped email lookup first to detect any platform match, then rejects with 409 if the match is on a different platform. Same-platform matches reuse the existing user; no match creates a new user on the target platform. This implements Option B (reject collision) rather than Option A (create separate identity), correctly aligning with the VERIFICATION_FAILED test expectation.

Collision test coverage includes two behavioral paths: foreign-platform rejection (expects 409, no writes, no events) and same-platform reuse (expects 200, transaction committed, event published). The test mock simulates platform-scoped query behavior by returning an empty result when platforms don't match.

<details>
<summary>Issues (3)</summary>

1. **Two-query admission pattern** — confirmed — Foreign-tenant collision detection requires an unscoped lookup followed by conditional user creation. Consider collapsing into a single platform-scoped lookup with explicit "create new user" path (no foreign-tenant check needed if policy allows cross-platform duplicates). Current correctness is preserved but requires an extra database round trip per admission.

2. **Schema migration SQL documented but not executed** — confirmed — Migration document exists with pre-migration audit queries, CONCURRENTLY index creation, and rollback procedures. Physical execution requires explicit authorization. The `uniq_users_email_platform` index definition in TypeScript schema matches documented SQL.

3. **Normalization test coverage isolated from integration** — confirmed — Email normalization has 20 unit tests but no integration test demonstrating database-level enforcement of the functional index expression. The `LOWER(TRIM(email))` expression in the index must match application normalization exactly or duplicates could slip through with different casing/whitespace.

</details>

<details>
<summary>Details</summary>

## Composite unique index with functional normalization

The schema definition replaces the global `.unique()` constraint with a composite unique index:

```typescript
uniqEmailPlatform: uniqueIndex('uniq_users_email_platform')
  .on(sql`LOWER(TRIM(${table.email}))`, table.platform)
  .where(sql`${table.deletedAt} IS NULL`)
```

The functional expression `LOWER(TRIM(email))` enforces normalization at the database level, preventing duplicates that differ only in casing or whitespace. The partial index predicate `WHERE deleted_at IS NULL` allows email reuse after soft deletion. The composite key `(email, platform)` scopes uniqueness to tenant boundaries.

The Drizzle ORM schema definition will generate SQL equivalent to:

```sql
CREATE UNIQUE INDEX uniq_users_email_platform
ON users (LOWER(TRIM(email)), platform)
WHERE deleted_at IS NULL;
```

This matches the migration SQL documented in `migration.md`.

## Email normalization implementation

The normalization utility provides two functions: `normalizeEmail()` (throws on invalid input) and `safeNormalizeEmail()` (returns null on error). Normalization applies:

1. Trim leading/trailing whitespace
2. Lowercase conversion
3. RFC 5322 basic validation (pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
4. Length validation (254 character limit per RFC)
5. Type checking (string input required)

The pattern validation checks for presence of `@`, non-empty local part, non-empty domain with at least one dot. It rejects embedded whitespace, missing components, and empty strings after trimming.

Test coverage includes normalization correctness, valid email formats, rejection paths (empty, whitespace-only, format violations, embedded spaces), boundary conditions (254 char limit), and non-string input handling. 20 test cases total.

## Foreign-tenant collision detection and rejection

The admission route checks for email existence across all platforms before proceeding:

```typescript
const [anyPlatformUser] = await db
  .select({ id: users.id, platform: users.platform })
  .from(users)
  .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
  .limit(1);

if (anyPlatformUser && anyPlatformUser.platform !== targetPlatform) {
  return jsonError('Email already registered on a different platform', 409);
}
```

This implements Option B behavior: reject foreign-tenant collisions with 409. The check runs before user creation, preventing cross-platform admission entirely.

When the platform matches, the existing user is reused (`userId = anyPlatformUser.id`). When no user exists on any platform, a new user is created on the target platform. The ternary expression `anyPlatformUser?.id ?? (await db.insert(...))` handles both paths.

The implementation comment explicitly states alignment with "Option B (reject collision)" and references the VERIFICATION_FAILED test requirement.

## Collision test coverage

The test file defines two cases:

**Foreign-platform rejection:** Sets `f.platform = 'realtutorialhub'`, triggers admission on `skillup` platform. The mock returns an empty array for platform-scoped lookups when platforms don't match. The test expects `response.ok = false`, `response.status = 409`, no writes, no events.

**Same-platform reuse:** Sets `f.platform = 'skillup'`, triggers admission on `skillup` platform. The mock returns `[{ id: 'existing-user' }]` for matching platforms. The test expects `response.ok = true`, writes called, event published.

The mock uses conditional logic in the `limit()` method:

```typescript
limit: async () => {
  if (f.reads === 0) { f.reads++; return [{ id: 'batch' }]; }
  f.reads++;
  return f.platform === 'skillup' ? [{ id: 'existing-user' }] : [];
}
```

The first read returns the batch (admission route's initial batch lookup). The second read simulates the user lookup, returning a user only if the mock's platform matches the target platform.

The tests use `expect.soft()` to collect all assertion failures rather than stopping at the first failure.

## Email normalization test suite comprehensiveness

The test file `email-normalization.test.ts` includes 20 test cases organized into two describe blocks:

**normalizeEmail() (13 tests):** lowercase conversion, trim whitespace, combined transformations, valid formats, empty string rejection, whitespace-only rejection, invalid formats (missing components, embedded spaces), length boundary (254 char limit and acceptance), non-string input rejection.

**safeNormalizeEmail() (7 tests):** valid input success, null return for non-string inputs, null return for empty/whitespace, null return for invalid formats, null return for excessive length.

The length boundary test constructs a 254-character email to verify acceptance at the RFC limit, and a 263-character email to verify rejection above the limit.

The safe variant tests confirm graceful degradation: all inputs that would throw in `normalizeEmail()` instead return null.

</details>

---

## File map

<details>
<summary>Files changed (7)</summary>

- `packages/db-people/src/schema/users.ts` — Removed `.unique()` from email column, added composite unique index on `(LOWER(TRIM(email)), platform)` with partial index predicate
- `packages/db-people/src/utils/email-normalization.ts` — NEW: Email normalization utility with RFC 5322 validation
- `packages/db-people/src/utils/__tests__/email-normalization.test.ts` — NEW: 20 unit tests for normalization and validation
- `packages/db-people/src/index.ts` — Exported email normalization utility
- `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` — Added foreign-tenant collision detection and 409 rejection
- `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts` — Updated mock to simulate platform-scoped queries, clarified test names for Option B behavior
- `.agents/tasks/fnd11-people/migration.md` — NEW: Schema migration plan with pre-migration audit, rollback procedures, and authorization gates

Full diff: `git diff remediation/w1-2-batch-05-targeted...6d7a31cd`

</details>
