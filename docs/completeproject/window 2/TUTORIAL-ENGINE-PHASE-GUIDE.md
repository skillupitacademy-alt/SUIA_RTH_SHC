# Tutorial Engine Phase Guide

## T3-A-02 Design Change (Locked)

The original T3-A-02 design has been superseded.

NEW DESIGN: Assignments are practice only.
  - No scoring
  - No QStash scoring workers
  - No score-based tier unlocking
  - Tier unlock = completion-based (student self-declares done)
  - Help request system added for faculty support

TABLES TO CREATE:
  tutorial_assignments (if not exists)
  assignment_progress (NEW - replaces assignment_sessions)
  assignment_help_requests (NEW)

TABLES TO NOT CREATE:
  assignment_sessions (old design - do not build)
  assignment_answers (old design - do not build)
  assignment_tier_unlocks (old design - do not build)

See PHASE-T3-ASSIGNMENT-ENGINE.md top section for full spec.
