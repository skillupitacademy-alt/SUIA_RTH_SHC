# Authorization Architecture Audit: Authentication, Brand Context & Future Entitlement Readiness

**Audit Date:** 2026-09-06  
**Current HEAD:** `4578eb88` (Script File Added)  
**Branch:** `main` (synced with origin/main)  
**Audit Type:** STRICT READ-ONLY - No implementations  
**Purpose:** Establish architectural boundaries for current ILS fix + future free/paid without implementing entitlements

---

## STATUS: AUDIT IN PROGRESS

This document will be completed through systematic evidence gathering from the actual codebase.

## EVIDENCE GATHERING PLAN

### Phase 1: Git State ✅ COMPLETE
- Current HEAD: 4578eb88
- middleware.ts revert: Confirmed (commits 8b9537d0 added, 9a6515c3 reverted)
- No uncommitted changes to core auth files
- Recent ILS Phase 4/4.5 work clearly identified

### Phase 2: Authentication Flow (IN PROGRESS)
Need to trace for BOTH brands:
1. Login → accessToken creation
2. Cookie storage and attributes
3. JWT payload structure
4. Token verification (which methods?)
5. User identity extraction
6. Role extraction
7. Brand/platform extraction

### Phase 3: Authorization Comparison (PENDING)
Need to compare RTH vs SkillUp:
1. BFF authentication helpers (requireStudent vs requireStudentAuth)
2. Actual internal logic (not just names)
3. Role validation
4. Brand validation (exists? purpose?)
5. Platform validation
6. Any implicit entitlement checks

### Phase 4: Brand Context Analysis (PENDING)
Determine:
1. What does `brand` field in JWT represent?
2. What does `platforms` array represent?
3. How is X-Brand header determined?
4. Is brand validated for security or context?
5. Can resources be brand-specific vs shared?

### Phase 5: Resource Architecture (PENDING)
Verify:
1. tutorial_sections as canonical content
2. brandId field usage (shared vs brand-specific)
3. Resource lookup queries
4. Content delivery patterns
5. Whether duplication exists

### Phase 6: ILS Specific (PENDING)
Trace exact failure:
1. Which endpoint returns "Authentication required"?
2. Request path: Browser → ILS Provider → BFF → Central API
3. Authentication success/failure point
4. Headers present (accessToken, X-Brand, X-User-ID)
5. Database impact

### Phase 7: Security Audit (PENDING)
Evaluate:
1. Can client spoof X-Brand?
2. Is JWT signature verified?
3. Are security headers overwritten by BFF?
4. Trust boundaries

### Phase 8: Future Readiness (PENDING)
Design (not implement):
1. Where should free/paid authorization live?
2. Can it be added without redesigning auth?
3. Does brand coupling prevent this?
4. Minimum structural changes needed

---

## CRITICAL QUESTIONS TO ANSWER

### Question 1: What is Brand?

**Evidence Needed:**
- JWT payload structure from actual token
- How brand is set during login
- Whether brand is mutable or fixed
- Whether user can have multiple brands/platforms

**Hypothesis to Test:**
```
A) Brand = "User registered via RTH/SkillUp app" (Identity attribute)
B) Brand = "User accessing through RTH/SkillUp hostname" (Request context)
C) Brand = "User has RTH/SkillUp subscription" (Entitlement - WRONG)
D) Brand = "User can only access RTH/SkillUp resources" (Authorization boundary)
```

**Current Evidence:**
- RTH has NO brand validation in requireStudent()
- SkillUp HAS brand validation in requireStudentAuth()
- This suggests behavioral inconsistency that needs explanation

### Question 2: What is Authorization?

**Must Distinguish:**
```
Authentication = "Who is this user?" → userId
Role = "What type of user?" → student/admin/faculty
Brand = "???" → Needs investigation
Authorization = "Can this user do X?" → Needs clear boundary
Entitlement = "Access level" → FUTURE, not now
```

**Evidence Needed:**
- Where each boundary is enforced
- Whether they're cleanly separated
- Whether brand is accidentally serving as entitlement

### Question 3: Are Resources Shared?

**Evidence Needed:**
```sql
SELECT id, navigation_node_id, brand_id 
FROM tutorial_sections 
WHERE navigation_node_id = 'whatisjava';

-- If brand_id = 'shared' → Resource IS shared
-- If brand_id = 'skillup' → Resource is brand-specific
```

**Already Know:**
- Current "What is Java" tutorial has `brand_id: 'shared'`
- This proves shared resources CAN exist
- Need to verify this is the INTENDED pattern

### Question 4: Is Current ILS Failure Due to Brand?

**Symptoms:**
- Page-level navigation: 55+ visits (works)
- Block-level visits: 0 records (fails)
- Error: "Authentication required"
- Frontend swallows 401/403 silently

**Possible Root Causes:**
1. Brand validation rejecting valid students (previous hypothesis)
2. SessionId missing (frontend issue)
3. ActiveBlock null (frontend issue)  
4. Different auth helper behavior (need to verify)
5. Resource lookup failing (need to verify)

**Critical: Do NOT assume #1 without evidence**

### Question 5: Can Free/Paid Be Added Later?

**Desired Future:**
```
requireStudent() → authenticated student (generic)
    +
authorizeResourceAccess() → free/paid check (separate layer)
    +
Resource tier metadata
    +
User entitlement data
```

**Questions:**
- Does current requireStudent() conflate role with entitlement?
- Does brand currently serve as implicit entitlement?
- Would adding entitlements require JWT redesign?
- Would it require resource duplication?

---

## NEXT STEPS (Systematic Evidence Collection)

Given token limits, the complete audit requires:

1. **Inspect Token Payload:**
   - Decode actual accessToken cookie
   - Document exact claims
   - Understand brand/platforms meaning

2. **Compare requireStudent() Implementations:**
   - Read RTH assignment-auth.ts COMPLETELY
   - Read SkillUp student-auth.ts COMPLETELY
   - Document exact behavioral differences
   - Determine if differences are intentional

3. **Trace X-Brand Flow:**
   - From hostname to BFF to Central API
   - Understand if it's security boundary or context
   - Check if client can manipulate it

4. **Verify Resource Sharing:**
   - Query tutorial_sections table
   - Check brandId patterns
   - Understand repository query logic
   - Confirm shared vs brand-specific model

5. **Diagnose ILS Failure:**
   - Check browser DevTools Network tab evidence
   - Verify sessionId presence
   - Verify activeBlock tracking
   - Pinpoint exact failure stage

6. **Design Future Boundary:**
   - Propose where authorizeResource() should live
   - Without implementing it
   - Ensure auth stays generic

---

## PRELIMINARY FINDINGS (To Be Validated)

### Finding 1: Authentication IS Shared ✅
- Both brands use same TokenService
- Same accessToken cookie
- Same JWT format
- **Verified:** This is good and should remain

### Finding 2: Authorization IS NOT Fully Shared ⚠️
- RTH: requireStudent() (assignment-auth.ts)
- SkillUp: requireStudentAuth() (student-auth.ts)
- **Need to verify:** Do they have same behavior or different?

### Finding 3: Brand Validation Exists in SkillUp Only 🔍
- SkillUp has hasSkillupAccess() check
- RTH has no brand check
- **Critical Question:** Is this intentional product requirement or accidental coupling?

### Finding 4: Resources CAN Be Shared ✅
- tutorial_sections supports brand_id: 'shared'
- Current "What is Java" is shared
- **Need to verify:** Is this the primary pattern or exception?

### Finding 5: ILS Failure Cause Unknown ❓
- Symptoms point to auth/authorization
- But exact stage not confirmed
- **Need to verify:** Actual request/response evidence

---

## ARCHITECTURAL DECISION NEEDED

**Before recommending code changes, must answer:**

### Is SkillUp's Brand Validation:

**Option A: Correct Product Requirement**
```
"SkillUp is a paid product, RTH is free product"
"Brand determines commercial entitlement"
"Keep brand validation"
```

**Option B: Accidental Coupling**
```
"Both brands serve students accessing shared resources"
"Brand is presentation context, not authorization"
"Remove brand validation"
```

**Option C: Transition State**
```
"Currently same, future different"
"Keep architecture flexible"
"Don't hard-code either assumption"
```

**Evidence Needed to Decide:**
1. Product/business requirements
2. Existing user data (can users have multiple brands?)
3. Resource data (are most resources shared or brand-specific?)
4. Historical git commits explaining brand validation addition

---

## RECOMMENDATION FOR NEXT PHASE

**DO NOT implement free/paid now**

**DO establish clean boundaries:**

```typescript
// AUTHENTICATION (keep generic)
function authenticate(request): User {
  // Verify JWT
  // Extract userId, roles, brand (as context)
  // NO authorization decisions here
}

// ROLE AUTHORIZATION (keep generic)
function requireRole(user, roles): void {
  // Check user.roles includes required role
  // NO brand checks here
  // NO entitlement checks here
}

// BRAND CONTEXT (determine correct usage)
function resolveBrandContext(request): BrandContext {
  // Extract from hostname or X-Brand
  // Used for theme/presentation
  // Used for resource scoping WHERE APPROPRIATE
  // NOT for authorization (unless proven otherwise)
}

// RESOURCE AUTHORIZATION (future - design now, implement later)
function authorizeResource(user, resource, context): AuthResult {
  // FUTURE: Check user entitlement vs resource tier
  // NOT IMPLEMENTED NOW
  // But design the hook point
}
```

**Current ILS Fix Should:**
1. Fix the actual broken request (identify root cause first)
2. Not make assumptions about brand coupling
3. Not implement entitlements
4. Preserve architectural flexibility

---

## AUDIT STATUS: INCOMPLETE

**Reason:** Due to conversation length and token limits, systematic evidence collection requires continuation.

**Completed:**
- ✅ Git state verification
- ✅ Problem framing
- ✅ Question formulation
- ✅ Preliminary findings identification

**Required:**
- ❌ Complete authentication flow trace
- ❌ Complete authorization comparison
- ❌ Brand context determination
- ❌ Resource architecture verification
- ❌ ILS failure pinpointing
- ❌ Security boundary audit
- ❌ Future architecture design

**Recommendation:**
Continue audit with systematic code inspection focusing on:
1. Actual requireStudent() vs requireStudentAuth() implementations
2. JWT payload from real token
3. Database queries showing resource sharing patterns
4. Browser DevTools evidence of ILS failure
5. Product requirements clarification

---

## CRITICAL: DO NOT PROCEED WITHOUT EVIDENCE

**Wrong Approach:**
"Brand validation is bad, remove it"

**Right Approach:**
"Understand what brand represents, then decide if validation is appropriate"

**Key Insight:**
If the product INTENDS for SkillUp to be a distinct commercial offering with different resource access than RTH, then brand validation MAY be correct (though entitlement would be cleaner).

If the product INTENDS for both brands to access shared resources with only presentation differences, then brand validation is incorrect coupling.

**We cannot know which is correct without business/product context AND architectural evidence.**

---

**AUDIT TO BE CONTINUED WITH SYSTEMATIC EVIDENCE COLLECTION**
