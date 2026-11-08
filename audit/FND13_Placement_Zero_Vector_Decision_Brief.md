# FND13: Placement Zero-Vector Scoring Decision Brief

**Authority:** audit/FND13_16_Implementation_Review.json (HIGH severity blocker)
**Baseline:** cc100f47 (remediation/w1-2-batch-05-targeted)
**Status:** BLOCKED - Awaiting Sol product decision
**Date:** 2026-01-12

---

## Executive Summary

When a student has NO placement profile, the system currently fabricates job match percentages (90%, 87%, 84%...) as if semantic similarity rankings exist. This presents uncalibrated scores without vector foundation.

**Current Behavior:**
```typescript
// apps/skillup-web/src/lib/skillup-data.ts:379
jobs: profileRows[0] === undefined
  ? jobs.map((job, index) => ({
      id: job.id,
      company: job.companyName,
      title: job.title,
      location: job.location,
      match: Math.max(60, 90 - index * 3),  // ← FABRICATED
    }))
```

**User Impact:** Students without profiles see ranked job matches that suggest algorithmic comparison, when no profile exists to compare against.

---

## Three Policy Options

### Option 1: Clamp to Match = 1

**Implementation:**
```typescript
jobs: profileRows[0] === undefined
  ? jobs.map((job) => ({
      id: job.id,
      company: job.companyName,
      title: job.title,
      location: job.location,
      match: 1,  // Honest floor: no calibration exists
    }))
```

**User Experience:**
- All jobs show 1% match or "Not calibrated"
- Clear signal that profile completion is required
- Preserves job visibility while being honest about match quality

**Pros:**
- Truthful: Acknowledges lack of calibration
- Preserves job listing availability
- Clear incentive to complete profile

**Cons:**
- All jobs appear equally poor matches
- May discourage exploration
- Could feel punishing for incomplete profile

---

### Option 2: Return Empty Array

**Implementation:**
```typescript
jobs: profileRows[0] === undefined
  ? []  // No profile → no matches
```

**User Experience:**
- Job list empty with message: "Complete your placement profile to see matched opportunities"
- Explicit gate requiring profile completion
- Clean UX: no partial data

**Pros:**
- Clear product flow: profile first, then jobs
- No fabricated data whatsoever
- Strong incentive to complete profile

**Cons:**
- Hides all job listings until profile exists
- Prevents job browsing for motivation
- May reduce initial engagement

---

### Option 3: Use Readiness Score Fallback

**Implementation:**
```typescript
jobs: profileRows[0] === undefined
  ? jobs.map((job, index) => ({
      id: job.id,
      company: job.companyName,
      title: job.title,
      location: job.location,
      match: Math.max(1, Math.round((jobListingReadinessThreshold / 100) * (100 - index * 2))),
      // Fallback using readiness threshold as baseline, with degrading rank
    }))
```

**User Experience:**
- Jobs ranked by simple readiness heuristic (e.g., deadline proximity, CTC range)
- Labeled as "Preliminary ranking - complete profile for personalized matches"
- Preserves discovery while acknowledging limitation

**Pros:**
- Allows job browsing without profile
- Uses legitimate DB fields (deadline, CTC) for ordering
- Honest about limitation through labeling

**Cons:**
- Still presents percentage without true calibration
- Requires additional implementation for readiness score
- More complex than Options 1 or 2

---

## Current System Context

### When Profile EXISTS:
```typescript
// Vector-based or readiness-scored matches
const vectorMatches = await findJobsForStudent({
  userId,
  readinessScore: profileRows[0].readinessScore,
  skills: profileRows[0].skills,
  experienceSummary: profileRows[0].experienceSummary,
  preferredLocation: profileRows[0].preferredLocation,
  expectedCtc: profileRows[0].expectedCtc,
}, Math.max(2, jobs.length));

// Returns: { id, score: 0.0-1.0 } → converted to match percentage
match: Math.max(1, Math.round((match.score ?? 0) * 100))
```

### Job Source:
- All jobs come from `placementJobListings` table
- Filtered: `status='open'`, `deletedAt IS NULL`
- Ordered: `deadline DESC, createdAt DESC`

**Existing Fallback Profile:**
```typescript
const FALLBACK_PLACEMENT = {
  profile: {
    roleGoal: 'Placement-ready role',
    resumeStatus: 'Paused',
    profileCompletion: 0,
    interviewCount: 0,
    skills: [],
  },
};
```

---

## Code Impact Summary

| Option | Files Changed | Test Changes | Migration Required |
|---|---|---|---|
| **Option 1** | 1 file (skillup-data.ts line 379) | Update existing placement tests | NO |
| **Option 2** | 1 file + UI message component | Update tests + add empty state tests | NO |
| **Option 3** | 2 files (data + readiness helper) | New readiness tests + update existing | MAYBE (readiness schema) |

---

## Recommendation

**Prefer Option 1 (Clamp to match=1)** for immediate truth correction:

1. **Fastest to implement** - Single line change
2. **Honest boundary** - Makes limitation visible
3. **Preserves discovery** - Jobs remain visible
4. **Clear incentive** - Low matches motivate profile completion
5. **No migration** - Works with existing schema

**Future Enhancement Path:**
- Add profile completion progress indicator
- Implement Option 3 readiness scoring as separate feature
- Add "Complete profile" CTA on placement dashboard

---

## Decision Request

**Product Owner (Sol) - Please select:**

- [ ] **Option 1** - Clamp all matches to 1% when no profile exists
- [ ] **Option 2** - Return empty job array until profile created
- [ ] **Option 3** - Implement readiness-score fallback (requires additional design)
- [ ] **Alternative** - Specify different behavior

**Approval Signature:** _________________ **Date:** _________

---

## Implementation Checklist (Post-Decision)

Once approved:
- [ ] Update `apps/skillup-web/src/lib/skillup-data.ts` line 379
- [ ] Update placement tests to verify new behavior
- [ ] Add UI label if needed (e.g., "Complete profile for personalized matches")
- [ ] Verify no other callers assume fabricated scoring
- [ ] Run full placement test suite
- [ ] Commit with: `fix(fnd13): placement zero-profile match scoring - [OPTION]`
- [ ] Update FND13 manifest with decision outcome

**Estimated Implementation Time:**
- Option 1: 30 minutes
- Option 2: 2 hours (including empty state UI)
- Option 3: 4-6 hours (including readiness logic)
