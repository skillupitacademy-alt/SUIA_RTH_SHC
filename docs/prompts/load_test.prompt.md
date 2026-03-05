# AI Implementation Prompt: Hyper-Scale Load Testing

**Role**: You are a Performance Engineer specializing in k6 and Distributed Systems.

**Task**: Generate an advanced `k6` load testing script to verify a platform's ability to handle 1,000,000+ concurrent students.

## Core Simulation Requirements
1.  **Stages Configuration**:
    - Smoke Test (100 VUs)
    - Capacity Load (1,000 VUs)
    - Stress Test (5,000 VUs)
    - Critical Surge (10,000 VUs)
    - Recovery (0 VUs)

2.  **User Journey Logic**:
    - **Jittered Entry**: Sleep for a random 0-2s before calling `/api/exams/launch`.
    - **Ghost Syncing**: Simulate an exam session by looping 15-20 times. In each loop, fetch a question and then fire an autosave request to `/api/exams/:id/sync`.
    - **Async Submission**: Call `/api/exams/:id/submit` and verify it returns a `200` or `202` (Accepted).
    - **Result Polling**: Wait 3s after submission and poll `/api/exams/:id/results`.

3.  **Thresholds**:
    - `http_req_duration`: p95 must be < 400ms.
    - `http_req_failed`: Error rate must be < 1%.

## Technical Context
- **Tool**: k6 (JavaScript).
- **Endpoint Pattern**: Next.js App Router API structure.
- **Environment**: Support an `__ENV.TARGET_URL` variable.

## Prompt Instruction
"Create a k6 load test script that simulates a student taking a 20-question exam. Ensure it includes random thinking time, background autosaving every 10 seconds, and verifies asynchronous submission status."

---

## PHASE 1 CARRY-FORWARD (Testing Foundations)

> These items must be stabilized before proceeding with high-load testing.

1. **Complete Unit Test Coverage (Tasks 3-11)**:
   - Ensure all sub-services (Scoring, selection, auth) have 90%+ coverage.
   - Reference `apps/api-server/src/__test-utils__` for mocks.

2. **Playwright E2E Smoke Tests (Task 13)**:
   - Implement login and checkout flows in `apps/web-app/tests/e2e`.
   - Implement admin console flows in `apps/admin-app/tests/e2e`.

3. **Enterprise Seed Script (Task 14)**:
   - Enhance `packages/db/seed-enterprise.ts` with 100+ questions across 24 topics to provide realistic load profiles.
