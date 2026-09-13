# GATE 4K - Identity Mapping Investigation

**Date:** September 6, 2026  
**Status:** 🔄 IDENTITY TRACING IN PROGRESS  
**Previous Status:** RETRACTED - "Infrastructure certification" was premature

---

## Why Previous Conclusion Was Premature

**Claimed:** "tutorial_sections is empty, therefore no test data exists"

**Actually Proven:** Only that `tutorial_sections.subtopic_id = '414f63eb-...'` returns zero rows

**NOT Proven:**
- Whether that UUID is the correct identity mapping
- How `whatisjava` actually resolves in the application
- What the Phase 2 test actually sent to the API
- Whether different identity types are being confused

---

## Critical Identity Distinctions (From Project SOP)

**Never assume these are interchangeable:**
- Internal ID (database UUID)
- External ID (public identifier)
- Slug (URL-friendly text)
- URL identity (route segment)
- navigationNodeId (navigation system identity)

**Current Confusion:**
- `what-is-java-12efacf1` - Is this a slug? URL segment? External ID?
- `whatisjava` - Is this navigationNodeId? Slug? Something else?
- `414f63eb-cccf-4bd1-bcc0-b52df69ce499` - Is this the UUID the API expects?

---

## Known-Good Evidence (Must Trace From This)

**Successful Phase 2 Test Used:**
```
URL: /tutorial-v2/full-stack-development/backend-development/java/
     what-is-java-12efacf1/whatisjava

From test config:
  navigationNodeId: 'whatisjava'
  subtopicId: 'what-is-java-12efacf1'  (NOTE: Not a UUID format!)
```

**Phase 2 Test Execution:**
1. Browser navigated to URL
2. Application loaded tutorial
3. Application emitted ILS event
4. **Test captured actual IDs from network request**
5. Test used captured values

**Key Question:** What did the application ACTUALLY send in the captured request?

---

## Investigation Plan

### STEP 1: Read Actual Phase 2 Test Runtime Payload

**DO NOT rely on summaries. Read the actual test execution.**

Find in `tests/e2e/ils-phase2-visit-persistence.spec.ts`:
- How test captures ILS request
- What `requestBody.subtopicId` actually contains
- What `requestBody.navigationNodeId` actually contains

### STEP 2: Trace `whatisjava` Resolution in Application

**Search codebase for:**
- `"whatisjava"` (literal string)
- `navigation_node_id` (database column)
- `navigationNodeId` (TypeScript/JavaScript)
- How Tutorial V2 route resolves navigationNodeId

**Files to inspect:**
- Tutorial V2 route loader
- Navigation resolver
- Tutorial delivery service
- Section repository

### STEP 3: Create Identity Matrix

| Entity | Database Table | Column | Value | Type | Relationship |
|--------|---------------|--------|-------|------|--------------|
| URL segment | - | - | `what-is-java-12efacf1` | ? | ? |
| Navigation | ? | ? | `whatisjava` | ? | ? |
| Subtopic | tutorial_subtopics | slug | `what-is-java-12efacf1` | slug | ? |
| Subtopic | tutorial_subtopics | id | `414f63eb-...` | UUID | ? |
| Section | tutorial_sections | subtopic_id | ? | ? | ? |
| Section | tutorial_sections | navigation_node_id | ? | ? | ? |

**Fill in EVERY cell with actual evidence, not assumptions.**

### STEP 4: Compare Phase 2 vs Phase 4.4 Schema

**Phase 2 `/api/tutorial/ils/visit` schema:**
```typescript
{
  navigationNodeId: ???,  // What type did it accept?
  subtopicId: ???,        // What type did it accept?
  ...
}
```

**Phase 4.4 `/api/tutorial/ils/block-visit` schema:**
```typescript
{
  navigationNodeId: z.string().min(1),  // TEXT
  subtopicId: z.string().uuid(),        // UUID
  ...
}
```

**Question:** Did Phase 2 schema ALSO require UUID for subtopicId?

### STEP 5: Trace Database Relationships

**Query actual foreign key relationships:**
```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('tutorial_sections', 'tutorial_subtopics')
  AND tc.constraint_type = 'FOREIGN KEY';
```

### STEP 6: Determine Authoritative Identity

**Which identity is PRIMARY for tutorial delivery?**
- Is it `tutorial_subtopics.id` (UUID)?
- Is it `tutorial_subtopics.slug` (text)?
- Is it `tutorial_sections.navigation_node_id` (text)?
- Is there an external_id column?

---

## Questions That Must Be Answered

### Q1: What did Phase 2 test ACTUALLY send?

**Hypothesis A:** Sent UUID (after capturing from application)  
**Hypothesis B:** Sent slug `what-is-java-12efacf1` (schema was different)  
**Hypothesis C:** Sent transformed value

**Must determine from actual test code.**

### Q2: How does `whatisjava` resolve to subtopic?

**Possible paths:**
- A: `whatisjava` → `tutorial_sections.navigation_node_id` → `tutorial_sections.subtopic_id` → UUID
- B: `whatisjava` → external mapping table → subtopic UUID
- C: `whatisjava` → sidebar/navigation system → subtopic
- D: `whatisjava` IS the subtopic slug (wrong)

**Must trace from application code.**

### Q3: Why does `tutorial_sections.subtopic_id = UUID` return zero?

**Possible reasons:**
- A: Wrong UUID (queried wrong column)
- B: Wrong table (sections not published)
- C: Wrong relationship (subtopic_id doesn't reference tutorial_subtopics.id)
- D: Data missing (actual defect)
- E: External ID vs Internal ID confusion

**Must determine from database schema inspection.**

### Q4: Is `414f63eb-cccf-4bd1-bcc0-b52df69ce499` the correct UUID?

**Evidence for:**
- Matches `tutorial_subtopics.id` for `what-is-java-12efacf1` slug

**Evidence against:**
- Returns zero tutorial_sections
- May be internal ID when external ID is needed
- May not be the identity used by navigation system

**Must verify from application resolver.**

---

## Current Status

**What We Know:**
- ✅ Subtopic record exists in `tutorial_subtopics`
- ✅ Has UUID `414f63eb-cccf-4bd1-bcc0-b52df69ce499`
- ✅ Has slug `what-is-java-12efacf1`
- ❌ Zero `tutorial_sections` with that `subtopic_id`

**What We DON'T Know:**
- ❓ What Phase 2 test actually sent to API
- ❓ How `whatisjava` resolves in application
- ❓ Which UUID the block API expects
- ❓ Correct identity mapping chain
- ❓ Why successful tutorial URL doesn't map to sections

**Status:** BLOCKED - Identity mapping must be traced before proceeding

---

## NO CODE CHANGES UNTIL INVESTIGATION COMPLETE

**Do NOT:**
- ❌ Modify API schema
- ❌ Modify migration
- ❌ Insert test data into `tutorial_sections`
- ❌ Change `block_learning_state` schema
- ❌ Assume identities are interchangeable

**Next Actions:**
1. Read actual Phase 2 test code
2. Trace `whatisjava` resolution
3. Create complete identity matrix
4. Determine authoritative UUID
5. THEN update test with proven values

---

**Investigation Started:** 2026-09-06 10:45 AM  
**Next Report:** After identity chain is traced



---

## IDENTITY CHAIN TRACED ✅

**Timestamp:** 2026-09-06 11:00 AM

### Complete Identity Resolution Path

**1. URL Route:**
```
/tutorial-v2/.../what-is-java-12efacf1/whatisjava
                 ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^
                 subtopicSlug          navigationNodeId
```

**2. Application Resolver (`tutorialRuntimeResolver.ts`):**
```typescript
context: {
  subtopicId: payload.hierarchy.subtopic.id,     // ← UUID FROM DATABASE
  subtopicSlug: payload.hierarchy.subtopic.slug, // what-is-java-12efacf1
  navigationNodeId: params.navigationNodeId,     // whatisjava
}
```

**3. Frontend Tracking (`tutorialTrackingService.ts`):**
```typescript
fetch('/api/tutorial/ils/visit', {
  body: JSON.stringify({
    navigationNodeId: event.navigationNodeId,  // "whatisjava"
    subtopicId: event.subtopicId,              // UUID from context
    sessionId: learningSessionId,
  })
})
```

**4. Phase 2 Test Capture:**
```typescript
const requestBody = visitRequest.postDataJSON();
const actualSubtopicId = requestBody.subtopicId;  // ← Captured UUID
```

### KEY FINDING

**The application sends `subtopic.id` (UUID), NOT `subtopicSlug`!**

```
payload.hierarchy.subtopic.id → UUID → subtopicId in API request
```

The Phase 2 test config showing `subtopicId: 'what-is-java-12efacf1'` was just the **test constant** for finding the tutorial. The **actual value sent** was captured from the application, which sent the UUID.

### Identity Matrix Complete

| Entity | Source | Column/Property | Value | Type | Usage |
|--------|--------|----------------|-------|------|-------|
| URL segment | Route param | `subtopicSlug` | `what-is-java-12efacf1` | slug | URL routing |
| URL segment | Route param | `navigationNodeId` | `whatisjava` | text | URL routing |
| Database | tutorial_subtopics | `slug` | `what-is-java-12efacf1` | slug | Lookup |
| Database | tutorial_subtopics | `id` | `414f63eb-cccf-4bd1-bcc0-b52df69ce499` | UUID | Identity |
| Runtime context | hierarchy.subtopic | `id` | UUID | UUID | **SENT TO API** |
| Runtime context | hierarchy.subtopic | `slug` | slug | text | Display |
| API request | body | `subtopicId` | UUID | UUID | **Validation & hierarchy check** |
| API request | body | `navigationNodeId` | `whatisjava` | text | **Validation & persistence** |

### Critical Discovery

**The UUID `414f63eb-cccf-4bd1-bcc0-b52df69ce499` IS correct!**

It comes from `payload.hierarchy.subtopic.id`, which is what the application actually sends.

### Why `tutorial_sections` Query Returns Zero

Now need to investigate why:
```sql
SELECT * FROM tutorial_sections
WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
```

Returns zero rows, when the application successfully uses this subtopic for tutorial delivery.

**Possible explanations:**
1. Tutorial delivery doesn't require `tutorial_sections` (uses different table)
2. Navigation resolution uses different relationship
3. Data model changed between Phase 2 and now
4. External ID vs Internal ID in different tables

**NEXT:** Trace how `payload.hierarchy` is populated - which table/query provides the subtopic.id.

