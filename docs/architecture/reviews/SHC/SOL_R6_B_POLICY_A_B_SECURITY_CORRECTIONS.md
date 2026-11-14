# Policies A and B source security corrections

14 November 2026, Asia/Calcutta. Local baseline `977fe044c6aa04f3bf63ff58560ae69c941ea0a6`.

The approved reporting and administrative platform-access boundaries are corrected in existing source. Controlled verification passes 111 tests across the focused service, report, CHG-03 bridge and CHG-01B selections. The service typecheck, zero-warning lint and TypeScript build pass. Changed reporting source and tests pass zero-warning lint. Admin Next.js compilation passes in compile mode, while the subsequent application typecheck fails on five existing Next.js page/route typing errors. Full quality acceptance and PeopleDB migration remain pending.

Evidence is under `.evidence/r6-policy-ab/`. The earlier uncommitted decision-closure report and its evidence were preserved. No commit, push, checkout, pull or deployment occurred in this task. Read-only Git inspection supplied the prior source for controlled before/after tests and verified existing failing files.

## Enforced administrative contract

The mounted SSO route continues using its existing bearer-token and gateway admission. Its administrative operations now enter `SsoService.administerAccess()`. They validate the person UUID, supported action and business platform before requesting a mutation.

Inside an existing repository transaction, actor and target person rows are locked in stable UUID order. Adapters without the required locking capability fail closed. The service requires an active, undeleted current actor, an undeleted target, the actor's persisted role within the signed token's role ceiling, the existing `user.manage` permission and an active persisted own-platform grant. The token must also authorize the actor's current account platform.

The target person's account platform must equal the actor's account platform. A submitted platform must equal that same verified platform. Neither arbitrary headers, matching email nor the `super_admin` wildcard bypasses those target constraints. Disabled targets cannot receive grants, while an authorized administrator may revoke access from a disabled target.

The existing `user.manage` permission is sufficient for the approved same-platform management action. The current mechanism has no independently scoped cross-brand grant or revoked-grant restoration permission. Those operations are denied, including for a bare `super_admin` role. Future support requires an explicit owner-approved authority contract. This task adds no permission service or database field.

The PeopleDB repository's ordinary grant method now preserves an active grant and rejects a soft-deleted grant with a typed error. It no longer restores `deleted_at` implicitly. Trusted registration can still create an initial grant for its newly created person. The bridge retains its stricter existing platform/external-identity contract.

Administrative success audits are written in the same transaction as the mutation. Audit failure rolls back the mutation. Denied or unavailable operations record a sanitized outcome through the existing audit repository. HTTP errors carry generic 403/503 responses and private/no-store headers. Malformed UUIDs, actions and request bodies receive 400, and authentication admission retains its existing 401/403 behavior. Private read results expose only the administrator's verified account platform.

Current account, role and platform-grant revocation are covered by controlled tests. Complete bearer-session invalidation remains subject to the existing session mechanisms and broader auth qualification. These tests do not establish a new session-revocation guarantee.

## Reporting relationship correction

`getAdminStudentDetail()` now selects the requested undeleted `skillup` person by UUID. It follows the undeleted admission's `student_user_id`, then `admissions.enquiry_id → enquiries.id`. The counsellor is resolved from the selected enquiry's `assigned_counsellor_id` and its person/profile UUID. Deleted enquiries and deleted counsellor person rows do not supply an association.

Email is retained as contact/display data and supplies no association fallback. A missing admission or enquiry retains the empty association and `Unassigned` counsellor response. The query retrieves up to two candidate rows and raises a typed conflict when more than one eligible association is observed. The existing student-detail GET route converts that conflict to a sanitized HTTP 409. A missing or foreign-platform person follows the existing 404/absent contract.

Assigned staff relationships continue through their existing authoritative UUID reference. This correction does not invent a new staff membership rule. The report query's platform predicate prevents selecting an RTH person through this SUIA report, while the existing proxy/BFF administrative admission remains a separate boundary. The route tests exercise that admission through controlled trusted headers. Browser-to-proxy credential verification was outside this test selection.

The attendance, payment and subsequent operational query/response tail in the mixed reporting function was compared with the baseline and is byte-equivalent after line-ending normalization. Tests return controlled empty operational rows and make no live calls. No dedicated attendance/payment behavior was tested or modified.

## Exact source and test changes

| Path | Reason |
|---|---|
| `services/skillhubcore-service/src/modules/auth/sso/sso.routes.ts` | Validate inputs, invoke authorized service boundary, sanitize errors and private caching. |
| `services/skillhubcore-service/src/modules/auth/sso/sso.service.ts` | Verify current actor, existing permission, token ceiling, target scope and grant, with transactional audit. |
| `services/skillhubcore-service/src/modules/user/user.repository.ts` | Ordered person row locks and refusal of implicit revoked-grant restoration. |
| `packages/types/src/tutorial-repositories.types.ts` | Optional locking capability on the existing repository adapter contract. Runtime administrative operations require that capability. |
| `apps/skillup-admin/src/lib/skillup-admin-data.ts` | Scoped UUID joins, ambiguity detection and missing-association behavior. |
| `apps/skillup-admin/src/app/api/admin/students/[id]/route.ts` | Safe GET conflict response. Existing mutation behavior outside that correction remains as before. |
| SSO route tests | Signed-token Hono requests through the actual service and controlled persistence, including action/target denials and audit rollback. |
| Existing SSO service test | Retain initial grant/list/revoke assertions, then assert revoked-grant restoration denial under the approved policy. |
| Existing user repository test | Verify revoked grants remain denied and active grants retain lifecycle state. |
| `apps/skillup-admin/src/lib/__tests__/student-report-identity.test.ts` | Query/UUID association controls, absent/foreign person, missing association, ambiguity and admitted/denied BFF controls. |

The final manifest supplies full paths and SHA-256 values for the three test files summarized by area in this table, along with all changed production paths.

## Before/after evidence

The baseline harness loads the prior committed source at `977fe044…` through a Vite adapter. It performs no checkout or application source replacement. Two selected SSO negative cases fail against that source with `expected 200 to be 403`, proving the original cross-platform grant/revoke acceptance. The selected reporting association case also fails against the original email join. `BEFORE_RESULTS.json` records exit 1 for both selections. Other cases were excluded by the explicit test-name filters for this baseline demonstration.

With corrected source, the full selected service suite passes, including those SSO negative cases. Reporting tests pass with the new UUID joins and ambiguity response. These are controlled dependency tests. SQL generation is inspected, and transaction/rollback semantics are modeled by adapters. Physical PostgreSQL locking and rollback qualification remain pending.

| Completed check | Result |
|---|---|
| Existing auth/SSO/token/repository/middleware selection | 51 passed across 10 files, exit 0 |
| Reporting identity and existing GET boundary | 7 passed, exit 0 |
| Existing CHG-03 bridge tests | 15 passed, exit 0 |
| Existing CHG-01B helper/caller/signature tests | 38 passed, exit 0 |
| Standalone service typecheck | Exit 0 |
| Standalone service lint, zero-warning limit | Exit 0 |
| Standalone service TypeScript build | Exit 0 |
| Changed reporting source and test lint, zero-warning limit | Exit 0 |
| Next.js admin build, `--experimental-build-mode=compile --webpack` | Exit 0 |
| Admin TypeScript check after fresh generated Next types | FAIL, exit 1 |
| Final Graphify AST update | Completed receipt recorded separately |

`QUALITY_RESULTS.json` records exact commands and timestamps. `report-tests-final.exit`, `report-test-final-lint.exit`, `ADMIN_COMPILE_BUILD.json` and the final typecheck receipt cover the later targeted reruns. The initial SSO service fixture asserted restoration denial before revocation instead of after it. That test sequence was corrected and the suite rerun. Initial failure receipts remain available.

### Existing Next.js type failures

The compilation generated current Next.js route/page types and exposed these existing incompatible source signatures.

| Existing file | Generated-type error |
|---|---|
| `(admin)/audit/page.tsx` | `searchParams` uses a synchronous object where current `PageProps` expects a promise. |
| `(admin)/batches/[id]/page.tsx` | Synchronous `params` signature. |
| `(admin)/crm/enquiries/[id]/page.tsx` | Synchronous `params` signature. |
| `(admin)/students/[id]/page.tsx` | Synchronous `params` signature. |
| `api/admin/students/invite/redeem/route.ts` | Extra `hasZeroAffectedRows` route export is incompatible with generated route-module types. |

Each source was compared with `977fe044…` and is unchanged. `EXISTING_NEXT_TYPE_ERRORS.json` records that comparison. The first pre-build admin typecheck passed, while fresh generated types produce the failed post-build gate. This failure remains visible. The compile-mode build qualifies compilation only. Generation/finalization and a full production release are unqualified. The original generated `next-env.d.ts` bytes were restored after compilation.

## Compatibility and remaining gates

Same-platform administrative grant/revoke remains available only through current authority and the existing permission check. Clients previously depending on cross-brand role-only mutation, broad platform lists or implicit restoration will now receive denial. Revoked grants require a future explicit restoration contract. No existing role is assigned a new cross-brand entitlement by this patch.

CHG-03 missing-grant reconciliation still depends on a verified canonical brand account. A hard-deleted grant leaves no revocation marker and remains an operating-policy limitation. Preserve soft-deleted revocation records. Do not describe missing-row recovery as universally safe until hard-delete policy and existing records are reviewed.

The twenty broader API authentication failures remain in their separately tracked repair task. The prior baseline comparison already reproduced the same failures. Repair their fixtures/adapters against current signed subject/session, strict eligibility and last-device contracts, then rerun them. Keep production binding, revocation and tenant checks intact. This assignment did not undertake that separate repair.

PeopleDB migration also awaits the five existing Next.js type errors' disposition, shared-types lint exceptions, isolated real PostgreSQL tests, backup/restore rehearsal, `0009_student_invitations` ordering approval, exact migration review and authorized reconciliation of the three currently unlinked accounts. Actual runtime role/grant state and end-to-end browser compatibility remain pending.

Dedicated SHC authentication, CHG-01B identity naming, CHG-03 bridge source, TutorialDB tenant isolation, MainDB ownership and canonical acceptance registers retain their protected source state. Q48 remains OPEN. No database writes, schema changes, seed execution, infrastructure changes or release actions occurred.
