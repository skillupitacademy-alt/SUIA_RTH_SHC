# SHC Shared Tutorial Publication and Tenant Delivery Verification Report

**Document ID:** SHC-TUTORIAL-PUB-DELIVERY-2026-11-09-REV2  
**Date:** November 9, 2026  
**Project:** SUIA–RTH–SHC E-learning Platform  
**Target Repository:** `skillupitacademy-alt/SUIA_RTH_SHC` (`main`)  
**Current Main Commit:** `a63a9de62fcc45d94b68973d9de9b393960d9a18`  
**Preceding Commits:** `ede318d2`, `d5b7bcdb`, `ec82952d`, `c6b00538`, `e8f09796`  
**Scope:** Mandatory Post-Implementation Correction and Independent Acceptance Repair  
**Status:** REPAIRED, TESTED & INDEPENDENT-REVIEW VERIFIED — PENDING OWNER CONFIRMATION  

---

## 1. Executive Summary & Git Commit Baseline Clarification

This report documents the resolution of critical publication atomicity, draft isolation, direct-ID delivery, and multi-tenant branding gaps identified in the Independent Review of the 30-task implementation.

### Git Status Reconciliation
- **Committed Baseline:** The implementation changes previously documented as uncommitted were committed and pushed to `main` at commit `a63a9de62fcc45d94b68973d9de9b393960d9a18` (`feat(tutorial): Implement immutable publication snapshots with draft isolation and multi-tenant delivery priority`).
- **Corrective Working Tree:** All corrective changes detailed in this report reside uncommitted in the local working tree awaiting explicit owner confirmation before any further Git actions.

### Absolute Safety Invariants
| Invariant | Status | Evidence |
| :--- | :--- | :--- |
| **Zero Autonomous Git Commit** | **COMPLIANT** | Corrective repairs remain in the unstaged working tree. No autonomous commits performed. |
| **Zero Git Push** | **COMPLIANT** | No remote push commands issued. Current remote remains at `a63a9de6`. |
| **Zero DB Migrations** | **COMPLIANT** | Pre-existing `tutorial_content_versions` table utilized with zero Drizzle schema migrations. Migration proposal documented for separate owner review. |
| **Canonical Ledger Invariance** | **COMPLIANT** | `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` strictly unchanged at **2 PASS / 17 FAIL / 43 PENDING**. |
| **Zero VPS Deployment** | **COMPLIANT** | Zero remote mutations or container deployments executed against Hostinger VPS. |

---

## 2. Independent Review Findings & Corrective Action Matrix

| Finding | Independent Review Observation | Classification | Source Files Changed | Corrective Action & Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Finding 1: Publication Atomicity & Concurrency** | `publishTutorial()` caught snapshot failures and proceeded to mark tutorials `deployed`. Unauthenticated user defaulted to fabricated UUID. | **FIXED AND TESTED** | `packages/db-tutorial/src/repositories/tutorial-section.repository.ts` | 1. Wrapped in PostgreSQL transaction with automatic rollback.<br>2. Swallowed error catch block removed.<br>3. Snapshot failure aborts deployment.<br>4. Publisher ID requires valid UUID; no fabricated UUID.<br>5. Optimistic concurrency condition (`WHERE version = section.version`) detects concurrent saves. |
| **Finding 2: Learner Delivery Consistency** | `getSingleTutorialById()` delivered editable content directly and accepted `approved` status as learner-visible. | **FIXED AND TESTED** | `packages/db-tutorial/src/services/tutorial-delivery.service.ts` | 1. Status `approved` rejected for ordinary learner delivery; only `deployed` succeeds.<br>2. Delivers frozen published snapshot from `tutorial_content_versions`.<br>3. Administrative preview explicitly separated (`preview: true`). |
| **Finding 3: Missing Snapshot Fallback Risk** | Missing snapshot fallback on deployed tutorials risked exposing editable working drafts. | **FIXED AND TESTED** | `packages/db-tutorial/src/services/tutorial-delivery.service.ts` | 1. Legacy version 1 content without snapshots safely delivered.<br>2. If `version > 1` (draft edited) and snapshot is missing, delivery refuses to fall back to draft, returning null/throwing.<br>3. Database read failures propagate instead of falling back. |
| **Finding 4: Legacy Snapshot Table Compatibility** | `tutorial_content_versions` was historically used for legacy `tutorial_content`. | **FIXED AND TESTED** | `packages/db-tutorial/src/schema/tutorial-content-versions.ts` | 1. Updated TypeScript type union to `$type<TutorialContentJSON \| TutorialDocument>()`.<br>2. JSONB column in PostgreSQL stores either document format without migration.<br>3. UUID primary keys prevent collision.<br>4. Migration design proposed for owner approval. |
| **Finding 5: Tenant SQL Isolation & Leakage** | `brandVisibility === 'shared_visible'` condition permitted cross-brand content delivery. | **FIXED AND TESTED** | `packages/db-tutorial/src/services/tutorial-delivery.service.ts` | 1. Strict SQL predicate: `WHERE (brandId = requestedBrand OR brandId = 'shared')`.<br>2. Removed `brandVisibility = 'shared_visible'` from learner delivery queries.<br>3. Competing brand content strictly excluded. |
| **Finding 6: Future-Tenant Runtime Configuration** | Theme registry alone defaulted all non-SUIA tenants to RTH branding. | **FIXED AND TESTED** | `packages/types/src/tutorial-sidebar.types.ts`<br>`src/share-branding/LearningExperience/tutorialSidebarDelivery.ts` | 1. Implemented `TENANT_REGISTRY`, `registerTenant()`, and `getTenantConfig()`.<br>2. Explicit tenant configuration: ID, Name, Short Name, Tagline, Logo, Theme, Hostnames.<br>3. `getRuntimeBrandConfig` and `themeForBrand` strictly throw on unknown tenants (zero silent fallbacks). |

---

## 3. Detailed Architectural Corrective Implementations

### 1. Atomic Publication Engine (`tutorial-section.repository.ts`)
```typescript
async publishTutorial(
  tutorialId: string,
  context?: { userId?: string }
): Promise<TutorialSection | undefined> {
  const isUuid = (val?: string) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  if (!context || !context.userId || !isUuid(context.userId)) {
    throw new Error('Publication requires a valid authenticated publisher user ID (UUID)');
  }

  const publisherId = context.userId;
  const now = new Date();

  const executeInTransaction = async (tx: any) => {
    // 1. Load section to get current content and version inside transaction
    const [section] = await tx
      .select()
      .from(tutorialSections)
      .where(and(eq(tutorialSections.id, tutorialId), isNull(tutorialSections.deletedAt)));

    if (!section) return undefined;

    // 2. Snapshot published content into tutorialContentVersions (idempotent for same version)
    const existingSnapshots = await tx
      .select({ id: tutorialContentVersions.id })
      .from(tutorialContentVersions)
      .where(
        and(
          eq(tutorialContentVersions.contentId, section.id),
          eq(tutorialContentVersions.version, section.version)
        )
      )
      .limit(1);

    if (existingSnapshots.length === 0) {
      await tx.insert(tutorialContentVersions).values({
        contentId: section.id,
        version: section.version,
        content: section.content as any,
        savedBy: publisherId,
        createdAt: now,
      });
    }

    // 3. Atomically update status to 'deployed' conditioned on exact version (optimistic concurrency)
    const [row] = await tx
      .update(tutorialSections)
      .set({
        status: 'deployed',
        publishedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(tutorialSections.id, tutorialId),
          eq(tutorialSections.version, section.version),
          isNull(tutorialSections.deletedAt)
        )
      )
      .returning();

    if (!row) {
      throw new VersionConflictError(section.version, section.version + 1);
    }

    return row;
  };

  if (typeof (this.dbInstance as any).transaction === 'function') {
    return await (this.dbInstance as any).transaction(executeInTransaction);
  } else {
    return await executeInTransaction(this.dbInstance);
  }
}
```

### 2. Direct-ID Delivery & Status Gating (`tutorial-delivery.service.ts`)
```typescript
async getSingleTutorialById(
  tutorialId: string,
  options: { brandId?: Brand | string; preview?: boolean } = {}
): Promise<DeliveredTutorial> {
  const { brandId = 'shared', preview = false } = options;

  const [rawTutorial] = await db
    .select(...)
    .from(tutorialSections)
    .where(eq(tutorialSections.id, tutorialId))
    .limit(1);

  if (!rawTutorial || rawTutorial.deletedAt) {
    throw new TutorialNotFoundError(tutorialId);
  }

  // Learner delivery: ONLY 'deployed' allowed ('approved' rejected)
  if (!preview && rawTutorial.status !== 'deployed') {
    throw new TutorialNotFoundError(tutorialId);
  }

  // Strict tenant access: exact tenant or canonical shared
  const hasAccess = rawTutorial.brandId === 'shared' || rawTutorial.brandId === brandId;
  if (!hasAccess) {
    throw new TutorialNotFoundError(tutorialId);
  }

  // Draft isolation: deliver frozen snapshot
  let contentToDeliver = rawTutorial.content;
  let versionToDeliver = rawTutorial.version;

  if (rawTutorial.status === 'deployed' && !preview) {
    const publishedSnapshot = await this.repository.getLatestPublishedVersion(rawTutorial.id);
    if (publishedSnapshot && publishedSnapshot.content) {
      contentToDeliver = publishedSnapshot.content as any;
      versionToDeliver = publishedSnapshot.version;
    } else if (rawTutorial.version > 1) {
      throw new Error(`Published snapshot missing for deployed tutorial ${tutorialId} (version ${rawTutorial.version})`);
    }
  }

  // Schema validation & content sanitization before delivery...
  ...
}
```

### 3. Future-Tenant Registry (`tutorial-sidebar.types.ts` & `tutorialSidebarDelivery.ts`)
```typescript
export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  logoUrl?: string;
  theme: BrandTutorialTheme;
  hostnames?: string[];
  isActive: boolean;
}

export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  skillup: { ... },
  realtutorialhub: { ... },
  shared: { ... },
};

export function registerTenant(config: TenantConfig): void {
  TENANT_REGISTRY[config.id] = config;
  BRAND_THEME_REGISTRY[config.id] = config.theme;
}

function getRuntimeBrandConfig(brandId: string): Pick<TutorialNavigationTree, 'brand' | 'theme'> {
  const tenant = getTenantConfig(brandId);
  if (!tenant || !tenant.isActive) {
    throw new Error(`Unauthorized or unrecognized tenant: "${brandId}". Unknown tenants cannot be delivered.`);
  }

  return {
    brand: {
      name: tenant.name,
      shortName: tenant.shortName,
      tagline: tenant.tagline,
      logoUrl: tenant.logoUrl,
    },
    theme: tenant.theme,
  };
}
```

---

## 4. Test & Verification Execution Ledger

| Test Suite / Quality Gate | Target / Command | Results | Status |
| :--- | :--- | :--- | :--- |
| **Comprehensive Behavioral Test Suite** | `pnpm --filter @quiz/db-tutorial exec vitest run src/services/__tests__/tutorial-publication-lifecycle.test.ts` | **20/20 Tests Passed** (21ms) | **PASS** |
| **TypeScript Strict Checking (@quiz/db-tutorial)** | `pnpm --filter @quiz/db-tutorial exec tsc --noEmit` | **0 Errors** (Exit 0) | **PASS** |
| **TypeScript Strict Checking (@quiz/types)** | Re-checked workspace consumers | **0 Errors** | **PASS** |
| **SHC API Boundaries Check** | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **80/80 Handlers Verified** (Exit 0) | **PASS** |
| **SHC Security Suite** | `pnpm --filter @quiz/skillhubcore-admin test:security` | **61/61 Tests Passed** (Exit 0) | **PASS** |
| **SHC Admin Type Check** | `pnpm --filter @quiz/skillhubcore-admin type-check` | **0 Errors** (Exit 0) | **PASS** |
| **SHC Admin ESLint** | `pnpm --filter @quiz/skillhubcore-admin lint` | **0 Errors / 0 Warnings** (Exit 0) | **PASS** |
| **RTH Web Type Check** | `pnpm --filter @quiz/realtutorialhub-web type-check` | **0 Errors** (Exit 0) | **PASS** |
| **SUIA Web Type Check** | `pnpm --filter @quiz/skillup-web type-check` | Pre-existing optional route parameter issue in unrelated `api/faculty` and `api/programs` routes (`req?: NextRequest`). Tutorial delivery routes pass. | **DOCUMENTED** |
| **Knowledge Graph Synchronization** | `graphify update .` | **36,718 nodes, 87,335 edges indexed** (Exit 0) | **PASS** |

### Executed Behavioral Test Cases (20/20 Passing)
1. `✓ rejects publication when service context or userId is missing`
2. `✓ rejects publication when userId is not a valid UUID (no fabricated UUID substitution)`
3. `✓ executes atomic snapshot and status update in transaction`
4. `✓ re-publishing unchanged version is idempotent and does not create duplicate snapshots`
5. `✓ returns undefined if tutorial does not exist or is soft-deleted`
6. `✓ rolls back and throws when snapshot insertion fails`
7. `✓ detects concurrent edits during publication and aborts with VersionConflictError`
8. `✓ Save as Draft on already deployed tutorial increments draft version without altering published snapshot`
9. `✓ ordinary learner delivery retrieves frozen snapshot from tutorial_content_versions`
10. `✓ re-publishing promotes the new version snapshot to learners`
11. `✓ status approved is rejected for ordinary learner access in getSingleTutorialById`
12. `✓ legacy deployed tutorial at version 1 without snapshot safely delivers version 1 content`
13. `✓ deployed tutorial with version > 1 whose snapshot is missing refuses to leak draft content`
14. `✓ exact tenant-specific published tutorial takes precedence over shared canonical fallback`
15. `✓ falls back to canonical shared content when no tenant-specific override exists`
16. `✓ strictly denies cross-brand delivery even if brandVisibility was marked shared_visible`
17. `✓ resolves SUIA and RTH identities and themes cleanly`
18. `✓ registers a dynamic future tenant with full branding and runtime configuration`
19. `✓ unrecognized tenant throws error and never silently defaults to SUIA or RTH`
20. `✓ database connection logging must never output raw connection strings or secrets`

---

## 5. Owner Decision Gates & Blocked Migration Proposals

The following architectural proposals are submitted for separate owner approval:

### Proposal A: Dedicated V2 Publication Snapshot Table
- **Context:** The current zero-migration solution safely utilizes `tutorial_content_versions` with JSONB payloads.
- **Proposed Future Schema:**
  ```sql
  CREATE TABLE tutorial_section_published_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES tutorial_sections(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    document JSONB NOT NULL,
    published_by UUID NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_section_published_version UNIQUE (section_id, version)
  );
  CREATE INDEX idx_section_published_lookup ON tutorial_section_published_snapshots (section_id, version DESC);
  ```
- **Migration Status:** **REQUIRES OWNER APPROVAL** (Gated; no migrations executed).

### Proposal B: Historical Deployed Tutorial Backfill
- **Context:** Deployed tutorials with `version = 1` are served via legacy compatibility.
- **Proposed Backfill:** One-time migration backfilling existing version 1 records into `tutorial_content_versions`.
- **Backfill Status:** **REQUIRES OWNER APPROVAL** (Gated; no production backfill executed).
