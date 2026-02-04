# Implementation Backlog

| ID | Area | Task | Priority | Dependencies | Effort |
| --- | --- | --- | --- | --- | --- |
| SEC-001 | Security | Lock down /api/migrate | P0 | None | S |
| SEC-002 | Security | Admin-only factory endpoints | P0 | None | S |
| SEC-003 | Security | Exam ownership checks | P0 | None | M |
| AUTH-001 | Auth | httpOnly access tokens | P1 | SEC-001 | M |
| DATA-001 | DB | Add indexes for exams, questions, results | P1 | None | S |
| RT-001 | Runtime | Replace ORDER BY RANDOM sampling | P1 | DATA-001 | M |
| PIPE-001 | Scoring | Move scoring async | P2 | RT-001 | L |
| OPS-001 | Ops | Distributed rate limiting | P2 | None | M |
| CACHE-001 | Cache | Cache blueprints/session config | P2 | DATA-001 | M |
| SCALE-001 | Scale | Multi-region failover | P3 | PIPE-001 | L |
| ANALYTICS-001 | Analytics | Warehouse + materialized views | P3 | PIPE-001 | L |
