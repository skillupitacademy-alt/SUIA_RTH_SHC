# Phase 2.5 — Backend Capability Audit

**Date:** 2026-08-27  
**Purpose:** Determine what tracking/analytics can be implemented with current backend vs. what requires migration

---

## Current Backend Status

### Database Tables Inspected

Need to inspect:
- `tutorial_progress` schema
- `tutorial_sections` schema
- Existing tracking tables
- Progress API endpoints
- TutorialProgressRepository

### Files to Audit

1. `packages/db/src/schema/` - Drizzle schemas
2. `apps/api-server/src/repositories/TutorialProgressRepository` (if exists)
3. `apps/api-server/src/services/tutorialTrackingService` (if exists)
4. Progress API routes
5. Existing migrations

---

## Required Before Implementation

**STOP CONDITION:**

Before implementing Phases 10-14 (Universal Tracking, Active Time, Completion, Revision Count), the AI must:

1. ✅ Audit existing `tutorial_progress` table schema
2. ✅ Audit existing progress API
3. ✅ Report current capability
4. ✅ Distinguish: SUPPORTED vs. REQUIRES MIGRATION
5. ❌ Do NOT implement tracking that requires backend migration
6. ❌ Do NOT create fake progress data
7. ❌ Do NOT claim navigation-node progress works when backend lacks identity

---

## Next Step

Run forensic audit of existing backend tracking infrastructure before proceeding with Phases 10-14.
