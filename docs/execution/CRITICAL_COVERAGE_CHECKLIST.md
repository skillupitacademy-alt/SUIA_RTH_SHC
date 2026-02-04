# Critical Coverage Checklist

This checklist confirms that all critical concerns are captured in the concernforproject docs.

1) Public /api/migrate exposure
- Covered in: docs/security/SECURITY_HARDENING_PLAN.md
- Covered in: docs/execution/REMEDIATION_ROADMAP.md (P0)
- Covered in: docs/risk/RISK_REGISTER.md

2) Admin-only enforcement for factory endpoints
- Covered in: docs/security/SECURITY_HARDENING_PLAN.md
- Covered in: docs/execution/REMEDIATION_ROADMAP.md (P0)
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (SEC-002)

3) Exam ownership checks
- Covered in: docs/security/SECURITY_HARDENING_PLAN.md
- Covered in: docs/execution/REMEDIATION_ROADMAP.md (P0)
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (SEC-003)

4) Access token storage (no localStorage)
- Covered in: docs/security/SECURITY_HARDENING_PLAN.md (Access token migration)
- Covered in: docs/execution/REMEDIATION_ROADMAP.md (P1)
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (AUTH-001)

5) ORDER BY RANDOM removal / scalable sampling
- Covered in: docs/architecture/SCALE_ARCHITECTURE.md (Sampling strategy)
- Covered in: docs/platform/SCALABILITY_PLAN.md (Phase 1a)
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (RT-001)
- Covered in: docs/execution/walkthroughs/walkthrough_cache.md

6) Async scoring pipeline
- Covered in: docs/architecture/SCALE_ARCHITECTURE.md (Async scoring)
- Covered in: docs/platform/SCALABILITY_PLAN.md (Phase 2)
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (PIPE-001)

7) Distributed rate limiting
- Covered in: docs/platform/SCALABILITY_PLAN.md
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (OPS-001)
- Covered in: docs/execution/walkthroughs/walkthrough_rate_limiting.md
- Covered in: docs/risk/RISK_REGISTER.md

8) Database indexing for hot paths
- Covered in: docs/platform/SCALABILITY_PLAN.md (Phase 1)
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md (DATA-001)
- Covered in: docs/risk/RISK_REGISTER.md

9) Observability (logs/metrics/traces/alerts)
- Covered in: docs/platform/OBSERVABILITY_RUNBOOK.md
- Covered in: docs/risk/RISK_REGISTER.md

10) Load testing
- Covered in: docs/testing/LOAD_TEST_STRATEGY.md
- Covered in: docs/risk/RISK_REGISTER.md

11) Execution sequencing and ownership
- Covered in: docs/execution/REMEDIATION_ROADMAP.md
- Covered in: docs/execution/IMPLEMENTATION_BACKLOG.md

If you want, I can add a similar checklist for non-critical (nice-to-have) items.
