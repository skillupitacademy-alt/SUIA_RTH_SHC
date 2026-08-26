# Platform Database Architecture

**Status**: Phase 0A - Initial Discovery (In Progress)  
**Last Updated**: 2026-08-26  
**Evidence Level**: Configuration Discovery + Historical Infrastructure Reports

⚠️ **IMPORTANT**: This document reflects CONFIGURED databases from environment files and historical verification reports. Actual PostgreSQL catalog audit is pending.

---

## Executive Summary

The quiz-platform uses a multi-database architecture with separate PostgreSQL databases for different domain responsibilities. Based on configuration discovery and historical infrastructure reports, the platform uses **at least 7 Neon PostgreSQL databases**.

### Evidence Sources

1. **Configuration Evidence**: `.env.local` files across applications
2. **Historical Evidence**: Infrastructure verification report (April 2, 2026)
3. **Code Evidence**: Database packages in `packages/db-*`
4. **Pending**: Actual PostgreSQL catalog inspection

---

## Database Landscape

### Verified Databases (Historical + Configuration)

| Database | Provider | Purpose | Configuration Status | Historical Verification |
|---|---|---|---|---|
| `quiz_platform_prod` | Neon | Quiz/Exam engine, authoritative curriculum hierarchy | ✅ CONFIGURED | ✅ VERIFIED (Apr 2026) |
| `tutorial_prod` | Neon | Tutorial content, sidebar navigation, learner progress | ✅ CONFIGURED | ✅ VERIFIED (Apr 2026) |
| `people_prod` | Neon | Identity, authentication, platform access | ✅ CONFIGURED | ✅ VERIFIED (Apr 2026) |
| `rth_prod` | Neon | RealTutorialHub brand-specific data | ✅ CONFIGURED | ✅ VERIFIED (Apr 2026) |
| `skillup_prod` | Neon | SkillUp brand-specific data | ⚠️ NOT IN SCANNED .ENV | ✅ VERIFIED (Apr 2026) |
| `payment_prod` | Neon | Payment/subscription data | ⚠️ NOT IN SCANNED .ENV | ✅ VERIFIED (Apr 2026) |
| `placement_prod` | Neon | Job placement data | ⚠️ NOT IN SCANNED .ENV | ✅ VERIFIED (Apr 2026) |

### Database Packages (Code Evidence)

Located in `packages/`:
- `db` - Main/Quiz database (quiz_platform_prod)
- `db-tutorial` - Tutorial database
- `db-people` - People/Identity database
- `db-payment` - Payment database
- `db-placement` - Placement database
- `db-rth` - RealTutorialHub brand database
- `db-skillup` - SkillUp brand database
- `db-skillhubcore` - SkillHubCore database

### Connection Patterns

**Pooled Connections** (`-pooler` endpoint):
- Used for: High-concurrency web applications
- Benefits: Connection pooling, better resource utilization
- Endpoints: `ep-*-pooler.ap-southeast-1.aws.neon.tech`

**Direct Connections** (non-pooler endpoint):
- Used for: Migrations, admin operations, low-latency requirements
- Benefits: Lower latency, direct database access
- Endpoints: `ep-*.ap-southeast-1.aws.neon.tech`

---

## Application → Database Mapping

### Configured Connections (from .env.local)

**api-server**:
- DATABASE_URL → quiz_platform_prod (pooled)
- DATABASE_DIRECT_URL → quiz_platform_prod (direct)
- DATABASE_URL_RTH → rth_prod (pooled)
- DATABASE_DIRECT_URL_RTH → rth_prod (direct)

**realtutorialhub-web**:
- DATABASE_URL → quiz_platform_prod (pooled)
- DATABASE_URL_TUTORIAL → tutorial_prod (pooled)

**skillup-web**:
- DATABASE_URL → quiz_platform_prod (pooled)
- DATABASE_URL_TUTORIAL → tutorial_prod (pooled)

**skillhubcore-admin**:
- DATABASE_URL → quiz_platform_prod (pooled)
- DATABASE_URL_TUTORIAL → tutorial_prod (pooled + direct)
- DATABASE_URL_PEOPLE → people_prod (pooled + direct)

---

## Database Responsibilities

### quiz_platform_prod (Main/Quiz DB)

**Documented Purpose**:
- Authoritative curriculum hierarchy (domains, subjects, topics, subtopics)
- Exam/quiz engine
- Question repository
- Exam attempts and results

**Owner**: Quiz/Exam system

**Consumers**:
- All web applications (read hierarchy)
- API server (write exam results)
- Tutorial system (synchronizes hierarchy via `external_id`)

### tutorial_prod (Tutorial DB)

**Documented Purpose**:
- Tutorial content (sections, blocks, documents)
- Sidebar navigation trees
- Learner progress tracking
- Tutorial delivery state

**Owner**: Tutorial system

**Consumers**:
- RealTutorialHub web
- SkillUp web
- SkillHubCore admin (composer, content management)

**Critical Identity**: The tutorial DB maintains a synchronized copy of the curriculum hierarchy using `external_id` to bridge to quiz_platform_prod.

### people_prod (People/Identity DB)

**Documented Purpose**:
- User accounts and authentication
- Platform identity management
- Role-based access control

**Owner**: Authentication/Identity system

**Consumers**:
- SkillHubCore admin
- All applications (authentication via JWT/services)

### payment_prod (Payment DB)

**Status**: Package exists, historically verified, but NOT configured in scanned .env files

**Expected Purpose**:
- Payment processing
- Subscription management
- Transaction history

**Current State**: REQUIRES INVESTIGATION

### placement_prod (Placement DB)

**Status**: Package exists, historically verified, but NOT configured in scanned .env files

**Expected Purpose**:
- Job placement tracking
- Student placement records
- Employer relationships

**Current State**: REQUIRES INVESTIGATION

### rth_prod (RealTutorialHub Brand DB)

**Status**: Configured for api-server

**Expected Purpose**:
- Brand-specific data for RealTutorialHub
- Custom branding/configuration

### skillup_prod, skillhubcore DB

**Status**: Historically verified but configuration unclear

**Expected Purpose**:
- Brand-specific data for SkillUp and SkillHubCore
- Custom branding/configuration

---

## Cross-Database Relationships

### Known Identity Bridges

**Curriculum Hierarchy Synchronization**:

```
quiz_platform_prod
    domains.id
    subjects.id
    topics.id
    subtopics.id
         ↓
    (synchronization mechanism - QStash?)
         ↓
tutorial_prod
    tutorial_domains.external_id
    tutorial_subjects.external_id
    tutorial_topics.external_id
    tutorial_subtopics.external_id
         ↓
    tutorial_subtopics.id (internal PK)
```

**Documentation States**:
- Quiz DB is the "authoritative hierarchy"
- Tutorial DB maintains "synchronized copies"
- Synchronization uses `external_id` pattern
- Cross-database foreign keys are intentionally avoided

### Unverified Relationships

These require actual PostgreSQL catalog inspection:

1. **Navigation Identity Chain**:
   ```
   subtopicId → navigationNodeId → sectionId → blockId
   ```

2. **User Identity Propagation**:
   ```
   people_prod.users.id → tutorial_prod.progress.user_id
   ```

3. **Payment/Subscription Links**:
   ```
   people_prod.users.id → payment_prod.customers.user_id
   ```

---

## Architecture Principles (from existing documentation)

### Service Ownership

> "Services should not share databases"

Each service owns its database and exposes data through:
- API endpoints
- Event-driven architecture (QStash)
- Defined service contracts

### Cross-Database Writes

> "Cross-service writes should go through QStash rather than direct SQL"

This prevents:
- Tight coupling between services
- Transaction spanning multiple databases
- Service boundary violations

### Identity Propagation

External IDs are used to propagate identities across database boundaries without creating cross-database foreign keys.

---

## Phase 0A Status

### Completed

✅ Configuration discovery from .env files  
✅ Database package inventory  
✅ Historical verification evidence reviewed  
✅ Application→Database mapping documented  

### Pending (Phase 0A continuation)

⏳ Actual PostgreSQL connection probing  
⏳ PostgreSQL catalog metadata inspection  
⏳ Actual table inventory  
⏳ Actual constraint verification  
⏳ Actual index inventory  
⏳ Actual table sizes and row counts  

### Critical Questions Requiring PostgreSQL Evidence

1. **Do payment_prod and placement_prod actually exist?**
   - Historical report says YES (Apr 2026)
   - Current .env says NOT CONFIGURED
   - Actual PostgreSQL verification REQUIRED

2. **What is the actual tutorial_sections unique constraint?**
   - Code suggests: `(subtopic_id, navigation_node_id, brand_id)`
   - Comments suggest: `(subtopic_id, brand_id)`
   - Actual PostgreSQL constraint REQUIRED

3. **How is navigationNodeId actually stored?**
   - Is it a foreign key?
   - Is it a logical identifier?
   - Is it generated from sidebar JSON?
   - Actual catalog inspection REQUIRED

4. **What synchronization mechanism actually exists?**
   - QStash events?
   - Direct writes?
   - Scheduled jobs?
   - Actual code+event trace REQUIRED

---

## Next Steps

1. **Implement secure database connection probing**
   - Use existing Neon drivers from packages
   - Connect to each verified database
   - Query PostgreSQL version, size, schemas

2. **Query PostgreSQL catalogs**
   - `pg_catalog.pg_class` for tables
   - `information_schema.columns` for structure
   - `pg_constraint` for actual constraints
   - `pg_indexes` for actual indexes

3. **Generate actual table inventory**
   - Compare configured vs actual
   - Identify code-only vs database-only tables
   - Document structural mismatches

4. **Trace navigation identity chain**
   - Verify actual constraints on tutorial_sections
   - Understand navigationNodeId storage
   - Map complete identity relationships

5. **Complete Phase 0A assurance**
   - All databases probed
   - All catalogs inspected
   - All contradictions documented
   - All unknowns explicitly marked

---

## References

- Configuration: `apps/*/env.local`
- Database packages: `packages/db-*`
- Historical verification: Infrastructure report (April 2, 2026)
- Architecture docs: `project_architecture.md`, deployment configs

---

**STOP CONDITION**: Do not proceed to schema modifications, database merges, or Phase 1 implementation until Phase 0A PostgreSQL catalog audit is complete.
