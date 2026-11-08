# Owner scope reset and parked work — 2026-11-08

## Owner direction

The owner directed: park the disputed invitation/outbox migration work in documentation, commit completed work, and move ahead with the intended three applications. This is a scope and scheduling decision, not a test PASS, source acceptance, migration approval or W4 authorization.

Active application scope is:

- `apps/skillup-web` — SUIA learner web.
- `apps/skillhubcore-admin` — SHC Admin.
- `apps/realtutorialhub-web` — RTH learner web.

Shared API, infrastructure, validation and database changes are eligible only when tied to a demonstrated requirement or actual user flow in these applications. SkillUp Admin provisioning is not automatically included merely because it shares this repository. Broader historical assignments remain preserved as history; their unrelated work is not an automatic prerequisite for the active three-app campaign.

## Completed work preserved

Checkout observed clean on `remediation/w1-2-batch-05-targeted` at `379d3fdf1a3fa1375be1112536d3eb5b2200e515` before this documentation change.

| Checkpoint | Preserved purpose |
| --- | --- |
| `bd4e0574da35040330a45d4631e08d1a74ed8037` | Slice 22-A source, migration registration, taxonomy and inventory work |
| `3b82781373f1531b8b96ff8a7e5d0d5611de02ae` | Prior scoped review and outstanding physical/evidence findings |
| `510e04da` | Already committed Slice 22-C harness and verification work |
| `379d3fdf1a3fa1375be1112536d3eb5b2200e515` | Already committed Slice 22-C report update |

These revisions are retained without reset, deletion or rewrite. The Slice 22-C report's results remain attributed to its author; this parking action does not independently validate its claims. No new physical tests, migrations, provider/account changes, deployment or push were executed in this action.

## Parked backlog

| Item | Disposition and reopening condition |
| --- | --- |
| `student_invitations`, people migration `0009_student_invitations.sql`, SkillUp Admin invitation issuance/redemption | PARKED. Establish an owner-approved requirement and complete UI/API/delivery/activation journey before resuming. Existing StudentCreateForm calls student creation but ignores invitation data; no redemption UI caller was found in the searched SkillUp apps. This is an incomplete feature, not a demonstrated completed learner journey. |
| `event_outbox`, tutorial migration `0030_event_outbox.sql`, related migration-execution packet | PARKED pending scope/dependency trace. Certificate/badge worker code exists in RTH; trace an actual in-scope producer and required visible outcome before deciding which migration and recovery work is necessary now. Do not declare it unused or remove durability guarantees without that trace. |
| Slice 22-D recovery-point provisioning, exact DDL execution and physical SQL qualification for those two tables | PARKED with the corresponding table work. Do not start DDL, backup-branch/provider changes or synthetic account provisioning under an old preparation recipe. |
| Table-specific Slice 22-C harness extensions and physical execution scheduling | Preserve committed tests and evidence; no further work by default until an in-scope dependency is established. General browser/auth/export checks remain eligible when attached to actual three-app flows. |

Parking does not disable already wired callers. Any existing endpoint that requires an absent table remains an integration/deployment limitation. Do not deploy or advertise that flow as ready. If the three-app trace proves it is required for a current feature, return the concrete dependency and bounded completion choices to the owner; do not silently remove a genuine safety requirement or reinstate unrelated global blockers.

## Active next work

Start with a page/component-to-behavior inventory for the three named apps, using the existing architecture plan and actual code. Each active change must identify:

1. App, real page/component and intended user action.
2. Actual UI handler, API/service/repository path and authoritative data owner.
3. Present defect or missing integration and the smallest complete correction.
4. Positive behavior, denied behavior, failure/retry behavior and visible result.
5. Relevant engineering requirements: separation of concerns, authorization/tenant ownership, shared contracts, validation, error/loading/empty states, accessibility and appropriate tests.
6. Evidence status and remaining environment dependency, without substituting helper counts for a completed journey.

Prefer completing existing required flows before introducing additional features. Use shared backend work where the trace proves it necessary. Do not create another detached table/testing campaign or broaden to unrelated apps. Preserve canonical TC/FND/G1-G9 meanings, historical failures and attribution; reclassify scope explicitly rather than converting parked items into PASS.

## Acceptance boundary

W1-W3 remains PARTIAL_ACCEPTANCE under the existing recorded decision. Parking alone does not close it or authorize W4 implementation. In-scope architecture remediation and its independent verification may continue under the owner's existing authorization. The next readiness decision must distinguish active three-app requirements, parked work, actual dependencies and unexecuted physical gates.
