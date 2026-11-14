# Risk Register

| Risk | Impact | Likelihood | Severity | Owner | Mitigation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Public /api/migrate | Critical | High | P0 | Platform | Remove or internal-only guard | Open |
| Token in localStorage | High | Medium | P1 | Auth | Move access tokens to httpOnly cookies | Open |
| Random selection scans | High | High | P1 | Runtime | Replace with indexed sampling | Open |
| Sync scoring in request path | High | Medium | P2 | Runtime | Async scoring pipeline | Open |
| No distributed rate limiting | Medium | Medium | P2 | Platform | Redis/gateway rate limits | Open |
| Missing DB indexes | High | High | P1 | Data | Add indexes + verify query plans | Open |
| Missing observability | Medium | Medium | P2 | Platform | Add logs/metrics/tracing | Open |
| No load testing | Medium | Medium | P2 | QA | Add k6/Locust scripts | Open |


## R6-B scoped findings recorded 14 November 2026

| Risk | Impact | Likelihood | Severity | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|
| R6B-SEC-01, known Neon credential disclosure in qualification diagnostic | Unauthorized database access within the credential's actual scope. Reuse/scope and misuse are unknown. | Exposure VERIFIED, misuse unknown | HIGH | Project owner / Security Operations | Existing Security Hardening Plan records incident, containment options, closure evidence and owner deferral. Rotation/revocation and validation remain required remediation. | DEFERRED — OWNER DECISION, security risk OPEN |
| Project-wide credential lifecycle governance | Uninventoried or overprivileged credentials across SHC/SUIA/RTH and shared providers | NOT TESTED across entire project | HIGH | Project owner / Security Operations | Complete the current documentation and architecture work, then authorize the dedicated inventory/rotation/validation phase described in the existing Security Hardening Plan. | PLANNED FOR LATER SECURITY PHASE, execution DEFERRED |
| R6-B fresh PeopleDB migration replay | A clean installation fails before pending 0009. Duplicate foreign keys and indexes overlap between 0006 and 0007. | FAILED in disposable qualification | HIGH | Project owner / database migration owner | Review the pinned-hash, exact-object replay compatibility proposal in the existing Neon qualification report. Preserve historical artifacts and require equivalent-definition guards and complete disposable replay tests. | BLOCKED, R6-B NOT READY, shared PeopleDB migration HOLD |

These entries supplement existing risk rows without requalifying historical findings. Reference commit 8ca7ad05e04cf15f6cdce16afb4ad8a84852ee68 contains the 9-PASS/1-FAIL qualification evidence. The credential incident's raw-log loss remains explicitly recorded. No remediation or acceptance status is inferred from documentation completion.
