# Domain → Database Mapping

**Phase 0A.2.2-A — Static Source Analysis**

Generated: 2026-08-26T12:35:57.187Z

## Database Domains

### Quiz/Exam Domain

**quiz_platform_prod**

Services accessing this database:

- api-server
- skillup-web
- skillhubcore-admin

### Tutorial Domain

**tutorial_prod**

Services accessing this database:

- api-server
- realtutorialhub-web
- skillhubcore-admin

### People/Organization Domain

**people_prod**

Services accessing this database:

- api-server
- skillup-web

### Identity Domains

**rth_prod**

Services accessing this database:

- api-server

**skillup_prod**

Services accessing this database:

- api-server

### Financial Domain

### Placement Domain

**placement_prod**

Services accessing this database:

- skillup-web

## Interpretation

The catalog evidence from Phase 0A.2.1 combined with static source 
analysis suggests **domain separation** rather than arbitrary fragmentation.

However, this does not yet answer the performance question:

- How many databases does a typical request touch?
- Are multi-database requests sequential or parallel?
- What is the actual latency impact?

**Database consolidation decision remains 🔒 BLOCKED until request-flow 
evidence is complete.**
