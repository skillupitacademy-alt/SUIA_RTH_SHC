# Implementation Backlog

| ID | Area | Task | Priority | Status | Dependencies | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | Security | Lock down /api/migrate | P0 | COMPLETED | None | S |
| SEC-002 | Security | Admin-only factory endpoints | P0 | COMPLETED | None | S |
| SEC-003 | Security | Exam ownership checks | P0 | COMPLETED | None | M |
| AUTH-001 | Auth | httpOnly access tokens | P1 | COMPLETED | SEC-001 | M |
| DATA-001 | DB | Add indexes for exams, questions, results | P1 | COMPLETED | None | S |
| RT-001 | Runtime | Replace ORDER BY RANDOM sampling | P1 | COMPLETED | DATA-001 | M |
| CACHE-001 | Cache | Cache blueprints/session config | P2 | COMPLETED | DATA-001 | M |
| OPS-001 | Ops | Distributed rate limiting | P2 | COMPLETED | None | M |
| PIPE-001 | Scoring | Move scoring async | P2 | COMPLETED | RT-001 | L |
| SCALE-001 | Scale | Multi-region failover | P3 | BACKLOG | PIPE-001 | L |
| ANALYTICS-001 | Analytics | Warehouse + materialized views | P3 | BACKLOG | PIPE-001 | L |
