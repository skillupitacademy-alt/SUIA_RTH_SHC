# RTH Web Deferred Integration & Architecture Acceptance Handoff

**Document Version:** 1.0.0  
**Date:** November 9, 2026  
**Status:** PROPOSED ARCHITECTURAL HANDOFF — NO SOURCE CODE MUTATION  
**Primary Target Application:** `apps/realtutorialhub-web`  
**Secondary Target Application:** `apps/realtutorialhub-admin`  
**Governing Authority:** SUIA–RTH–SHC Architectural Governance Board  
**Related Baselines:**  
- GitHub Commit: `c6b005386786c5951cdcc952959f85d2c9013d8e`  
- SHC Admin Directive: `SHC ADMIN — TUTORIAL CONCURRENCY, DATA INTEGRITY & GOVERNANCE RECONCILIATION`  

---

## 1. Executive Summary & Purpose

During the execution of the SHC Admin architecture, tutorial concurrency, and governance reconciliation batch, strict operational boundaries prohibited autonomous edits to Real Tutorial Hub (RTH) source repositories (`apps/realtutorialhub-web`, `apps/realtutorialhub-admin`). 

This document serves as the **formal architectural bridge and deferred integration handoff register** from the central authoring engine (SHC Admin) to the learner delivery and brand administration portals of Real Tutorial Hub. It captures all architectural interfaces, contract dependencies, brand isolation rules, cookie considerations, and runtime gaps that must be addressed when an authorized RTH integration batch is scheduled.

> [!IMPORTANT]
> This document is strictly non-invasive. Zero lines of code in `apps/realtutorialhub-web` or `apps/realtutorialhub-admin` have been modified in this batch. All findings, contracts, and prerequisites are documented here for future implementation under explicit owner approval.

---

## 2. Concrete Deferred Item Register

| ID | Title | Target App | Category | Prerequisites | Current State | Future Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RTH-HO-001** | Learner Tutorial Delivery Hydration | `realtutorialhub-web` | Tutorial Consumption | `@quiz/types` V2 contracts | Stale V1 reader or incomplete V2 renderer integration | RTH Web reads published tutorials via `/api/tutorial-v2/` adhering to `TutorialDocumentSchema` (schemaVersion 1). |
| **RTH-HO-002** | Brand Isolation & Tenant Scoping | Both | Brand Governance | SHC Database multi-brand schema | Partial brand query parameter filtering | Hard isolation: RTH requests enforce `brandId = 'realtutorialhub'` or `brandId IS NULL` (global content). Cannot view or edit SUIA/SHC private assets. |
| **RTH-HO-003** | RTH Web Session & Cookie Isolation | `realtutorialhub-web` | Auth / Session | Shared auth helper unification | Uses learner session token without strict cookie scoping | Distinct cookie namespace (`rth_learner_token`), HTTP-only, Secure, SameSite=Lax. Independent of SHC Admin `shc_admin_token`. |
| **RTH-HO-004** | RTH Admin BFF Logout Route | `realtutorialhub-admin` | Auth / Lifecycle | RTH Admin BFF structure | Missing route at `apps/realtutorialhub-admin/src/app/api/auth/logout/route.ts` | Route implemented, performs server-side token revocation, expires cookies via `clearance: true`, returns 200 JSON. |
| **RTH-HO-005** | Optimistic Concurrency in RTH Admin Composer | `realtutorialhub-admin` | Concurrency | `expectedVersion` in `@quiz/types` | Unversioned writes risk clobbering SHC central updates | If RTH Admin authors brand-specific tutorials, all mutations must transmit `expectedVersion` and handle HTTP 409 (`VERSION_CONFLICT`). |
| **RTH-HO-006** | Dual-DB Academic Hierarchy Sync | Both | Data Integrity | PostgreSQL (Tutorial DB) & MongoDB (Core DB) | RTH queries local DB while SHC mutates central DB | Automatic change-data capture or cache invalidation ensures RTH navigation hierarchy matches SHC published state. |
| **RTH-HO-007** | Delivery Cache Invalidation Receiver | `realtutorialhub-web` | Caching / Performance | Redis / In-memory delivery cache | SHC triggers invalidation, but RTH Web has no cache bust webhook | Webhook or Redis pub/sub listener receives subtopic cache invalidation events emitted by SHC Admin authoring pipelines. |
| **RTH-HO-008** | Navigation Node URL Route Alignment | `realtutorialhub-web` | Routing / SEO | `buildPublishedTutorialUrl` contract | Discrepancy between slug routing and `navigationNodeId` URLs | RTH Web routing resolves `/[domain]/[subject]/[topic]/[subtopic]/[navigationNodeId]` with canonical metadata. |
| **RTH-HO-009** | Block Type Registry Parity | `realtutorialhub-web` | Rendering | Rich document schemas | Supports only standard markdown blocks | Full renderer support for all SHC canonical blocks: D1 (definition), C1 (code), P1 (presentation), interactive sandboxes. |
| **RTH-HO-010** | Headless Qualification Suite | Both | Verification | Port 3003 (Web) & 3002 (Admin) | No automated E2E qualification script for RTH | Automated Playwright script verifying learner read path on 3003 and admin auth/logout roundtrip on 3002. |

---

## 3. Dual-Audience Architectural Boundaries

A critical requirement of the RTH architecture is the strict separation between the public learner-facing web application and the authenticated brand administration portal:

```mermaid
flowchart TD
    subgraph Public Learner Realm [Port 3003: user.realtutorialhub.com]
        LClient[Learner Browser] --> LWeb[RTH Web App]
        LWeb -->|Read-Only Queries| BQ[BFF / Cached Delivery API]
        BQ -->|Fetch Published| TDB[(Tutorial Database)]
    end

    subgraph Brand Admin Realm [Port 3002: admin.realtutorialhub.com]
        AClient[Brand Admin Browser] --> AApp[RTH Admin App]
        AApp -->|Authenticated BFF| ABFF[/api/auth, /api/tutorial-composer]
        ABFF -->|Version-Checked Mutations| TDB
    end

    subgraph Central Super Admin [Port 3007: admin.skillhubcore.in]
        SClient[Super Admin Browser] --> SHCApp[SHC Admin App]
        SHCApp -->|Authoritative Publishing| TDB
    end
```

### Boundary Rules:
1. **Zero Secret Leakage:** `apps/realtutorialhub-web` must NEVER import administrative database connection pools, admin JWT secrets, or administrative route guards.
2. **Read-Only Enclave:** The public web application interacts exclusively with read-only published delivery endpoints (`status = 'deployed'`). It has zero capability to trigger status transitions, unversioned updates, or draft mutations.
3. **Admin Enclave:** `apps/realtutorialhub-admin` must operate behind strict origin verification, role validation (`brand_admin`), and brand scoping (`brandId = 'realtutorialhub'`).

---

## 4. Shared SHC Educational Contracts & Compatibility

RTH applications share core domain contracts located in `@quiz/types` and `@quiz/db-tutorial`. The recent SHC Admin batch established the following invariants:

1. **Document Envelope (`TutorialDocument`):**
   ```typescript
   export interface TutorialDocument {
     schemaVersion: 1;
     blocks: TutorialBlock[];
   }
   ```
2. **Optimistic Concurrency Protocol:**
   - All update schemas (`UpdateTutorialContentRequestSchema`, `AppendBlockRequestSchema`) accept `expectedVersion?: number`.
   - Any write that detects a version divergence throws `VersionConflictError`, mapped to HTTP 409 (`VERSION_CONFLICT`).
   - RTH Admin must adopt this contract to eliminate write-write race hazards with SHC Super Admins.
3. **Published URL Structure:**
   - Canonical format: `https://user.realtutorialhub.com/tutorial-v2/:domainSlug/:subjectSlug/:topicSlug/:subtopicSlug/:navigationNodeId`
   - Invariant: The final route segment is the persistent UUID `navigationNodeId`, guaranteeing permanent permalinks regardless of slug modifications.

---

## 5. Brand Isolation & Domain Separation Rules

To prevent cross-brand contamination across the multi-brand ecosystem (SHC, SUIA, RTH):

1. **Storage Isolation:** In `tutorial_sections`, the `brand_id` column isolates tenant assets:
   - `brand_id = 'skillhubcore'`: Central shared content.
   - `brand_id = 'realtutorialhub'`: RTH exclusive tutorials.
   - `brand_id = 'skillupitacademy'`: SUIA exclusive tutorials.
2. **Query Scoping:**
   - RTH Web queries: `WHERE (brand_id = 'realtutorialhub' OR brand_id IS NULL) AND status = 'deployed'`
   - RTH Admin queries: `WHERE brand_id = 'realtutorialhub'`
3. **Cross-Tenant Guard:** Attempting to update a tutorial where `tutorial.brandId !== context.brandId` must be rejected with HTTP 403 / Service `Forbidden: Brand mismatch`.

---

## 6. Authentication, Cookie & Session Considerations

Independent review identified specific session lifecycle requirements for RTH:

1. **Independent Cookie Names:**
   - Central Super Admin: `shc_admin_token`, `shc_refresh_token`
   - RTH Brand Admin: `rth_admin_token`, `rth_admin_refresh_token`
   - RTH Learner: `rth_user_token`
   *Prevent cookie clobbering across localhost subdomains (`.localhost`).*
2. **Missing BFF Logout Endpoint (`RTH-HO-004`):**
   - The RTH Admin client currently references `/api/auth/logout`.
   - File to create: `apps/realtutorialhub-admin/src/app/api/auth/logout/route.ts`.
   - Implementation requirement: Accept POST with credentials, verify CSRF/origin, invalidate refresh token in repository, set response cookies with `Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`.
3. **Lock-Screen Contract Preservation:**
   - If the shared `AdminLockScreen` is mounted in RTH Admin, it must invoke RTH Admin's native authentication endpoint (`/api/auth/reauthenticate` or `/api/auth/login`) and never redirect to SHC Admin endpoints.

---

## 7. Runtime Gaps & Future Prerequisites

Before scheduling an active implementation batch on RTH:

1. **Port Allocation Checklist:**
   - SHC Admin: `http://skillhubcore.localhost:3007` (Verified operational)
   - RTH Admin: `http://realtutorialhub.localhost:3002` (Prerequisite: verify free port & environment)
   - RTH Web: `http://realtutorialhub.localhost:3003` (Prerequisite: verify free port & environment)
2. **Environment Variables:**
   - Ensure `.env.local` in `apps/realtutorialhub-web` and `apps/realtutorialhub-admin` contains valid JWT secrets, database connection strings, and CORS whitelist entries.
3. **Cache Invalidation Channel:**
   - Implement the Redis subscriber or internal API hook in RTH Web to bust stale ISR pages when SHC Super Admin publishes new content.

---

## 8. Quality Gate Criteria for Eventual Acceptance

When an RTH batch is approved by the project owner, the following gates must be met:

- [ ] **Gate RTH-1 (Type & Boundary Integrity):** `pnpm --filter @quiz/realtutorialhub-web type-check` and `pnpm --filter @quiz/realtutorialhub-admin type-check` pass with 0 errors.
- [ ] **Gate RTH-2 (Logout BFF Contract):** Real HTTP POST to `http://localhost:3002/api/auth/logout` returns 200 and expires `rth_admin_token`.
- [ ] **Gate RTH-3 (Delivery Parity):** Real HTTP GET to `http://localhost:3003/tutorial-v2/...` successfully renders published canonical blocks (D1, C1, P1).
- [ ] **Gate RTH-4 (Concurrency Protection):** Simultaneous edit attempts on RTH Admin reject conflicting updates with HTTP 409.
- [ ] **Gate RTH-5 (Zero Hostinger VPS Drift):** All changes verified locally prior to any authorized CI/CD deployment.

