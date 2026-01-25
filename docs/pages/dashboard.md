# Dashboard Page – Objective & Contract

> Mandatory sections define baseline behavior.
> Additional sections are page-specific extensions.

---

## Purpose
Provide logged-in users with a trustworthy overview of their learning progress and activity.

---

## Entry Conditions
- User MUST be authenticated
- Redirect to Login if unauthenticated

---

## Expected Behavior

### Authentication UI
- Unauthenticated:
  - Show Login / Sign Up
- Authenticated:
  - Hide Login / Sign Up
  - Show User menu or Logout

### Metrics
- Exams Taken → count of completed exams
- Avg Score → calculated from completed exams only
- Mastery Points → derived from scoring engine
- Global Rank → hidden until ranking is implemented

### Activity
- Started exams → no score
- Completed exams → exactly one final score
- Show timestamp or relative time

---

## Data Contract
- Never show `%` without numeric value
- Never show conflicting scores
- Hide metrics when data is unavailable
- Charts must clearly state what they measure

---

## UI Rules
- Do NOT show placeholder values as real data
- Do NOT show auth actions when logged in
- Do NOT show `#-` or empty ranks

---

## Known Issues
- Auth buttons visible when logged in ✅
- Placeholder / inconsistent dashboard values ✅
- Performance chart lacks context ✅

---

## Verification Checklist
- [x] Login hides auth buttons
- [x] Logout visible and functional
- [x] Dashboard renders only real data
- [x] Charts have labels or tooltips
