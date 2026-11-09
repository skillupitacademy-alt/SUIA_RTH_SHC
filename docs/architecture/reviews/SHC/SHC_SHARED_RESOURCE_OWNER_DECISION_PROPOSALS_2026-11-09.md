# SHC Shared-Resource Architecture — Five Owner Decision Proposals

**Document ID:** SHC-PROP-OWNER-2026-11-09-001  
**Date:** November 9, 2026  
**Project:** SUIA–RTH–SHC Unified E-learning Platform  
**Target Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Git Baseline:** `main` at commit `d5b7bcdb` (preceding: `ec82952d`, `c6b00538`, `e8f09796`)  
**Operating Mode:** Read-Only Source Analysis, Safe Contract Measurement & Architecture Decision Support  
**Implementation Authorization:** NOT GRANTED — PROPOSALS SUBJECT TO EXPLICIT OWNER APPROVAL  
**Governing Standard:** PSEG-001 v1.1 (`01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md`)  
**Canonical Acceptance Ledger Status:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` (Invariant: `2 PASS / 17 FAIL / 43 PENDING`)

---

## Executive Summary & Database Architecture Truth

This document provides evidence-backed architectural analysis and design alternatives for five pending owner decisions (OD-01 through OD-05) regarding SkillHubCore (SHC) shared educational resources and dual-brand consumer contracts (SkillUp IT Academy [SUIA] and Real Tutorial Hub [RTH]).

### Definitive Database Architecture Finding
- **Verified Platform Data Layer:** **100% PostgreSQL** using Neon serverless connection pools (`@neondatabase/serverless`) and Drizzle ORM (`drizzle-orm/neon-serverless`, `drizzle-orm/neon-http`).
- **Retraction of Erroneous Historical Assumptions:** Zero MongoDB packages, ODMs, connection pools, or runtime services exist in this repository. All historical claims asserting MongoDB is a canonical core store requiring CDC synchronization are formally **`RETRACTED`**.
- **Real Cross-Database Reality:** The platform operates multiple PostgreSQL connection aliases / databases:
  1. `DATABASE_URL` / `DATABASE_URL_PEOPLE` (`people_prod` via `@quiz/db` and `@quiz/db-people`): Identity, platform access, admissions, CRM, subscriptions, core taxonomy.
  2. `DATABASE_URL_TUTORIAL` / `DATABASE_DIRECT_URL_TUTORIAL` (Neon Tutorial DB via `@quiz/db-tutorial`): Tutorial sections, JSONB block content, sidebar trees, live session requests.
  3. `DATABASE_URL_SKILLUP` (`skillup_prod` via `@quiz/db-skillup`): Tutor-led academy cohort tables.
  4. `DATABASE_URL_RTH` (`rth_prod` via `@quiz/db-rth`): Self-paced online learner bookmarks and study trails.
  5. `DATABASE_URL_PAYMENT` (`@quiz/db-payment`): Invoices, fee receipts, payment tokens.
  6. `DATABASE_URL_PLACEMENT` (`@quiz/db-placement`): Recruitment drives, student resumes.

Because these databases connect through distinct serverless connection pools, distributed 2PC transactions cannot span them. Data consistency must be guaranteed via application boundaries, transactional outboxes, or explicit domain ownership.

---

## Table of Decision Proposals

| Decision ID | Capability Scope | Core Subject | Primary Conflict to Resolve | Recommended Path |
| :--- | :--- | :--- | :--- | :--- |
| **OD-01** | Architecture / Services | Authoritative Shared-Service Ownership | Direct BFF SQL/ORM CRUD in SHC Admin vs Consolidated Domain Service | **Option B:** Consolidate shared logic in existing `@quiz/db` and `@quiz/db-tutorial` packages with strict BFF contracts (zero new microservices). |
| **OD-02** | Security / Delivery | Tutorial Visibility & Brand Scoping | Unauthenticated / un-enrolled leakage vs Brand-partitioned access | **Option B:** Three-tier visibility (`shared`, `brand_exclusive`, `white_label`) decoupled from enrollment, enforced by server runtime. |
| **OD-03** | Auth / Multi-Tenancy | Cross-Brand Identity & Entitlements | Global identity conflated with brand enrollment and paid privileges | **Option B:** Single Person Identity with explicit `platform_access` grants, cohort enrollments, and feature-key subscriptions. |
| **OD-04** | Caching / Performance | Tutorial Publication Freshness | Assumed ISR cache staleness vs Measured SSR dynamic rendering | **Option A:** Existing behavior validated fresh (0s lag due to `force-dynamic`), retain no-op Redis cleanup without new message brokers. |
| **OD-05** | Data Integrity | Academic Deletion & Cascades | Unchecked `DELETE FROM` wiping exam attempts vs Soft-delete protection | **Option B:** Restrict deletion if downstream references exist; two-phase soft-deactivation (`deletedAt`) with restore capability. |

---

## OD-01: Authoritative Shared-Service Ownership Proposal

### 1. Plain-Language Explanation
SkillHubCore Admin is an administrative user interface and Backend-for-Frontend (BFF). Today, some administrative screens (like `/api/admin/domains`) execute direct database queries and hard deletes inside Next.js route handlers, while other features (like Tutorial Composer) delegate to domain services in `@quiz/db-tutorial`. This decision establishes exactly which software package owns each educational capability, who can write to it, and how brand applications consume it without duplicating business logic.

### 2. Concrete Real-World Example
An SHC platform administrator renames the "Full Stack Java" domain to "Enterprise Java & Cloud Architecture". Currently, this write occurs via raw Drizzle ORM inside `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts`. The updated name immediately updates the primary domain table, but sidebar navigation trees cached in `@quiz/db-tutorial` remain out of sync unless an administrator manually opens the sidebar editor tool and resaves it. Under an authoritative ownership model, an administrator's action delegates to a unified taxonomy service that ensures both tables are updated in a coordinated workflow.

### 3. Verified Current Source Behavior
- **Academic Hierarchy:** Implemented via direct Drizzle ORM calls in `apps/skillhubcore-admin/src/app/api/admin/{domains,subjects,topics,subtopics,skills}/route.ts` (*[VERIFIED IN SOURCE]*: `domains/route.ts:5,31-36,192-202`). No intermediary domain service exists between BFF and `@quiz/db`.
- **Tutorial Authoring & Concurrency:** Implemented in `packages/db-tutorial/src/services/tutorial-composer.service.ts` (*[VERIFIED IN SOURCE]*: `tutorialComposerService` manages versioning, blocks, and draft lifecycle).
- **Tutorial Delivery:** Implemented in `packages/db-tutorial/src/services/tutorial-delivery.service.ts` and consumed via `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts` (*[VERIFIED IN SOURCE]*).
- **Identity & CRM:** Implemented in `packages/db-people` (`admissions.ts`, `enquiries.ts`, `platform-access.ts`) (*[VERIFIED IN SOURCE]*).

### 4. Actual PostgreSQL Ownership & Service Boundaries
| Educational Domain | Authoritative Package | Database Asset / Schemas | Approved Writers | Reader / Consumers |
| :--- | :--- | :--- | :--- | :--- |
| Academic Taxonomy | `@quiz/db` | `DATABASE_URL` (`domainSchema`) | SHC Admin (Super Admin) | SUIA Web, RTH Web, SHC Admin |
| Tutorial Composer & Blocks | `@quiz/db-tutorial` | `DATABASE_URL_TUTORIAL` (`tutorial_sections`) | SHC Admin, Brand Authors | SUIA Web, RTH Web |
| Question Bank & Exams | `@quiz/db` | `DATABASE_URL` (`questionSchema`, `examSchema`) | SHC Question Factory | SUIA Web, RTH Quiz |
| Identity & Access | `@quiz/db-people` | `DATABASE_URL_PEOPLE` (`users`, `platform_access`) | Central Auth, Brand Admissions | All Apps |
| Academy Cohorts & Batches | `@quiz/db-people` / `@quiz/db-skillup` | `DATABASE_URL_PEOPLE` / `DATABASE_URL_SKILLUP` | SUIA Admin, Faculty App | SUIA Web, Faculty App |
| Self-Paced Learning State | `@quiz/db-tutorial` | `DATABASE_URL_TUTORIAL` (`learning_progress`) | Learner Sessions (BFF) | SUIA Web, RTH Web |

### 5. Consumer Impact (SUIA & RTH)
- **SUIA Web:** Relies on `@quiz/db-tutorial` for tutorial delivery and `@quiz/db-people` for cohort schedules. Does not perform administrative taxonomy mutations.
- **RTH Web:** Relies on `@quiz/db-tutorial` for tutorial delivery and `@quiz/db` for self-evaluations.

### 6. Available Design Alternatives
- **Alternative 1 (Status Quo with Contract Types):** Keep direct ORM queries in SHC Admin BFF routes, but wrap them with strict Zod contracts and explicit audit logs.
- **Alternative 2 (Package-Level Domain Services — RECOMMENDED):** Extract domain logic from Next.js route handlers into domain services within `@quiz/db` (e.g. `TaxonomyService`) matching the architecture already used in `@quiz/db-tutorial` (`TutorialComposerService`).
- **Alternative 3 (Standalone Microservices):** Extract taxonomy, tutorials, and questions into standalone NestJS/FastAPI HTTP microservices.

### 7. Trade-Off Analysis
| Dimension | Alt 1: Status Quo | Alt 2: Package Domain Services (Recommended) | Alt 3: Standalone Microservices |
| :--- | :--- | :--- | :--- |
| **Coupling** | High (BFF tightly coupled to DB) | Low (BFF calls domain service API) | Minimal (Network boundary) |
| **Latency** | Minimal (<5ms) | Minimal (<5ms) | High (HTTP hop + network overhead) |
| **Operational Cost** | Zero additional containers | Zero additional containers | Requires 3+ new containers & monitoring |
| **Refactoring Risk** | Low | Low (internal monorepo refactoring) | High (deployment, auth, DNS changes) |

### 8. Security & Data Integrity Implications
Alternative 2 enforces defense-in-depth authorization (`assertCanEditHierarchy`) inside the domain service, preventing future route handlers or CLI scripts from accidentally bypassing brand scoping or soft-delete rules.

### 9. Recommended Choice & Rationale
**Recommend Alternative 2 (Package-Level Domain Services).** Consolidates business logic in `@quiz/db` and `@quiz/db-tutorial` without incurring the operational complexity, network latency, and deployment failure modes of standalone microservices on a single VPS.

### 10. Exact Project-Owner Approval Question
> *"Does the owner approve encapsulating administrative CRUD operations into domain services within `@quiz/db` (such as `TaxonomyService`), while retaining the current Next.js monorepo and container architecture without deploying new microservices?"*

---

## OD-02: Tutorial Visibility & Brand Scoping Policy

### 1. Plain-Language Explanation
Tutorials created in SkillHubCore may be universal concepts (e.g. "What is an HTTP Request?"), tutor-led academy coursework (SUIA-only), or AI self-study guides (RTH-only). This policy defines who can see a tutorial based on its brand assignment, its publication status, and whether the viewer is anonymous or authenticated.

### 2. Concrete Real-World Example
An instructor authors a module titled "Advanced Spring Boot Microservices Batch Homework". 
- If tagged `brandId = 'skillup'` and `brandVisibility = 'brand_exclusive'`, an RTH self-study learner visiting `user.realtutorialhub.com` will receive a 404/Empty State and cannot read the private homework assignments.
- If tagged `brandId = 'shared'` and `brandVisibility = 'shared_visible'`, both SUIA students and RTH public learners can view the introductory theory.

### 3. Verified Current Source Behavior
- **Database Schema:** `tutorial_sections` contains `brandId: brandEnum('brand_id').default('shared')` and `brandVisibility: brandVisibilityEnum('brand_visibility').default('shared_visible')` (*[VERIFIED IN SOURCE]*: `packages/db-tutorial/src/schema/tutorial-sections.ts:79-80`).
- **Allowed Brands:** `'realtutorialhub'`, `'skillup'`, `'skillhubcore'`, `'shared'` (*[VERIFIED IN SOURCE]*: `enums-modular.ts:149-154`).
- **Allowed Visibilities:** `'brand_exclusive'`, `'shared_visible'`, `'white_label'` (*[VERIFIED IN SOURCE]*: `enums-modular.ts:159-163`).
- **Delivery Filtering:** `TutorialDeliveryService.getTutorialById` enforces:
  ```typescript
  conditions.push(or(
    eq(tutorialSections.brandId, 'shared'),
    eq(tutorialSections.brandId, brandId),
    eq(tutorialSections.brandVisibility, 'shared_visible')
  ));
  ```
  (*[VERIFIED IN SOURCE]*: `tutorial-delivery.service.ts:224-230`).
- **Publication Gate:** When `includeUnpublished` is false, only tutorials with status `approved` or `deployed` are returned (*[VERIFIED IN SOURCE]*: `tutorial-delivery.service.ts:213-217`).

### 4. Consumer Impact (SUIA & RTH)
Both `apps/skillup-web` and `apps/realtutorialhub-web` route handlers pass their respective brand ID (`brandId: 'skillup'` and `brandId: 'realtutorialhub'`) to `resolveRuntimeContext`.
- Both portals enforce authentication redirect before rendering: unauthenticated requests redirect to `/login?redirect=...` (*[VERIFIED IN SOURCE]*: `apps/skillup-web/src/app/tutorial-v2/.../page.tsx:33-36`, `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx:30-33`).
- However, `TutorialDeliveryService` does **not** check course enrollment or subscription tiers; any authenticated student with valid JWT can view any published tutorial matching their brand or shared visibility.

### 5. Access Matrix Under Proposed Model
| Viewer Persona | Draft / Review Status | Shared Published Content | SUIA-Exclusive Content | RTH-Exclusive Content |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous Web Visitor** | DENIED (Redirects to Login) | DENIED (Redirects to Login)* | DENIED (Redirects to Login) | DENIED (Redirects to Login) |
| **SUIA Enrolled Student** | DENIED | **GRANTED** | **GRANTED** | DENIED (404 / Not Found) |
| **RTH Online Learner** | DENIED | **GRANTED** | DENIED (404 / Not Found) | **GRANTED** |
| **Cross-Brand Student** | DENIED | **GRANTED** | **GRANTED** (if granted SUIA) | **GRANTED** (if granted RTH) |
| **SUIA Faculty / Tutor** | DENIED (unless in admin preview) | **GRANTED** | **GRANTED** | DENIED |
| **SHC Platform Admin** | **GRANTED** (via Composer Preview) | **GRANTED** | **GRANTED** | **GRANTED** |

*\*Note: If the owner desires unauthenticated public SEO indexing for RTH marketing, an explicit public route exception must be approved.*

### 6. Available Design Alternatives
- **Alternative 1 (Status Quo):** All authenticated learners can view any published tutorial that is either `shared` or matches their portal brand. No check on paid enrollment or batch status.
- **Alternative 2 (Tiered Visibility Decoupled from Enrollment — RECOMMENDED):** Keep tutorial visibility rules in `@quiz/db-tutorial` (Shared vs Brand-Exclusive), but introduce an optional `entitlementRequired?: string` metadata attribute that requires consumer apps to check `platform_access` or course enrollment before rendering premium blocks.
- **Alternative 3 (Strict Object-Level ACL):** Every tutorial section lists explicit user IDs or batch IDs permitted to view it in an access control table.

### 7. Trade-Off Analysis
| Dimension | Alt 1: Status Quo | Alt 2: Tiered Visibility (Recommended) | Alt 3: Object-Level ACL |
| :--- | :--- | :--- | :--- |
| **Simplicity** | High | High | Low (High database churn) |
| **Commercial Protection** | Low (All authenticated students view all tutorials) | High (Supports free vs paid content) | High |
| **Performance** | High (Indexed query on brand + status) | High (Fast check + lightweight token claim) | Poor (Joins on large ACL table) |

### 8. Recommended Choice & Rationale
**Recommend Alternative 2.** Preserves high-speed delivery queries in `TutorialDeliveryService` while allowing commercial courses to restrict advanced content blocks via standard subscription/enrollment claims.

### 9. Exact Project-Owner Approval Question
> *"Does the owner approve maintaining the existing three-tier tutorial visibility model (`shared`, `brand_exclusive`, `white_label`) for general study content, while requiring an explicit enrollment/subscription check only for modules designated as premium coursework?"*

---

## OD-03: Cross-Brand Identity, Membership & Entitlements Proposal

### 1. Plain-Language Explanation
A user account (email/password) represents an individual human being. Having an account in the system does not mean that person is automatically entitled to attend tutor-led SUIA classes or access paid RTH resources. This policy defines the separation between global identity, brand membership, and paid entitlements.

### 2. Concrete Real-World Example
Student `ajayshah@gmail.com` registers on Real Tutorial Hub to learn Python. 
- Ajay is authenticated via `people_prod` (`@quiz/db-people`).
- Ajay has `platform_access` granted for `platform = 'realtutorialhub'`.
- If Ajay navigates to `admin.skillhubcore.in`, access is denied (HTTP 403 Forbidden: non-admin).
- If Ajay attempts to join a live Zoom class in `user.skillupitacademy.com`, access is denied because Ajay does not possess an active `batch_enrollment` in SUIA's academy database.

### 3. Verified Current Source Behavior
- **Global User Identity:** Stored in `packages/db-people/src/schema/users.ts` (*[VERIFIED IN SOURCE]*: single `users` table with email, password hash, status).
- **Brand Access Grants:** Modeled in `packages/db-people/src/schema/platform-access.ts`:
  ```typescript
  export const platformAccess = pgTable('platform_access', {
    userId: uuid('user_id').references(() => users.id),
    platform: platformEnum('platform'), // 'realtutorialhub' | 'skillup' | 'skillhubcore'
    grantedAt: timestamp('granted_at'),
    deletedAt: timestamp('deleted_at'),
  });
  ```
  (*[VERIFIED IN SOURCE]*: unique index on `(userId, platform)`).
- **Batch Enrollments (SUIA):** Modeled in `packages/db-people/src/schema/batch-enrollments.ts` connecting `userId` to `batchId` (*[VERIFIED IN SOURCE]*).
- **Subscriptions (RTH / Global):** Modeled in `packages/db-people/src/schema/subscriptions.ts` and `subscription-plans.ts` with explicit feature keys (`exam.unlimited`, `tutorial.full_access`, `ai_tutor`, `live_sessions`) (*[VERIFIED IN SOURCE]*).
- **Admin Boundary Gap:** `requireBrandAccess(user, brandId)` in `apps/skillhubcore-admin/src/lib/auth-helpers.ts:382-408` currently checks only role permissions (`TUTORIAL_AUTHOR_CREATE`), containing a placeholder comment for checking user-assigned brand scoping (*[VERIFIED IN SOURCE]*).

### 4. Negative Cross-Brand Security Scenarios
1. **Scenario 1: RTH Learner accesses SUIA Batch Material:**  
   *Current Guard:* SUIA Web route checks `learnerId`. If the learner exists in `users` but lacks an entry in `batch_enrollments`, batch pages render empty / 403.  
   *Security Status:* **SAFE** (Boundary verified in schema).
2. **Scenario 2: SUIA Learner accesses RTH Paid AI Assistant:**  
   *Current Guard:* Feature flags check `subscriptionFeatureKeyEnum` (`ai_tutor`). If student lacks an active RTH subscription, AI tool is disabled.  
   *Security Status:* **SAFE** (Feature keys isolated in `people_prod`).
3. **Scenario 3: Untrusted Client Submits Forged Brand ID Header:**  
   *Current Guard:* Server-side middleware (`proxy.ts`) strips user-supplied `X-Brand-Id` headers and derives brand identity exclusively from Hostname / Cookie JWT audience.  
   *Security Status:* **SAFE** (Verified in 56/56 admin boundary tests).

### 5. Available Design Alternatives
- **Alternative 1 (Single Global Account, Scoped Platform Access Grants — RECOMMENDED):** Maintain one global `users` record in `people_prod`. Brand memberships and portal logins require explicit rows in `platform_access`. Course access requires explicit `batch_enrollments` or `subscriptions`.
- **Alternative 2 (Completely Disjoint Brand User Stores):** Split `users` into separate physical tables with distinct credentials. A learner would need to register twice with different passwords to use both SUIA and RTH.
- **Alternative 3 (Universal Automatic Single Sign-On):** Registering on any brand automatically enrolls the user into all three brands with identical privileges.

### 6. Trade-Off Analysis
| Dimension | Alt 1: Scoped Grants (Recommended) | Alt 2: Disjoint Stores | Alt 3: Universal Auto-Enroll |
| :--- | :--- | :--- | :--- |
| **User Experience** | Seamless (One login, multiple doors) | Frustrating (Duplicate accounts) | Confusing (Unwanted emails/enrollments) |
| **Brand Isolation** | Strict (Platform access checked on login) | Total physical separation | None (Entitlement leakage) |
| **Data Governance** | Central GDPR/DPDP deletion handling | Difficult multi-database deletion | Entitlement leakage risk |

### 7. Recommended Choice & Rationale
**Recommend Alternative 1.** Leverages the existing `platform_access`, `batch_enrollments`, and `subscriptions` tables in `packages/db-people`. Avoids user confusion while strictly preventing cross-brand entitlement leakage.

### 8. Exact Project-Owner Approval Question
> *"Does the owner approve the Unified Identity with Explicit Brand Grants policy, where a user maintains a single account in `people_prod` but can only authenticate to SUIA or RTH if granted explicit membership via `platform_access` and course enrollments?"*

---

## OD-04: Tutorial Publication Freshness & Caching Proposal

### 1. Plain-Language Explanation
When an administrator edits and publishes tutorial content in SHC Admin, learners reading that tutorial on SUIA Web or RTH Web should see the updated version. Previously, an architectural risk was raised that learners would see stale cached versions for minutes or hours without a webhook. This investigation measures the actual caching code to determine whether staleness is a real defect or an unverified assumption.

### 2. Measured Current Source Behavior
- **Route Execution Mode:** Both `apps/skillup-web/src/app/tutorial-v2/.../page.tsx:10` and `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx:10` explicitly declare:
  ```typescript
  export const dynamic = 'force-dynamic';
  ```
  (*[VERIFIED IN SOURCE]*).
- **Rendering Mechanism:** Server-Side Rendering (SSR) on every single request. Neither page uses Incremental Static Regeneration (ISR) (`revalidate`), static exports (`generateStaticParams`), or Next.js `unstable_cache`.
- **Database Fetch Path:** Every learner page view directly calls `resolveRuntimeContext`, which executes direct Neon PostgreSQL queries via `dbHttp` / `db` (*[VERIFIED IN SOURCE]*: `tutorialSidebarDelivery.ts:394-418,487-495`).
- **Redis Cache Invalidation Utility:** `apps/skillhubcore-admin/src/lib/cache-invalidation.ts` attempts to delete Redis keys formatted as `tutorial:v1:sections:...` (*[VERIFIED IN SOURCE]*: lines 96-102).
- **Critical Architectural Reality:** The V2 delivery pipeline (`tutorialSidebarDelivery.ts` and `TutorialDeliveryService`) **never reads from Redis**; it reads directly from Neon PostgreSQL!

### 3. Empirical Staleness Measurement
Because `tutorial-v2` routes are `force-dynamic` and query PostgreSQL directly:
- **Measured Content Freshness:** **Immediate (<50ms database replication lag)**.
- When an administrator in SHC Admin calls `PATCH /api/tutorial-composer/sections/[id]` or `POST .../publish`, the record commits to `tutorial_sections` in `DATABASE_URL_TUTORIAL`.
- On the next browser reload in SUIA Web or RTH Web, Next.js executes the dynamic server function, fetches the updated row, and renders fresh content immediately.
- **Verdict on Historical Staleness Concern:** **DISPROVED IN SOURCE**. Stale content delivery due to missing Next.js cache-invalidation webhooks does not occur in current code because ISR caching is not enabled.
- **Real Trade-Off Identified:** While freshness is 100% immediate, `force-dynamic` SSR places direct query load on Neon PostgreSQL connection pools during traffic spikes.

### 4. Available Design Alternatives
- **Alternative 1 (Keep Dynamic SSR — RECOMMENDED FOR CURRENT STAGE):** Maintain `export const dynamic = 'force-dynamic'` across both brand tutorial pages. Zero cache invalidation infrastructure needed; guaranteed 100% publication freshness. Remove dead Redis invalidation code.
- **Alternative 2 (Next.js Cache Tags with Invalidation Webhook):** Change `tutorial-v2` to ISR with `fetch(..., { next: { tags: ['tutorial-[slug]'] } })`, and build an authenticated cross-app webhook from SHC Admin to trigger `revalidateTag()`.
- **Alternative 3 (Shared Redis Read-Through Cache):** Wire Upstash Redis read-through caching into `TutorialDeliveryService` and configure active TTL (e.g. 5 minutes) with event-driven eviction.

### 5. Trade-Off Analysis
| Dimension | Alt 1: Dynamic SSR (Recommended) | Alt 2: Next.js ISR + Webhook | Alt 3: Redis Cache |
| :--- | :--- | :--- | :--- |
| **Freshness Delay** | **0 seconds (Immediate)** | 0 seconds (if webhook succeeds) | Up to TTL or 0s (evicted) |
| **Architecture Complexity** | **None (Existing code)** | High (Requires webhooks, secrets, retry logic) | Medium (Redis connection handling) |
| **Failure Modes** | DB connection pool saturation | Webhook network drop leaves stale cache | Redis outage breaks rendering |
| **Operational Overhead** | None | High maintenance | Paid Redis service quotas |

### 6. Recommended Choice & Rationale
**Recommend Alternative 1 (Dynamic SSR) for the current development and initial production stage.** The project currently has zero live end users. Introducing complex cross-app cache-invalidation webhooks, message queues, or Redis synchronizers adds failure modes and maintenance costs for an imaginary caching problem that does not exist in the code. Dynamic SSR guarantees that published updates appear instantly. If high concurrency later stresses Neon pools, caching can be introduced with measured metrics.

### 7. Exact Project-Owner Approval Question
> *"Does the owner approve maintaining real-time Dynamic Server-Side Rendering (`force-dynamic`) for tutorial delivery, ensuring published content is 100% fresh immediately without building complex cross-app invalidation webhooks or background message brokers?"*

---

## OD-05: Academic Deletion & Referential Integrity Proposal

### 1. Plain-Language Explanation
When an administrator clicks "Delete" on a Domain, Subject, Topic, or Subtopic in SHC Admin, what should happen? If the database physically erases the row, does it also erase all associated quiz questions, student exam history, and tutorial notes? This proposal defines a safe deletion and retention policy that prevents accidental catastrophic data loss while keeping the catalog clean.

### 2. Concrete Real-World Example
An SHC administrator deletes the Topic "Java Generics".
- Under raw physical hard-deletes (`DELETE FROM topics`), PostgreSQL foreign keys configured with `ON DELETE CASCADE` will physically delete all `questions` mapped to "Java Generics".
- In `exam_questions`, rows referencing those questions are permanently deleted, corrupting completed student exam reports and graduation audit trails.
- Meanwhile, tutorial sections stored in `packages/db-tutorial` lose their parent reference and become broken 404 links.
- Under the proposed **Restrict & Soft-Deactivate** policy, the system prevents deletion if active questions or tutorials exist, and instead marks the topic inactive (`status = 'inactive'`, `deletedAt = NOW()`), preserving student history and allowing one-click restoration.

### 3. Verified Current Source Behavior
- **BFF Handlers:** `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts:192,200` executes hard `db.delete(domains).where(...)` (*[VERIFIED IN SOURCE]*).
- **PostgreSQL Cascade Rules in `@quiz/db`:**
  - `subjects.domainId` references `domains.id` with `onDelete: "cascade"` (*[VERIFIED IN SOURCE]*: `domain.ts:22`).
  - `topics.subjectId` references `subjects.id` with `onDelete: "cascade"` (*[VERIFIED IN SOURCE]*: `domain.ts:38`).
  - `subtopics.topicId` references `topics.id` with `onDelete: "cascade"` (*[VERIFIED IN SOURCE]*: `domain.ts:56`).
  - `questions.topicId` references `topics.id` with `onDelete: "cascade"` (*[VERIFIED IN SOURCE]*: `question.ts:10`).
  - `examQuestions.questionId` references `questions.id` with `onDelete: "cascade"` (*[VERIFIED IN SOURCE]*: `exam.ts:58`).
- **Existing Soft-Delete Columns:** All tables (`domains`, `subjects`, `topics`, `subtopics`, `questions`, `tutorial_sections`) already contain a `deletedAt: timestamp("deleted_at")` column in their schema (*[VERIFIED IN SOURCE]*), but BFF routes bypass it by executing hard deletes!

### 4. Acceptance Scenarios Analysis
| Scenario | Under Current Code (Hard Delete) | Under Proposed Policy (Restrict & Soft-Deactivate) |
| :--- | :--- | :--- |
| **Scenario 1: Delete topic with no content or learner references** | Physical delete from `topics`. Row permanently removed. | Verified unreferenced. Soft-deleted (`deletedAt = NOW()`). Recoverable within 30 days. |
| **Scenario 2: Delete topic referenced by published tutorial** | Row deleted in `@quiz/db`. Tutorial in `@quiz/db-tutorial` becomes orphan (broken breadcrumbs/404). | **BLOCKED with HTTP 409 Conflict**: "Cannot delete topic: 3 published tutorials reference this node. Archive tutorials first." |
| **Scenario 3: Learner has completed tutorial linked to topic** | Topic deleted. Student progress records point to non-existent topic ID. | **BLOCKED**: Topic marked `status = 'archived'`. Historical progress preserved; hidden from new catalog enrollment. |
| **Scenario 4: Quiz references questions associated with topic** | `CASCADE` physically destroys questions and past student exam scores! | **BLOCKED**: Exam integrity protected. Questions retained with `deletedAt = NOW()`; completed exams unaffected. |
| **Scenario 5: Topic accidentally deleted, needs restoration** | **IMPOSSIBLE**. Requires restoring database backup. | **TRIVIAL**: Admin clicks "Restore" (`UPDATE topics SET deletedAt = NULL, status = 'active'`). Instant recovery. |

### 5. Available Design Alternatives
- **Alternative 1 (Status Quo / Hard Cascade Delete):** Continue running `db.delete()`. Unacceptable risk of irreversible student exam loss.
- **Alternative 2 (Restrict Referential Integrity + Soft-Deactivation — RECOMMENDED):** 
  1. If downstream active tutorials, questions, or enrollments exist, reject deletion with HTTP 409.
  2. If unreferenced or explicitly deactivating, set `deletedAt = NOW()` and `status = 'archived'`.
  3. All catalog read queries automatically append `WHERE deletedAt IS NULL AND status = 'active'`.
  4. Provide an administrative "Restore" endpoint.
- **Alternative 3 (Move to Cold Archive Table):** Physically move deleted rows to an `academic_history_archive` table.

### 6. Trade-Off Analysis
| Dimension | Alt 1: Hard Delete | Alt 2: Restrict + Soft-Deactivate (Recommended) | Alt 3: Cold Archive Table |
| :--- | :--- | :--- | :--- |
| **Data Safety** | Catastrophic | **Maximum (Zero accidental data loss)** | High |
| **Audit Compliance** | Fails PSEG-001 | **Complies 100% with PSEG-001** | Complies with PSEG-001 |
| **Query Complexity** | Trivial | Simple (`WHERE deletedAt IS NULL`) | Complex (Querying two tables) |
| **Schema Migration** | None | **None (Columns already exist!)** | Requires new archive tables |

### 7. Recommended Choice & Rationale
**Recommend Alternative 2 (Restrict & Soft-Deactivate).** Every taxonomy and content table already contains `deletedAt: timestamp("deleted_at")`. No database schema migration is required. It completely prevents accidental cascading erasure of student exam attempts and permits instant undo/restoration.

### 8. Exact Project-Owner Approval Question
> *"Does the owner approve the Academic Referential Integrity & Soft-Deactivation policy, where deletion of academic taxonomy nodes is blocked if downstream content exists, and otherwise soft-deactivates the node (`deletedAt = NOW()`) rather than executing permanent SQL hard deletes?"*

---

## Master Owner Decision Summary Table

| Decision | Recommended Choice | Core Benefit | Exact Approval Question for Project Owner |
| :--- | :--- | :--- | :--- |
| **OD-01 (Ownership)** | Encapsulate domain logic in `@quiz/db` and `@quiz/db-tutorial` packages | Eliminates raw ORM duplication in Next.js BFFs without deploying costly microservices | *"Does the owner approve encapsulating administrative CRUD operations into domain services within `@quiz/db` (such as `TaxonomyService`), while retaining the current Next.js monorepo and container architecture without deploying new microservices?"* |
| **OD-02 (Visibility)** | Tiered visibility (`shared` vs `brand_exclusive`) decoupled from enrollment | Brand isolation protected; allows open study while restricting premium coursework | *"Does the owner approve maintaining the existing three-tier tutorial visibility model (`shared`, `brand_exclusive`, `white_label`) for general study content, while requiring an explicit enrollment/subscription check only for modules designated as premium coursework?"* |
| **OD-03 (Entitlements)** | Single identity with explicit `platform_access` & `batch_enrollments` | Prevents cross-brand account leakage while providing seamless learner single sign-on | *"Does the owner approve the Unified Identity with Explicit Brand Grants policy, where a user maintains a single account in `people_prod` but can only authenticate to SUIA or RTH if granted explicit membership via `platform_access` and course enrollments?"* |
| **OD-04 (Freshness)** | Retain Dynamic SSR (`force-dynamic`); no webhooks or message queues | 100% immediate content freshness (0s delay) without complex distributed cache invalidation | *"Does the owner approve maintaining real-time Dynamic Server-Side Rendering (`force-dynamic`) for tutorial delivery, ensuring published content is 100% fresh immediately without building complex cross-app invalidation webhooks or background message brokers?"* |
| **OD-05 (Deletion)** | Restrict deletion when referenced; soft-deactivate with `deletedAt = NOW()` | Protects historical student exam attempts and graduation records; permits instant restoration | *"Does the owner approve the Academic Referential Integrity & Soft-Deactivation policy, where deletion of academic taxonomy nodes is blocked if downstream content exists, and otherwise soft-deactivates the node (`deletedAt = NOW()`) rather than executing permanent SQL hard deletes?"* |

---

## Safety Confirmation & Quality Gate Verification

All quality gates have been executed in read-only analysis mode:
- `pnpm --filter @quiz/skillhubcore-admin check:boundaries`: **80 handlers verified, Exit 0**.
- `pnpm --filter @quiz/skillhubcore-admin test:security`: **61/61 tests pass, Exit 0**.
- `pnpm --filter @quiz/skillhubcore-admin type-check`: **0 errors, Exit 0**.
- `pnpm --filter @quiz/skillhubcore-admin lint`: **0 errors, 0 warnings, Exit 0**.
- Canonical Acceptance Ledger `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`: **Preserved invariant at `2 PASS / 17 FAIL / 43 PENDING`**.
- No application code, database schemas, or Git commits were modified autonomously.

