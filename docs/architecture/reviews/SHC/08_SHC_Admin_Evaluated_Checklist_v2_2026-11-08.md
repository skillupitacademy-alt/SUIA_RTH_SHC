# SHC Admin — Evaluated Acceptance Checklist v2 (Phase 1 + Phase 2 source evidence)

**Source commit:** `4207cb1ca11abc29ca263310f5a4d54b859cd77f` (branch HEAD reverified 2026-11-08). **No execution performed.**

This version preserves the original 62 criteria and adds deeper source evidence. `FAIL` means a criterion has a demonstrated source-level violation. `PENDING` means compliance is not yet established. **No item is marked PASS** because meaningful runtime/integration verification has not been executed. Source-confirmed safeguards are listed separately; do not confuse them with runtime PASS.

### Reassessment from Phase 1

- `SHCA-F14`: PENDING → **FAIL**. The tutorial save/PATCH/service path omits an expected version; see SHCA-017 in the [Phase 2 deep source report](07_SHC_Admin_Phase2_Deep_Source_Verification_2026-11-08.md).
- `SHCA-A06`: PENDING → **FAIL** for the same update-concurrency contract gap (not for all tutorial routes).
- `SHCA-F16`: FAIL → **PENDING**. The 945-line sidebar orchestrator has an architectural risk, but code size/complexity alone does not prove incorrect behavior. Cross-database failure cases remain untested.
- `SHCA-A07`: FAIL → **PENDING** for the same evidence-threshold correction.
- `SHCA-F23`: PENDING → **FAIL**. QuestionTable multi-select deletion triggers `batchDeleteQuestions` without a confirmation step (SHCA-020).
- `SHCA-F09`: **PENDING**. The page pair is a browser-side certificate preview/export, not an SHC-issued academic credential. This is a high-priority *design boundary*, not evidence that a separate real issuance service is absent.
- `SHCA-U11`: **PENDING**. Tests for tokens, origin, upstream proxy and tutorial hooks exist in source, but no test command was executed.

### 62-criterion evidence matrix

| Criterion | Status | Evidence / linked finding |
|---|---|---|
| `SHCA-U01` | **FAIL** | SHCA-003 |
| `SHCA-U02` | **FAIL** | SHCA-003 |
| `SHCA-U03` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-U04` | **FAIL** | SHCA-003 |
| `SHCA-U05` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-U06` | **FAIL** | SHCA-012 |
| `SHCA-U07` | **FAIL** | SHCA-001 |
| `SHCA-U08` | **FAIL** | SHCA-003 |
| `SHCA-U09` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-U10` | **FAIL** | SHCA-004 |
| `SHCA-U11` | **PENDING** | SHCA-019: tests authored, not executed |
| `SHCA-U12` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-U13` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-F01` | **FAIL** | SHCA-008 |
| `SHCA-F02` | **FAIL** | SHCA-001 |
| `SHCA-F03` | **FAIL** | SHCA-001 |
| `SHCA-F04` | **FAIL** | SHCA-005 |
| `SHCA-F05` | **FAIL** | SHCA-002 |
| `SHCA-F06` | **FAIL** | SHCA-002 |
| `SHCA-F07` | **FAIL** | SHCA-004 |
| `SHCA-F08` | **FAIL** | SHCA-007 |
| `SHCA-F09` | **PENDING** | SHCA-018: preview-only; issuance policy unverified |
| `SHCA-F10` | **FAIL** | SHCA-010 |
| `SHCA-F11` | **FAIL** | SHCA-003 |
| `SHCA-F12` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-F13` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-F14` | **FAIL** | SHCA-017 (unversioned tutorial edits) |
| `SHCA-F15` | **FAIL** | SHCA-013 |
| `SHCA-F16` | **PENDING** | SHCA-011: cross-DB sync tests not executed |
| `SHCA-F17` | **PENDING** | SHCA-017/018: SUIA/RTH content consumption not yet tested |
| `SHCA-F18` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-F19` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-F20` | **FAIL** | SHCA-006: client-only approval; other Project AI workflows pending |
| `SHCA-F21` | **FAIL** | SHCA-004 |
| `SHCA-F22` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-F23` | **FAIL** | SHCA-020: bulk question deletion lacks confirmation |
| `SHCA-F24` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-A01` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-A02` | **FAIL** | SHCA-001 |
| `SHCA-A03` | **PENDING** | SHCA-019: upstream proxy uses trusted header reconstruction; tests not run |
| `SHCA-A04` | **FAIL** | SHCA-003 |
| `SHCA-A05` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-A06` | **FAIL** | SHCA-017 (unversioned tutorial PATCH/service) |
| `SHCA-A07` | **PENDING** | SHCA-011: architecture risk; runtime evidence pending |
| `SHCA-A08` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-A09` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-A10` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-A11` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-I01` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-I02` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-I03` | **PENDING** | SHCA-019: forged-header and token tests written, not run |
| `SHCA-I04` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-I05` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-I06` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D01` | **PENDING** | SHCA-019: local commands exist but were not executed |
| `SHCA-D02` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D03` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D04` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D05` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D06` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D07` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |
| `SHCA-D08` | **PENDING** | Requires next-level component/backend review or test/runtime evidence |

### Source controls worth preserving (not PASS yet)

1. Exact SHC admin JWT audience and brand verification, role and origin checks: `src/lib/auth-helpers.ts` L66-98; `src/lib/admin-route-guard.ts` L10-91.
2. Trusted upstream header construction: `src/lib/upstream-proxy.ts`; mock-based `src/lib/__tests__/upstream-proxy.test.ts`.
3. Stale request protection in tutorial editor: `tools/tutorial-page-content/hooks/useTutorialHydration.ts` L121-380.
4. Partial database uniqueness of tutorial pages: `packages/db-tutorial/src/schema/tutorial-sections.ts` L95-107, subject to migration evidence.
5. Nonempty schema-valid document required for publish: `packages/db-tutorial/src/services/tutorial-composer.service.ts` L363-407.
6. Security and boundary test source exists, but no execution results are provided.

### Documents

- [Phase 1 full entrypoint inventory](06_SHC_Admin_Phase1_Source_Audit_2026-11-08.md)
- [Phase 2 deep source verification](07_SHC_Admin_Phase2_Deep_Source_Verification_2026-11-08.md)
- [Original 62 acceptance criterion definitions](05_SHC_Admin_Architecture_Acceptance_Checklist_v1.md)

**Current source acceptance:** 25 FAIL / 37 PENDING / 0 verified PASS / 0 N/A. **This is not a test-run result or a new independent defect count.**
