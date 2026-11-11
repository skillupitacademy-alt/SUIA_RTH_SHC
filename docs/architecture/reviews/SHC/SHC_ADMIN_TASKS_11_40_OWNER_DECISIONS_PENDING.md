# SHC Admin — Tasks 11–40 Owner Decisions Pending

**Date:** November 10, 2026  
**Status:** Actionable Decisions Required for Restricted Environments & Operations  
**Governing Standard:** Accidental Data Loss Prevention, Zero Self-Approval  

The following items are safely prepared in code, specification, and mocked test suites, but require explicit owner authorization before physical execution:

---

## 1. Remote Neon & Live Browser Smoke Execution (Tasks 36 & 37) — RESOLVED & CERTIFIED
- **Owner Decision:** Explicitly authorized by owner on November 10, 2026 ("use remote neon server use https://skillup.localhost:3009 , https://realtutorialhub.localhost:3003 and https://skillhubcore.localhost:3007 and for RTH use ajayshah@gmail.com and password is testing...").
- **Outcome:** Successfully executed in headless Chromium via Playwright (3/3 tests passed with Exit Code 0). 9 full-page evidence screenshots captured in `.evidence/screenshots/` verifying SHC Admin authoring and multi-tenant SUIA/RTH learner consumption. Zero dummy records remain. Tasks 36 and 37 are **DONE**.

---

## 2. Remote Neon DB Container Architecture (Task 39) — RESOLVED
- **Owner Decision:** Explicitly authorized by owner on November 10, 2026 ("record 39 as remote neon db implementation not local if successfully we have implemented above tasks 11-35, 38, 36, 37, 38 and 40").
- **Outcome:** Multi-stage Dockerfile, production ports, entrypoint script, and environment secrets verified for Remote Neon DB deployment architecture. Local Docker database containers waived per explicit Owner directive. Task 39 is **DONE**.

---

## 4. Quarantined Migration Policy (`0031_drop_tutorial_page_content_v2.sql.proposed`)
- **Current State:** The legacy migration `0031_drop_tutorial_page_content_v2.sql.proposed` remains quarantined and completely inactive.
- **Decision Required:** Confirm that legacy tutorial tables and columns remain untouched and that no destructive DDL migrations are executed.
- **Default Policy (Safeguard):** Quarantined migration remains inactive; zero DDL changes.

---

## 5. MainDB vs TutorialDB Coordination & Outbox Pattern
- **Current State:** MainDB row locks (`SELECT ... FOR UPDATE`) serialize concurrent transactions within MainDB. In TutorialDB, `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` run in a single atomic transaction. MainDB locks do not span physical database boundaries to TutorialDB.
- **Decision Required:** Is the current conservative deletion check (MainDB queries TutorialDB read-only and fails closed with 503 if TutorialDB is unreachable) accepted for production, or should an asynchronous outbox/reconciliation pattern be implemented in a future phase?
- **Recommendation:** Accept current fail-closed read-only verification; defer outbox pattern to a dedicated post-launch milestone.

---

## 6. User and Subscription Management Backend Integration (Tasks 17 & 18)
- **Current State:** `/users` and `/subscriptions` render truthful "currently unavailable" states without fabricating prototype CRUD actions or fake accounts.
- **Decision Required:** When user and billing services are ready, which specific user fields, roles, subscription tiers, and actions should be exposed to SHC Admin?
- **Recommendation:** Maintain honest unavailable state until an authoritative people/billing service specification is signed off by the owner.

---

## 7. Canonical Acceptance Ledger Updates (`10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`)
- **Current State:** The canonical 62-row ledger remains strictly untouched. Proposed status updates are provided in `SHC_ADMIN_TASKS_11_40_PROPOSED_LEDGER_CHANGES.md`.
- **Decision Required:** Does the owner approve applying the proposed status transitions to `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`?
- **Default Policy (Safeguard):** Zero self-approval; no modifications made to the canonical CSV file without owner confirmation.

---

## 8. Git Commit, Push, and Deployment Authorization
- **Current State:** All changes are local in the working tree.
- **Decision Required:** Does the owner approve committing and pushing these Batch C–H source and test enhancements to GitHub `main`?
- **Default Policy (Safeguard):** No git commit, push, or deployment is performed.

