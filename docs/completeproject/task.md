# Platform To-Do — Sequenced Next Steps

## SPRINT 1 — Faculty Phase 5 Completion (Immediate)
> Unblocks the only remaining  item. 3 api-server routes + wire faculty-app pages.

- [ ] 1A. Create `apps/api-server/src/app/api/tutorial/faculty/review-queue/route.ts`
       - GET, protected by x-portal-identity: faculty + x-user-id header
       - Queries tutorial_prod: tutorial_project_submissions WHERE userId IN (batch student IDs)
       - Returns: { submissions: [ { id, studentName, subtopicId, submittedAt, status } ] }

- [ ] 1B. Create `apps/api-server/src/app/api/tutorial/faculty/assignments/route.ts`
       - GET, same auth pattern
       - Queries tutorial_prod: tutorial_assignments for faculty batch students
       - Returns: { assignments: [ { id, studentId, subtopicId, dueDate, status } ] }

- [ ] 1C. Create `apps/api-server/src/app/api/tutorial/faculty/help-requests/route.ts`
       - GET, same auth pattern
       - Queries tutorial_prod: live_session_requests WHERE facultyId = resolvedFacultyId
       - Returns: { requests: [ { id, studentId, subtopicId, requestedAt, status } ] }

- [ ] 1D. Wire faculty-app BFF routes to api-server
       - apps/faculty-app/src/app/api/assignments/route.ts   calls /api/tutorial/faculty/assignments
       - apps/faculty-app/src/app/api/help-requests/route.ts  calls /api/tutorial/faculty/help-requests
       - apps/faculty-app/src/app/api/review-queue/route.ts     calls /api/tutorial/faculty/review-queue

- [ ] 1E. Remove fallback from faculty-app assignment, help, project-review pages

- [ ] 1F. Verify: faculty@skillupitacademy.com login  assignments page shows real data

---

## SPRINT 2 — payment_prod Schema (Unblocks student payments page)

- [ ] 2A. Create `packages/db-payment/src/schema/`
       - payment_plans.ts: id, userId, status, planType, totalAmount, createdAt
       - payment_installments.ts: id, planId, dueDate, status, amount, paymentRef
       - payment_transactions.ts: id, installmentId, paymentRef UNIQUE, gateway, amount
       - gateway_webhook_logs.ts: id, paymentRef, gateway, payload JSONB, status

- [ ] 2B. Add indexes from Phase 13 spec on all 4 tables (status+dueDate partial, paymentRef UNIQUE)

- [ ] 2C. Run `pnpm db-payment:migrate`

- [ ] 2D. Seed 2 installments for student@skillupitacademy.com (1 paid, 1 pending)

- [ ] 2E. Replace `apps/skillup-web/src/app/api/student/payments/route.ts` demo data with real DB query

- [ ] 2F. Verify: student login  payments page shows real installment data

---

## SPRINT 3 — Phase 6: RTH Pending Pages (Additive — RTH only)
> Zero changes to existing RTH functionality. New pages only.

- [ ] 3A. `realtutorialhub-web`: tutorial learning pages per subtopic
       - Route: `/learn/[domain]/[subject]/[topic]/[subtopic]`
       - Fetches from tutorial_prod via api-server
       - Renders content JSONB blocks (text, code, video, quiz-link)

- [ ] 3B. `realtutorialhub-quiz`: onboarding flow improvements
       - Existing /onboarding page — check what's incomplete
       - Must not break existing onboarded users

- [ ] 3C. `realtutorialhub-quiz`: profile page
       - Route: /profile
       - Shows user stats, exam history summary, skill tags

---

## SPRINT 4 — placement_prod Schema (Future)

- [ ] 4A. Create `packages/db-placement/src/schema/` (5 tables from Phase 13 spec)
- [ ] 4B. Set up Upstash Vector indexes: placement-students, placement-jobs
- [ ] 4C. Implement PlacementVectorService.indexStudentProfile() + findStudentsForJob()
- [ ] 4D. Seed 1 student profile + 2 job listings
- [ ] 4E. Wire skillup-web /student/placement to real DB

---

## SPRINT 5 — Tier 3 Infrastructure (Requires Maintenance Window)
> Do NOT start until Sprint 1-3 are complete and all RTH tests are green.

- [ ] 5A. Create Neon branch from prod snapshot
- [ ] 5B. Rehearse exams table partition migration on Neon branch
       - Shadow table  PARTITION BY RANGE (started_at)
       - Monthly partitions: 2025, 2026, 2027
       - Drop + recreate 5 FK constraints
- [ ] 5C. Rehearse audit_log partition migration on Neon branch
- [ ] 5D. Confirm Neon PITR backup is current
- [ ] 5E. Execute migrations in 2-5 AM IST maintenance window on prod
- [ ] 5F. Verify all RTH tests green post-migration (1138+)

---

## SPRINT 6 — packages/auth + packages/events (Future)

- [ ] 6A. Extract JWT verification into packages/auth (shared across services)
- [ ] 6B. Build packages/events with 15 event types
- [ ] 6C. Wire QStash consumers in api-server to use typed events
