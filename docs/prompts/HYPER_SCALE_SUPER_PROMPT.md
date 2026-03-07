# Universal AI Super-Prompt: Hyper-Scale Implementation Master
**Role**: Principal Architect for Planetary-Scale Educational Systems.

**Mission**: Implement the full "Hyper-Scale Extension" (Phases 9, 10, and 11) to transform the Quiz Platform into a globally resilient, mathematically verified, and sharding-ready Distributed Intelligence Engine.

---

## 🏗️ Phase 1: System Resilience (Safe Mode)
**Objective**: Implement automated load-shedding to protect the exam-taking mission.
1.  **Resilience Service**: Create `apps/api-server/src/modules/core/resilience.service.ts` to manage feature flags (`analytics`, `ai_tutor`).
2.  **Circuit Breakers**: Wrap all 7 heavy admin analytics routes and the `TutorService` analysis logic in a feature-flag check.
3.  **Fallback**: Return a `503 Service Busy` payload when `SAFE_MODE=true` is detected.

## 🚀 Phase 2: Performance Verification (k6)
**Objective**: Establish a mathematical proof of scale.
1.  **k6 Simulation**: Create `performance-testing/heavy-load.js` simulating 10,000+ concurrent students.
2.  **Journey logic**: Implement Jitter entry, high-frequency "Ghost Syncing" (autosaves), and asynchronous submission polling.
3.  **SLA Enforcement**: Set thresholds for p95 < 400ms and < 1% error rate across all stages (Smoke, Load, Stress, Spike).

## 🛡️ Phase 3: Global Operations (Edge Architecture)
**Objective**: Low-latency delivery and planetary security.
1.  **WAF Configuration**: Guide setup of Cloudflare WAF to protect during surges, specifically prioritizing `/api/exams/*/sync`.
2.  **Edge Routing**: Ensure Next.js API routes are deployed to `sin1`, `bom1`, and `lhr1` regions via Vercel.
3.  **DB Pooling**: Transition all environment variables to use Neon Connection Poolers (`.pooler.neon.tech`).

## 💾 Phase 4: Database Sharding & Lifecycle
**Objective**: Handle billions of rows with O(1) performance.
1.  **Shard Routing**: Implement consistent hashing on `user_id` to route queries across multiple physical PostgreSQL shards.
2.  **Janitor Automation**: Create a QStash job to archive historical exam data (>90 days) into cold storage (S3/R2) in Parquet format.
3.  **Hot/Cold Tiering**: Ensure the primary database remains lean by deleting archived "Hot" data.

---

## 🛠️ Combined Prompt for Execution
"Using the project context, implement the Hyper-Scale Extension. First, create the ResilienceService to shed load during surges. Second, establish the k6 performance suite to verify latency. Third, configure global edge routing via Vercel and Cloudflare. Finally, implement the Sharding and Archiving logic to handle billions of rows. All code must follow the established Drizzle/Redis/Next.js stack patterns."

---

## 🏛️ PHASE 1 FOUNDATION DEBT (Carry-Forward)
**Objective**: Clear any remaining baseline technical debt from the foundation phase.
1. **Testing**: 100% Comprehensive Unit Test coverage for core engines (Scoring, Selection) — ✅ Achieved. Playwright E2E deferred to last phase.
2. **Hardening**: Final CSRF cookie attribute audit (SameSite protocols) and server-side DB statement timeouts (30s).
