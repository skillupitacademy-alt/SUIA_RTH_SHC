# Gate 3C.1R Phase D — Contract Audit (IN PROGRESS)

**Date:** 2026-09-11  
**Status:** 🔵 AUDIT IN PROGRESS  
**Authorization:** AUDIT ONLY - NO IMPLEMENTATION  

---

## Audit Scope

Determining whether the proposed universal block-learning model is:
1. Architecturally compatible
2. Semantically complete
3. Implementable without ambiguity
4. Safe under concurrent/browser lifecycle conditions
5. Consistent with existing authoritative completion model

---

## Three Foundational Statements Under Audit

### Statement 1: Lifetime Cumulative Active Time
`activeTimeSec` represents cumulative active time across ALL qualifying sessions for identity `(userId, navigationNodeId, blockId, blockVersion)`

**Status:** AUDITING...

### Statement 2: Initial Completion Uses Cumulative Active Time
Before first completion, threshold = expectedTimeSec × 0.70, evaluated against cumulative activeTimeSec

**Status:** AUDITING...

### Statement 3: Revision Must NOT Use Lifetime Cumulative Time Directly
After completion, lifetime activeTimeSec continues accumulating but revision needs separate period accounting

**Status:** AUDITING...

---

## Critical Audit Points

### A. Existing Completion Path
- [ ] A1: Replace vs coexist with explicit completion?
- [ ] A2: Completion rule (OR vs exclusive)?
- [ ] A3: Explicit before 70% behavior?
- [ ] A4: 70% before explicit behavior?
- [ ] A5: Simultaneous completion behavior?
- [ ] A6: Authoritative source identification
- [ ] A7: Production caller for explicit completion?
- [ ] A8: Is 70% NEW behavior vs existing requirement?

### B. Canonical expectedTimeSec
- [ ] Runtime provenance trace complete
- [ ] Identity matching verified
- [ ] Client override protection verified
- [ ] Null handling verified

### C. Active-Time Trust Model
- [ ] C1-C14: IntersectionObserver → flush → database path verified

### D. Multi-Session Active Time
- [ ] Cross-session accumulation verified
- [ ] No reset verified
- [ ] Threshold calculation verified

### E. A→B Transition Semantics
- [ ] Flush ordering verified
- [ ] Completion evaluation at boundary verified

### F. Revision Model
- [ ] Revision semantics defined
- [ ] Schema sufficiency determined
- [ ] Period accounting mechanism identified

### G. Revision Threshold
- [ ] Threshold value determined or marked PRODUCT DECISION REQUIRED

### H. Multi-Tab Overlap (HIGH PRIORITY)
- [ ] H1-H8: Concurrent tab behavior audited
- [ ] Policy chosen and documented

### I. Visit Count
- [ ] Idempotency verified
- [ ] Session boundaries verified

---

## Audit Log

Starting comprehensive evidence gathering...
