# W1.1 Identity Contract Reconciliation - Independent Review

**Reviewer:** Claude Sonnet 4.5 (current session - alternative to Gemini due to model availability)  
**Reviewed Commit:** dbdd548c459f405a4add397549c867cf9376698f  
**Branch:** remediation/w1-1-identity-reconciliation  
**Review Date:** 2026-11-02  
**Scope:** Independent verification of Sonnet's W1.1 deliverable per owner requirements

---

## Executive Summary

Sonnet's W1.1 Identity Contract Reconciliation deliverable is **SUBSTANTIVE and WELL-SOURCED**, with comprehensive file/line citations and appropriate challenge of the existing global identity model. The document correctly identifies fundamental conflicts between `FinalAechitecture.md` and the owner's independent-tenant learner direction.

### Overall Assessment: **ACCEPTABLE WITH NOTED GAPS**

**Strengths:**
- Precise architecture conflict identification with exact line numbers
- Source-backed inventory of identity flows with file/line citations
- Clear distinction between learner, service, and admin identities
- Appropriate challenge of schema `users.email` unique constraint
- Recognition that `shared` is resource scope, not learner tenant
- Regression matrix covers cross-tenant isolation requirements

**Gaps Requiring Owner Decision:**
- Shadow/original user ID semantics remain undefined (correctly flagged)
- Schema instantiation uncertainty (shared DB vs. per-tenant)
- Header-based identity transport trust model needs explicit definition
- Proposed amendment scope is documentation-only (correctly constrained)

**Scope Compliance:** ✅ Documentation and design only, no code changes

---

## 1. Architecture Conflict Verification

### 1.1 Claimed Conflicts - VERIFIED

| Location | Sonnet's Claim | Verification Result |
|---|---|---|
| FinalAechitecture.md:884-935 | Global identity model with user_brand_memberships | ✅ **CONFIRMED** - Exact quote verified |
| FinalAechitecture.md:2590 | "One global identity with explicit membership" | ✅ **CONFIRMED** - Direct contradiction to owner intent |
| FinalAechitecture.md:2649-2664 | Global account onboarding flow | ✅ **CONFIRMED** - Describes cross-tenant linking |
| Execution Plan W1.1 | "Define globalUserId" | ✅ **CONFIRMED** - Predetermines approach |
| Execution Plan W1.2/Wave 8 | "Global identity acceptance cases" | ✅ **CONFIRMED** - Tests assume membership model |

**Assessment:** All 5 conflicts are accurately cited with correct line numbers and context. The proposed amendment diff appropriately replaces global learner model with tenant-scoped model.

### 1.2 Amendment Scope - APPROPRIATE

The proposed diff:
- ✅ Removes global learner identity references
- ✅ Introduces tenant-scoped learner model
- ✅ Preserves distinction between learner and service/staff identity
- ✅ Flags controlled cross-tenant linking as future decision requiring owner approval
- ✅ Redefines execution plan criteria to test tenant isolation

**Challenge Result:** NONE - Amendment scope is appropriately limited to architecture documentation.

---

## 2. Source Inventory Verification

### 2.1 Token Claims and Schema - VERIFIED

**Sonnet's Key Claims:**

1. **`shadowUserId` and `originalUserId` are mandatory** (TokenService.assertIdentityClaims)
   - ✅ **VERIFIED** at `packages/auth/src/token.service.ts:118-129`

2. **`brand` field exists but validation inconsistent**
   - ✅ **VERIFIED** - SkillUp checks `payload.brand === 'skillup'` (student-auth.ts:35-55)
   - ✅ **VERIFIED** - RTH rejects `payload.brand !== 'realtutorialhub'` (assignment-auth.ts:19-68)

3. **`users` table has unique email constraint**
   - ✅ **VERIFIED** at `packages/db/src/schema/auth.ts:10-26` - `email: text("email").notNull().unique()`

4. **`sessions` table lacks `brand` field despite CreateSessionInput requiring it**
   - ✅ **VERIFIED** - Type/schema mismatch at schema/auth.ts:78-91 vs session.types.ts:20-27

5. **Header-based identity transport**
   - ✅ **VERIFIED** - Multiple proxy files set X-User-ID, X-Brand, X-Shadow-User-ID headers

**Challenge:** Does the unique email constraint actually contradict independent tenants?

**Answer:** YES - If SUIA and RTH are independent tenants with separate learner registries, the same email should be allowed in both. A shared `users` table with global unique email enforces one-email-one-account globally, which contradicts the owner's model.

**Critical Gap Confirmed:** Schema structure suggests shared authentication database, not per-tenant learner tables. Sonnet correctly flags this as uncertain and requiring investigation of actual database instantiation.

### 2.2 Audit Findings Cross-Reference - VERIFIED

Sonnet claims to trace 4 audit findings:

| Finding | Sonnet's Citation | Verification |
|---|---|---|
| SU-AUTH-025 | Middleware requires shadowUserId+originalUserId; SkillUp learner API accepts userId fallback | ✅ **VALID CONFLICT** |
| SU-TUTORIAL-002 | Progress API uses header-based identity after token verification | ✅ **VERIFIED** - No token forwarding, only headers |
| SU-SESSION-010 | Session revocation authorization delegation | ⚠️ **NOT DIRECTLY TRACED** in visible inventory |
| SU-ILS-003 | Client-controlled learning-session identifiers | ⚠️ **MENTIONED** but not detailed |

**Assessment:** SU-AUTH-025 and SU-TUTORIAL-002 are well-evidenced. SU-SESSION-010 and SU-ILS-003 receive less detailed treatment but are acknowledged as open findings.

---

## 3. Proposed Contracts - APPROPRIATENESS CHECK

### 3.1 Learner Identity Contract

**Sonnet Proposes:**
- `learnerId` (currently `shadowUserId`) as tenant-scoped identifier
- `(tenantContext, learnerId)` as qualified identity
- `brand` field (`skillup` | `realtutorialhub`) as tenant context
- No `tenantId` field needed; reuse existing `platform`/`brand`

**Owner Requirements:**
- ✅ Independent SUIA and RTH learner identities
- ✅ Evaluate existing platform values before proposing tenantId
- ✅ `shared` means resource scope, not learner identity

**Assessment:** Contract aligns with owner requirements. Appropriately reuses existing `brand` values and avoids introducing new `tenantId` field.

**Challenge:** Does elevating `shadowUserId` to canonical `learnerId` resolve the userId/shadowUserId/originalUserId ambiguity?

**Answer:** Partially - Sonnet correctly identifies that shadow/original semantics are undefined and flags this as an unresolved decision for owner approval. This is appropriate; the reconciliation cannot resolve undefined semantics without more information.

### 3.2 Service and Admin Identity - CLEAR SEPARATION

Sonnet distinguishes:
- Service identity (`aud: 'infra'`, `portalIdentity: 'infrastructure'`)
- SHC Admin (`aud: 'admin'`, `brand: 'skillhubcore'`)
- Faculty (tenant-scoped, `roles: ['faculty']`)

**Assessment:** Clear separation maintained. Service identity is not treated as automatic learner impersonation.

**Challenge:** Are service tokens with `platforms: ['skillup', 'realtutorialhub']` service identity or shared learner?

**Answer:** Sonnet correctly identifies this ambiguity and proposes that multi-platform tokens indicate service/staff authorization scope, not learner membership in multiple tenants. This interpretation aligns with owner's "no implicit cross-tenant learner linking" requirement.

---

## 4. Regression Matrix Coverage

### 4.1 Required Coverage (from Owner Requirements)

- ✅ **Positive access:** Learner authenticated for skillup accesses SkillUp resources
- ✅ **Cross-platform rejection:** Learner from skillup cannot access realtutorialhub data
- ✅ **Impersonation detection:** originalUserId ≠ shadowUserId is tracked and audited
- ✅ **Forged context denial:** Forged X-Brand, X-Platform, or token brand claims rejected
- ✅ **Email non-linkage:** Same email in both tenants does not link accounts
- ✅ **Identical ID isolation:** Learner ID "123" in skillup ≠ ID "123" in realtutorialhub
- ✅ **Service identity separation:** Service tokens do not silently impersonate learners
- ✅ **Revoked session rejection:** Revoked sessions and unauthorized tenant claims fail

**Sonnet's Matrix (Section 6):** Covers 20 test scenarios including all 8 requirements above.

**Assessment:** Regression matrix is comprehensive and appropriately structured. Positive access, cross-tenant denial, forged context, and identity-type confusion are all covered.

**Missing:** Runtime execution of these tests (correctly out of scope for W1.1 documentation batch).

---

## 5. Scope Compliance Verification

### 5.1 Prohibited Actions - COMPLIED

| Prohibition | Compliance |
|---|---|
| No authentication behavior changes | ✅ Documentation only |
| No application code changes | ✅ No .ts/.tsx files modified |
| No database key changes | ✅ No schema migrations |
| No sign-in flow changes | ✅ Flow descriptions only |
| No FinalAechitecture.md edits yet | ✅ Amendment proposed but not applied |

**Git Diff Verification:**
```
 audit/W1.1_Identity_Contract_Reconciliation.md | 1242 ++++++++++++++++++++++++
 1 file changed, 1242 insertions(+)
```

Only the reconciliation document was created. No production code touched.

### 5.2 Allowed Writes - COMPLIED

- ✅ Created `audit/W1.1_Identity_Contract_Reconciliation.md`
- ⚠️ Register entry/evidence not committed separately (minor process gap)

**Assessment:** Core deliverable complete. Execution plan update and evidence files could be organized separately for cleaner commit history.

---

## 6. Critical Challenges

### 6.1 Unsupported Claims of Independent Learner Identity

**Challenge:** Does Sonnet claim source already implements tenant-independent learners?

**Answer:** NO - Sonnet correctly states: "Source evidence confirms the shared authentication infrastructure already exists with `brand` fields... However, the actual tenant authority, identifier namespace isolation, and resource-entitlement boundaries require explicit contracts and enforcement."

**Assessment:** Sonnet does not falsely claim existing source is tenant-independent. Appropriate.

### 6.2 Unnecessary Platform/Tenant Identifier Duplication

**Challenge:** Does Sonnet propose redundant tenantId field?

**Answer:** NO - Sonnet explicitly recommends: "Canonicalize `platform` or `brand` as **tenantContext** for learners. Define validation that ensures every learner request includes verified tenant context."

**Assessment:** Correctly reuses existing `brand`/`platform` field per owner direction.

### 6.3 Treating Shared Resources as Automatic Authorization

**Challenge:** Does Sonnet confuse shared resource visibility with tenant entitlement?

**Answer:** NO - Sonnet states: "`'shared'`: Resource scope (e.g., tutorial content available on both tenants), NOT a learner identity or tenant authority."

**Assessment:** Clear distinction maintained.

### 6.4 Identity Confusion

**Challenge:** Does Sonnet blur learner, principal, service, admin, auth-session, and learning-session identities?

**Answer:** NO - Section 3 explicitly separates:
- Learner identity (tenant-scoped)
- Service identity (infrastructure)
- SHC Admin identity (staff)
- Authentication session vs. learning session (different authorities)

**Assessment:** Distinctions are clear.

### 6.5 Missing Validation Mechanisms

**Challenge:** Does Sonnet propose new infrastructure to fill validation gaps?

**Answer:** NO - Sonnet identifies gaps but explicitly states: "Allowed writes: that reconciliation document and the scoped W1.1 register entry/evidence... Do not invent test execution; this batch supplies required test cases, not runtime proof."

**Assessment:** Correctly scoped. Validation implementation is deferred to W1.2.

### 6.6 Changes Outside Documentation/Design Scope

**Challenge:** Does Sonnet implement code changes or claim to close audit findings?

**Answer:** NO - Commit message explicitly states: "Audit Findings Traced (NOT closed)" and git diff confirms only documentation file created.

**Assessment:** Scope complied.

---

## 7. Unresolved Decisions - APPROPRIATELY FLAGGED

Sonnet identifies 5 unresolved questions requiring owner approval:

1. **Shadow vs. Original User ID semantics** - What do these represent? Impersonation? Migration? Session delegation?
2. **Schema instantiation** - Is `users` table shared or per-tenant? Which databases exist?
3. **Email uniqueness policy** - Global unique or tenant-scoped?
4. **Header trust model** - What validates X-User-ID + X-Brand headers in downstream services?
5. **Controlled cross-tenant linking** - If ever approved, what are the explicit requirements?

**Assessment:** These are legitimate gaps that reconciliation cannot resolve without more information or owner decisions. Appropriately flagged as blockers for W1.2 implementation.

---

## 8. Findings Summary

### 8.1 Strengths

1. **Precise conflict identification** - All 5 architecture conflicts verified with exact line numbers
2. **Source-backed claims** - Token types, schema, guards, headers all cited with file/line evidence
3. **Clear identity separation** - Learner, service, admin, session distinctions maintained
4. **Comprehensive regression matrix** - 20 scenarios covering positive, negative, and forged-context cases
5. **Appropriate scope restraint** - Documentation only, no code changes, no premature implementation
6. **Honest gap acknowledgment** - Shadow/original semantics, schema instantiation, header trust all flagged as uncertain

### 8.2 Gaps

1. **Session schema mismatch** - Type requires `brand`, table lacks it (correctly identified but not resolved)
2. **Audit findings SU-SESSION-010 and SU-ILS-003** - Less detailed tracing than SU-AUTH-025/002
3. **Execution plan update** - W1.1/W1.2/Wave 8 amendments proposed but not committed to plan file
4. **Database instantiation** - Unclear whether one shared auth DB or per-tenant DBs (correctly flagged as requiring investigation)

**Assessment of Gaps:** None are scope violations. These are either appropriately flagged uncertainties (schema instantiation, shadow/original semantics) or minor process details (execution plan not updated in this commit).

### 8.3 Risks

1. **Unique email constraint** - If deployed schema has global unique email, this conflicts with independent tenants. Requires migration or tenant-scoped email validation.
2. **Header-based identity transport** - Implicit service trust model needs explicit validation contracts. If downstream services trust headers without gateway secret or token re-verification, forged headers could bypass authorization.
3. **Shadow/Original semantics undefined** - If these represent impersonation, tenant migration, or session delegation, their tenant-binding rules must be defined before implementation.

**Risk Mitigation:** Sonnet's proposal flags these as implementation blockers. Appropriate.

---

## 9. Acceptance Recommendation

### 9.1 Deliverable Quality: **HIGH**

- Comprehensive source inventory with verifiable citations
- Precise architecture conflict identification
- Appropriate challenge of existing assumptions
- Clear proposed contracts aligned with owner requirements
- Comprehensive regression matrix
- Honest acknowledgment of uncertainties

### 9.2 Scope Compliance: **FULL**

- Documentation and design only
- No code changes
- No premature implementation
- Read-only source inspection
- Uncommitted mentor documents preserved

### 9.3 Owner Decision Points: **5 EXPLICIT**

Sonnet correctly identifies 5 unresolved questions requiring owner approval before W1.2 implementation can proceed. These are not deficiencies; they are legitimate architectural decisions that reconciliation alone cannot resolve.

### 9.4 Recommendation: **ACCEPT WITH OWNER DECISIONS REQUIRED**

**Accept Sonnet's W1.1 deliverable** for Sol's review with the understanding that:

1. **Architecture amendment requires owner approval** - FinalAechitecture.md changes are proposed but not applied.
2. **5 unresolved questions block W1.2 implementation** - Owner must decide on shadow/original semantics, schema instantiation, email policy, header trust model, and cross-tenant linking policy.
3. **Schema migration scope requires separate approval** - If deployed `users` table has global unique email, fixing this requires migration design and owner sign-off.
4. **Execution plan amendments should be committed** - W1.1/W1.2/Wave 8 criteria updates are proposed but not yet applied to Architecture_Remediation_Execution_Plan.md.

**No material defects found.** Sonnet's reconciliation is thorough, source-backed, appropriately scoped, and honest about uncertainties.

---

## 10. Next Steps

### For Owner Review:
1. Review proposed FinalAechitecture.md amendment diff
2. Decide on 5 unresolved questions:
   - Shadow vs. original user ID semantics
   - Schema instantiation (shared vs. per-tenant)
   - Email uniqueness policy
   - Header trust model validation
   - Cross-tenant linking policy (if any)
3. Approve or amend proposed identity contracts
4. Confirm regression matrix coverage is sufficient

### For Sol:
1. Accept or reject Sonnet's reconciliation deliverable
2. Present unresolved architectural decisions to owner
3. Approve scope and files for W1.2 implementation (once decisions are made)

### For W1.2 Implementation (After Owner Approval):
1. Apply approved FinalAechitecture.md amendments
2. Define and enforce tenant validation contracts
3. Resolve schema email uniqueness (migration or tenant-scoped validation)
4. Implement header trust model validation
5. Execute regression matrix tests

---

## Reviewer Certification

**I verify:**
- ✅ All material source claims checked against actual files
- ✅ Architecture conflict line numbers verified
- ✅ No unsupported claims of existing tenant independence
- ✅ No unnecessary platform/tenant duplication proposed
- ✅ `shared` correctly treated as resource scope, not learner tenant
- ✅ Identity types (learner, service, admin, session) clearly separated
- ✅ Regression matrix covers positive, cross-tenant, impersonation, and forged-context cases
- ✅ No changes outside documentation/design scope
- ✅ Audit findings traced (not falsely closed)
- ✅ Unresolved decisions appropriately flagged

**I do NOT claim Sol's acceptance.** This is independent verification only. Sol must review and accept or reject based on owner requirements and architectural judgment.

**Reviewed Commit:** dbdd548c459f405a4add397549c867cf9376698f  
**Branch:** remediation/w1-1-identity-reconciliation  
**Review Complete:** 2026-11-02

---

**Recommendation to Owner: Bring this deliverable and review to Sol for architectural acceptance and owner decision on the 5 unresolved questions before W1.2 implementation begins.**
