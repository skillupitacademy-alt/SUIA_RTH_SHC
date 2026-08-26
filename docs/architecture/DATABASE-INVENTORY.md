# Platform Database Inventory

**Status**: Phase 0A - Configuration Discovery Complete, PostgreSQL Catalog Audit Pending  
**Last Updated**: 2026-08-26  
**Evidence Level**: CONFIGURED (not yet VERIFIED via PostgreSQL catalog)

⚠️ **IMPORTANT**: This inventory is based on:
1. Repository configuration files (.env.local)
2. Database package structure (`packages/db-*`)
3. Historical infrastructure reports
4. **NOT YET**: Actual PostgreSQL catalog queries

---

## Discovered Databases

### quiz_platform_prod

**Provider**: Neon PostgreSQL  
**Region**: ap-southeast-1  
**Connection**: Pooled + Direct  
**Status**: CONFIGURED  

**Applications Using This Database**:
- api-server (read/write)
- realtutorialhub-web (read)
- skillup-web (read)
- skillhubcore-admin (read)

**Expected Tables** (from repository analysis):
- domains
- subjects
- topics
- subtopics
- questions
- exams
- exam_attempts
- exam_results

**Catalog Verification**: ⏳ PENDING

---

### tutorial_prod

**Provider**: Neon PostgreSQL  
**Region**: ap-southeast-1  
**Connection**: Pooled + Direct  
**Status**: CONFIGURED  

**Applications Using This Database**:
- realtutorialhub-web (read)
- skillup-web (read)
- skillhubcore-admin (read/write)

**Expected Tables** (from db-tutorial package):
- tutorial_domains
- tutorial_subjects
- tutorial_topics
- tutorial_subtopics
- tutorial_sections
- tutorial_sidebar_trees_v2
- tutorial_progress
- tutorial_content (if exists)
- live_sessions
- assignments
- projects
- project_submissions

**Critical Identity Question**:
```
tutorial_sections uniqueness constraint
   Code comment: (subtopic_id, brand_id)
   New implementation: (subtopic_id, navigation_node_id, brand_id)
   
   ACTUAL PostgreSQL constraint: ⏳ PENDING VERIFICATION
```

**Catalog Verification**: ⏳ PENDING

---

### people_prod

**Provider**: Neon PostgreSQL  
**Region**: ap-southeast-1  
**Connection**: Pooled + Direct  
**Status**: CONFIGURED  

**Applications Using This Database**:
- skillhubcore-admin (read/write)
- All applications (authentication via services)

**Expected Tables** (from db-people package):
- users
- roles
- permissions
- sessions
- authentication_providers

**Catalog Verification**: ⏳ PENDING

---

### payment_prod

**Provider**: Neon PostgreSQL (presumed)  
**Status**: ⚠️ NOT FOUND IN SCANNED .ENV FILES  
**Historical Evidence**: ✅ VERIFIED (April 2, 2026)  

**Database Package**: `packages/db-payment` EXISTS

**Contradiction**:
```
Configured: NOT FOUND in scanned .env.local files
Historical: VERIFIED as existing database (Apr 2026)
Package: Code exists in packages/db-payment

Status: REQUIRES INVESTIGATION
Possible causes:
  1. Configuration moved to different environment file
  2. Different connection pattern not scanned
  3. Database exists but not currently used
  4. Configuration is environment-specific
```

**Expected Tables** (from package structure):
- customers
- subscriptions
- transactions
- payment_methods
- invoices

**Catalog Verification**: ⏳ PENDING

---

### placement_prod

**Provider**: Neon PostgreSQL (presumed)  
**Status**: ⚠️ NOT FOUND IN SCANNED .ENV FILES  
**Historical Evidence**: ✅ VERIFIED (April 2, 2026)  

**Database Package**: `packages/db-placement` EXISTS

**Contradiction**:
```
Configured: NOT FOUND in scanned .env.local files
Historical: VERIFIED as existing database (Apr 2026)
Package: Code exists in packages/db-placement

Status: REQUIRES INVESTIGATION
```

**Expected Tables** (from package structure):
- students
- placements
- companies
- job_applications
- interviews

**Catalog Verification**: ⏳ PENDING

---

### rth_prod

**Provider**: Neon PostgreSQL  
**Region**: ap-southeast-1  
**Connection**: Pooled + Direct  
**Status**: CONFIGURED (api-server only)  

**Applications Using This Database**:
- api-server (read/write)

**Expected Purpose**:
- Brand-specific data for RealTutorialHub
- Custom configurations
- Brand-specific content

**Expected Tables**: UNKNOWN (requires catalog inspection)

**Catalog Verification**: ⏳ PENDING

---

### skillup_prod

**Provider**: Neon PostgreSQL (presumed)  
**Status**: ⚠️ NOT FOUND IN SCANNED .ENV FILES  
**Historical Evidence**: ✅ VERIFIED (April 2, 2026)  

**Database Package**: `packages/db-skillup` EXISTS

**Expected Purpose**:
- Brand-specific data for SkillUp
- Custom configurations

**Catalog Verification**: ⏳ PENDING

---

## Cross-Database Identity Mapping

### Known External Identity Patterns

**Curriculum Hierarchy (Quiz → Tutorial)**:

```
SOURCE: quiz_platform_prod
  ├── domains.id (UUID, PRIMARY KEY)
  ├── subjects.id (UUID, PRIMARY KEY)
  ├── topics.id (UUID, PRIMARY KEY)
  └── subtopics.id (UUID, PRIMARY KEY)

REPLICA: tutorial_prod
  ├── tutorial_domains.external_id → domains.id
  ├── tutorial_subjects.external_id → subjects.id
  ├── tutorial_topics.external_id → topics.id
  └── tutorial_subtopics.external_id → subtopics.id
         ↓
     tutorial_subtopics.id (internal UUID, PRIMARY KEY)
```

**Synchronization Mechanism**: ⏳ PENDING INVESTIGATION
- Possible: QStash events
- Possible: Scheduled jobs
- Possible: Direct writes (violates documented architecture)

**Actual PostgreSQL Evidence**: ⏳ PENDING

---

### Unverified Identity Chains

These require PostgreSQL catalog + actual data inspection:

**Navigation Identity**:
```
domainId (quiz)
    ↓
subjectId (quiz)
    ↓
topicId (quiz)
    ↓
subtopicId (quiz → tutorial via external_id)
    ↓
navigationNodeId (??? - from sidebar JSON?)
    ↓
sectionId (tutorial_sections.id)
    ↓
blockId (tutorial_sections.content.blocks[].id)
```

**User Identity**:
```
userId (people_prod)
    ↓
tutorial_progress.user_id
    ↓
exam_attempts.user_id
    ↓
payment_customers.user_id
    ↓
placement_students.user_id
```

---

## Table Inventory Status

### Phase 0A Completion Requirements

For each database, we must establish:

✅ **Configured**: Found in environment files  
⏳ **Reachable**: Connection probe successful  
⏳ **PostgreSQL Version**: Actual version from `SELECT version()`  
⏳ **Database Size**: Actual size from `pg_database_size()`  
⏳ **Schema List**: Actual schemas from `pg_catalog`  
⏳ **Table List**: Actual tables from `information_schema.tables`  
⏳ **Column Inventory**: Actual columns with types, nullable, defaults  
⏳ **Primary Keys**: Actual PK constraints from `pg_constraint`  
⏳ **Foreign Keys**: Actual FK constraints with ON DELETE/UPDATE  
⏳ **Unique Constraints**: Actual unique constraints  
⏳ **Check Constraints**: Actual check constraints  
⏳ **Index Inventory**: Actual indexes with columns, type, size  
⏳ **Table Sizes**: Actual sizes from `pg_total_relation_size()`  
⏳ **Row Estimates**: Actual estimates from `pg_class.reltuples`  

### Current Status: CONFIGURATION DISCOVERY COMPLETE

---

## Package → Database Mapping

| Package | Database | Configuration Status | Package Status |
|---|---|---|---|
| `packages/db` | quiz_platform_prod | ✅ CONFIGURED | ✅ EXISTS |
| `packages/db-tutorial` | tutorial_prod | ✅ CONFIGURED | ✅ EXISTS |
| `packages/db-people` | people_prod | ✅ CONFIGURED | ✅ EXISTS |
| `packages/db-payment` | payment_prod | ⚠️ NOT CONFIGURED | ✅ EXISTS |
| `packages/db-placement` | placement_prod | ⚠️ NOT CONFIGURED | ✅ EXISTS |
| `packages/db-rth` | rth_prod | ✅ CONFIGURED | ✅ EXISTS |
| `packages/db-skillup` | skillup_prod | ⚠️ NOT CONFIGURED | ✅ EXISTS |
| `packages/db-skillhubcore` | skillhubcore (?) | ⚠️ NOT CONFIGURED | ✅ EXISTS |

---

## Critical Findings

### 1. Configuration vs Historical Evidence Contradictions

**Payment and Placement databases**:
- Historical infrastructure report (Apr 2026): VERIFIED
- Current .env.local scan: NOT CONFIGURED
- Database packages: EXIST

**Interpretation**:
DO NOT conclude these databases don't exist. The configuration discovery module only scanned certain .env.local files. These databases may be:
1. Configured in unscanned environment files
2. Configured in deployment/CI configuration
3. Temporarily unused but still existing
4. Accessible via different connection patterns

**Required Action**: Actual PostgreSQL connection attempt

### 2. Tutorial Section Identity Ambiguity

**From repository code/comments**:
```typescript
// Phase 1: Navigation Identity (new)
(subtopic_id, navigation_node_id, brand_id)

// Historical comment (old):
Identity: (subtopic_id, brand_id)
ONE tutorial per subtopic per brand
```

**Actual PostgreSQL constraint**: ⏳ UNKNOWN

**Impact**: Phase 1 Composer implementation currently PAUSED pending this verification.

### 3. Navigation Node Identity Source

**Question**: Where does `navigationNodeId` come from?

**Hypotheses**:
1. Generated from `tutorial_sidebar_trees_v2.tree` JSON
2. Stored as separate table (not yet discovered)
3. Logical identifier without database storage
4. Combination of sidebar data + routing logic

**Evidence Required**:
- PostgreSQL table inventory
- Sidebar JSON structure inspection
- Application routing code analysis
- Actual data samples

---

## Phase 0A Next Steps

1. **Database Connection Probing**
   - Attempt connection to all configured databases
   - Attempt connection to historically-verified databases even if not configured
   - Report reachable vs unreachable
   - Extract PostgreSQL version, size, current_schema

2. **PostgreSQL Catalog Queries**
   - For each reachable database, query `pg_catalog`
   - Extract complete table list
   - Extract columns, types, nullability
   - Extract all constraints (PK, FK, UNIQUE, CHECK)
   - Extract all indexes
   - Extract table/index sizes
   - Extract row count estimates

3. **Comparison Report**
   - Expected (from packages) vs Actual (from PostgreSQL)
   - MATCH / CODE_ONLY / DATABASE_ONLY / STRUCTURAL_MISMATCH
   - Document all contradictions

4. **Identity Relationship Mapping**
   - Verify cross-database external_id patterns
   - Trace navigationNodeId storage and generation
   - Map user identity propagation
   - Document all identity bridges

5. **Assurance Gate**
   - All configured databases probed
   - All reachable databases cataloged
   - All contradictions documented
   - No credentials exposed
   - All files ≤ 600 lines
   - EXIT CODE 0

---

**STOP CONDITION**: Do not proceed to Phase 1 or schema modifications until PostgreSQL catalog audit is complete and all contradictions are resolved or explicitly documented as UNKNOWNS.
