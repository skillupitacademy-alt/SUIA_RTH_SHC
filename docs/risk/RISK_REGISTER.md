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
