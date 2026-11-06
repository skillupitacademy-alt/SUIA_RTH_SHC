# Task-Scoped Context Retrieval Guide (DOC03)

**Version:** 1.1.0  
**Tooling:** `tools/ai-context/context-cli.mjs` v1.1.0 (Argon commit aa33e494)  
**Configuration:** `tools/ai-context/config.json` v1.1.0  
**Commands:** `build-packet`, `verify-canaries`, `benchmark`  
**Status:** IMPLEMENTED_UNVERIFIED (awaiting Gemini VAL01-VAL12 validation and Sol final acceptance)

---

## Purpose

This guide documents how to use v1.1.0 context optimization tooling for task-scoped source packet generation, fail-closed security validation, chunk retrieval patterns, and integration with workflow agent briefs. The tooling enables agents to retrieve complete, security-auditable context packets while respecting token budgets and maintaining secret-free guarantees.

**Critical Note:** This tooling is **optional and experimental**. It is under independent validation and has NOT been authorized for mandatory use in AGENTS.md or CLAUDE.md until Sol grants final acceptance. Agents may continue using conventional graphify/grep/read_file workflows.

---

## Core Concepts

### Task-Scoped Source Packets

A **source packet** is a self-contained, task-scoped collection of:

1. **Security-critical implementation files** (e.g., `ownership.service.ts`, `enforcer.ts`, `rbac.guard.ts`)
2. **Discovered callers** via multi-hop graph traversal or ripgrep fallback
3. **Database schemas and SQL migrations** with fail-closed guards
4. **Security regression tests** with negative boundary cases
5. **Sol architectural decisions** with governing D1/D3 sections
6. **Line numbers and SHA-256 manifest** for precise code navigation

**Example packet:** FND03 complete security packet contains 30 files (RBAC implementation + callers + schemas + tests + Sol decisions) in a single auditable artifact.

### Security Modes: Outline vs Full

| Mode | Purpose | Content | Token Budget | Secret Scanning | Exit on Omission |
|------|---------|---------|--------------|-----------------|------------------|
| `outline` | Navigation only | File tree + function signatures (no bodies) | ~4,000 tokens | No | No (warning only) |
| `full` | Security audit | Complete uncompressed source + tests + decisions | ~65,000 tokens | **Yes (fail-closed)** | **Yes (exit 1)** |

**Critical Rule:** Security-critical tasks (FND01-FND30, all RBAC/auth/SQL changes) **MUST** use `full` mode. `outline` mode is only appropriate for discovery/navigation tasks where implementation details are not needed.

### Fail-Closed Behavior

In `full` security mode, the CLI **fails closed** (exit 1, never prints `PASS`) if:

1. **Any required security file is omitted** (e.g., `ownership.service.ts` missing from packet)
2. **Any discovered caller is omitted** due to budget constraints
3. **Any Sol decision file is missing or cannot be read**
4. **Secret scanner detects forbidden patterns** (live JWT, database passwords, PEM keys, API tokens)
5. **Packet exceeds `sourcePacketBudget`** (262,144 bytes / 65,000 tokens) - instead of truncating, CLI writes full evidence to disk and reports chunk retrieval commands

**Why fail-closed?** Security tasks require complete context. Partial packets risk missing ownership checks, migration guards, or negative test cases that prevent vulnerabilities.

---

## Command Reference

### Build Task-Scoped Source Packet

```powershell
node tools/ai-context/context-cli.mjs build-packet \
  --packet fnd03 \
  --mode full \
  --out .context-packets/fnd03-packet-20261106.md
```

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--packet` | ✅ | - | Packet ID from `config.json` `packets` section (e.g., `fnd03`) |
| `--mode` | No | `full` | Security mode: `outline` (navigation only) or `full` (complete audit) |
| `--out` | No | `.context-packets/<packet>-<timestamp>.md` | Output file path |
| `--verify-graph` | No | `true` | Verify `graphify-out/graph.json` provenance against manifest |
| `--no-callers` | No | `false` | Skip caller discovery (not recommended for security tasks) |

**Output Structure:**

```markdown
# FND03 Tenant & Resource Ownership Isolation Packet

**Packet ID:** fnd03
**Mode:** full (security audit)
**Generated:** 2026-11-06T12:34:56.789Z
**CLI Version:** 1.1.0
**Config Schema:** 1.1.0

---

## Provenance

**Graph:** graphify-out/graph.json (verified against manifest sha256:abc123...)
**Source HEAD:** f5c15fc4abcd1234 (FND03: Update documentation)
**Tool HEAD:** aa33e494abcd1234 (Argon v1.1.0)
**Config:** tools/ai-context/config.json (sha256:def456...)

---

## Security-Critical Files (18 files)

### packages/auth/src/rbac/ownership.service.ts

**Lines:** 1-245
**SHA-256:** sha256:abcdef123456789abcdef123456789abcdef123456789abc...

```typescript
import { Injectable } from '@nestjs/common';
// ... (complete uncompressed source)
```

---

## Discovered Callers (12 files)

### apps/api-server/src/app/api/auth/profile/route.ts

**Lines:** 145-178 (canAccessResource call site)
**SHA-256:** sha256:fedcba987654321fedcba987654321fedcba987654321fed...

```typescript
// Context: 10 lines before
const canAccess = await ownershipService.canAccessResource({
  user: authUser,
  tenant: profileTenant,  // FND03: explicit tenant parameter
  // ... (complete context)
```

---

## Database Schemas & Migrations (5 files)

### packages/db/migrations/0001_fnd03_add_tenant_ownership.sql

**Lines:** 1-89
**SHA-256:** sha256:123456abcdef789123456abcdef789123456abcdef789123...

```sql
-- FND03: Add tenant_id and resource_owner_id columns
DO $$ 
BEGIN
  -- Fail-closed guard: RAISE EXCEPTION prevents accidental production execution
  -- ... (complete migration with guards)
```

---

## Security Regression Tests (4 files)

### packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts

**Lines:** 1-156
**SHA-256:** sha256:789abcdef123456789abcdef123456789abcdef123456789...

```typescript
describe('FND03: Tenant Boundary Isolation', () => {
  it('should reject cross-tenant resource access', async () => {
    // Negative test: rth_user attempts access to skillup resource
    // ... (complete test cases)
```

---

## Sol Architectural Decisions (3 files)

### audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md

**Sections:** D1 (lines 145-178), D3 (lines 215-248)
**SHA-256:** sha256:abc123def456abc123def456abc123def456abc123def456...

```markdown
## D1. Private profile ownership and explicit tenant provenance

Private profiles MUST record creation tenant...
// ... (extracted Sol decision sections)
```

---

## Packet Summary

**Total Files:** 30
**Total Lines:** 4,523
**Total Bytes:** 156,202
**Total Chars:** 156,072
**Estimated Tokens (chars/4):** 39,018
**Secret Scan:** ✅ PASS (0 forbidden patterns detected)
**Budget Compliance:** ✅ PASS (156,202 bytes < 262,144 sourcePacketBudget)
**Omissions:** None (all required files included)

**Result:** PACKET BUILD SUCCESSFUL (fail-closed criteria met)
```

### Security Canary Verification

```powershell
node tools/ai-context/context-cli.mjs verify-canaries \
  --packet fnd03 \
  --canary-type secrets

# Or verify all canaries for a packet
node tools/ai-context/context-cli.mjs verify-canaries \
  --packet fnd03 \
  --canary-type all
```

**Canary Types:**

| Type | Validates | Fail Conditions |
|------|-----------|-----------------|
| `secrets` | No live credentials in packet | Any match against `config.secretDenylist.contentPatterns` |
| `completeness` | All required files included | Any file in `securityCriticalFiles`, `schemaAndMigrationFiles`, `securityTestFiles`, or `solDecisionFiles` missing |
| `budget` | Packet within token budget | Total bytes > `budgets.sourcePacketBudget.maxBytes` (262,144) |
| `callers` | All callers discovered | Caller discovery failed OR ripgrep exit code > 1 (not 0 or 1) |
| `all` | All above checks | Any single check fails |

**Output Example (PASS):**

```
✅ CANARY VERIFICATION PASSED: fnd03

Secrets scan:
  ✅ 0 forbidden patterns detected across 30 files
  ✅ Checked patterns: PEM_PRIVATE_KEY, DATABASE_URL_WITH_PASSWORD, LIVE_SECRET_ASSIGNMENT, GITHUB_TOKEN, BEARER_JWT

Completeness check:
  ✅ All 18 security-critical files included
  ✅ All 5 schema/migration files included
  ✅ All 4 security test files included
  ✅ All 3 Sol decision files included

Budget check:
  ✅ Packet size: 156,202 bytes (59.6% of 262,144 budget)
  ✅ Estimated tokens: 39,018 (60.0% of 65,000 budget)

Caller discovery:
  ✅ 12 callers discovered via graph traversal
  ✅ No caller discovery errors

Result: PASS (all canaries verified)
Exit code: 0
```

**Output Example (FAIL):**

```
❌ CANARY VERIFICATION FAILED: fnd03

Secrets scan:
  ❌ 2 forbidden patterns detected:
     1. packages/db/config/database.ts:45 - DATABASE_URL_WITH_PASSWORD
        → postgres://admin:production_password_123@prod.example.com:5432/skillup
     2. apps/api-server/src/config/jwt.ts:12 - BEARER_JWT_LIVE_CREDENTIAL
        → Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0...

  🔒 SECURITY VIOLATION: Live credentials detected in packet

Completeness check:
  ❌ 2 required files missing:
     1. packages/auth/src/rbac/enforcer.ts (security-critical)
     2. audit/FND03_FND11_Sol_Review_041e5fe9.md (Sol decision)

Budget check:
  ❌ Packet size: 312,456 bytes (119.2% of 262,144 budget)
  ⚠️  Budget exceeded by 50,312 bytes

  📋 Chunked retrieval required - see commands below

Caller discovery:
  ✅ 12 callers discovered via graph traversal

Result: FAIL (2 critical security violations, 2 missing files, 1 budget violation)
Exit code: 1

FAIL-CLOSED: Packet generation blocked due to security violations.
Action required:
  1. Remove live credentials from database.ts:45 and jwt.ts:12
  2. Add enforcer.ts and Sol review file to packet config
  3. Consider splitting packet into chunks if budget remains exceeded
```

---

## Chunk Retrieval Pattern

### When Packets Exceed Budget

When a packet exceeds `sourcePacketBudget` (262,144 bytes / 65,000 tokens), the CLI:

1. **Does NOT truncate** the packet (which would violate fail-closed security)
2. **Writes complete packet** to disk at `.context-packets/<packet>-full-<timestamp>.md`
3. **Generates chunk retrieval commands** for workflow agents
4. **Exits with code 1** and reports chunk commands in terminal output

**Example Terminal Output:**

```
❌ PACKET BUILD FAILED: fnd03 exceeds budget

Total size: 312,456 bytes (119.2% of 262,144 budget)
Estimated tokens: 78,114 (120.2% of 65,000 budget)

✅ Full packet written to: .context-packets/fnd03-full-20261106.md

📋 CHUNK RETRIEVAL COMMANDS:

To load this packet in workflow agent context, use these retrieval commands:

# Chunk 1: Core RBAC implementation (18 files, ~35K tokens)
read_file --path .context-packets/fnd03-full-20261106.md --offset 0 --limit 1500

# Chunk 2: Discovered callers (12 files, ~20K tokens)
read_file --path .context-packets/fnd03-full-20261106.md --offset 1500 --limit 900

# Chunk 3: Schemas, migrations, tests (9 files, ~15K tokens)
read_file --path .context-packets/fnd03-full-20261106.md --offset 2400 --limit 700

# Chunk 4: Sol decisions (3 files, ~8K tokens)
read_file --path .context-packets/fnd03-full-20261106.md --offset 3100 --limit 400

Total chunks: 4
Per-chunk budget: ~20K tokens (safe for most workflow agents)

Add this to workflow brief:
  "Context retrieval: Load FND03 packet via 4-chunk pattern from .context-packets/fnd03-full-20261106.md (chunks 1-4 as shown in build output)"

Exit code: 1 (packet exceeded budget, chunk retrieval required)
```

### Chunk Retrieval in Workflow Brief

When launching a workflow that requires a chunked packet, include this pattern in the brief:

```markdown
## Context Retrieval

Load FND03 security context via 4-chunk retrieval pattern:

1. **Chunk 1 (Core RBAC):** `read_file --path .context-packets/fnd03-full-20261106.md --offset 0 --limit 1500`
   - Contains: `ownership.service.ts`, `enforcer.ts`, `rbac.guard.ts`, core RBAC files
   
2. **Chunk 2 (Callers):** `read_file --path .context-packets/fnd03-full-20261106.md --offset 1500 --limit 900`
   - Contains: `profile/route.ts`, `brand-db.ts`, all `canAccessResource` call sites
   
3. **Chunk 3 (Schemas/Tests):** `read_file --path .context-packets/fnd03-full-20261106.md --offset 2400 --limit 700`
   - Contains: Drizzle schemas, SQL migrations, security regression tests
   
4. **Chunk 4 (Sol Decisions):** `read_file --path .context-packets/fnd03-full-20261106.md --offset 3100 --limit 400`
   - Contains: D1/D3 Sol architectural decisions with blocking requirements

Load all 4 chunks before starting implementation. Do NOT skip chunks to save time - security context requires completeness.
```

**Critical Rule:** Workflow agents **MUST** load all specified chunks before implementation. Skipping chunks to "save tokens" violates fail-closed security guarantees and may result in missing ownership checks or migration guards.

---

## Benchmark Comparison

### Understanding Token Savings

The `benchmark` command compares four retrieval approaches for identical security coverage:

```powershell
node tools/ai-context/context-cli.mjs benchmark --packet fnd03
```

**Output Example:**

```
📊 FND03 CONTEXT RETRIEVAL BENCHMARK

Scenario: Complete FND03 security coverage (30 files: RBAC + callers + schemas + tests + Sol decisions)

Approach A: Conventional workflow (manual discovery)
  Files: 30 required + 3 discovery overhead (GRAPH_REPORT.md + handoff docs)
  Total files: 33
  Total bytes: 892,456
  Total chars: 891,203
  Estimated tokens (chars/4): 222,801
  
Approach B: Raw required files only (no discovery overhead)
  Files: 30 required (no discovery overhead)
  Total bytes: 489,234
  Total chars: 488,721
  Estimated tokens (chars/4): 122,180
  
Approach C: Optimized packet (with provenance + bounded discovery)
  Files: 30 required + line numbers + SHA-256 manifest + bounded caller summaries
  Total bytes: 156,202
  Total chars: 156,072
  Estimated tokens (chars/4): 39,018
  Compression ratio: 68.1% reduction vs raw (B), 82.5% reduction vs conventional (A)
  
Approach D: Navigation outline (function signatures only)
  Files: 30 files with signatures, no implementation bodies
  Total bytes: 18,456
  Total chars: 18,203
  Estimated tokens (chars/4): 4,551
  ⚠️  NOT SECURITY-AUDIT SAFE (missing implementation details)

External validation (Repomix o200k_base encoding):
  Compressed structure: 6,038 tokens (NOT audit-safe: strips impl bodies & test assertions)
  Uncompressed RBAC only: 14,281 tokens (NOT audit-safe: omits callers, schemas, Sol decisions)
  Uncompressed complete: 41,664 tokens (AUDIT-SAFE, +6.8% vs chars/4 estimate)

Recommended approach for FND03:
  - Security implementation tasks: Approach C (39K tokens, audit-safe)
  - Large packets exceeding budget: Approach C with 4-chunk retrieval
  - Navigation/discovery only: Approach D (4.5K tokens, outline mode)

Token savings (C vs A): 183,783 tokens (82.5% reduction)
Token savings (C vs B): 83,162 tokens (68.1% reduction)

Exit code: 0
```

### Interpreting Benchmark Results

**Key Takeaways:**

1. **Conventional workflow (A):** Loads 33 files including large discovery overhead (GRAPH_REPORT.md with 15K+ god nodes, full handoff documents). This is the baseline comparison.

2. **Raw required files (B):** Eliminates discovery overhead but still loads complete uncompressed source of all 30 files. This is the "theoretically minimal" conventional approach.

3. **Optimized packet (C):** Adds line numbers + SHA-256 manifest + bounded caller summaries, achieving 68-82% token reduction through:
   - Elimination of graph report god-node lists
   - Bounded multi-hop caller discovery (20 results max, not exhaustive)
   - Consolidated provenance metadata
   - Single artifact vs 30+ separate file reads

4. **Navigation outline (D):** Strips implementation bodies - **DO NOT USE for security tasks**. Only appropriate for discovery/navigation where implementation details are not needed.

**When to Use Which Approach:**

| Task Type | Recommended Approach | Rationale |
|-----------|---------------------|-----------|
| FND security implementation | **Approach C** | Audit-safe, complete context, 68% token savings |
| Large packets (>65K tokens) | **Approach C + chunking** | Fail-closed security + budget compliance |
| Discovery/navigation | **Approach D** | 90% token savings, no implementation needed |
| Emergency debugging | **Approach B** | Direct file access when tooling unavailable |

---

## Integration with Workflow Agents

### Option 1: Direct Packet Reference (Packets Within Budget)

For packets that fit within `sourcePacketBudget` (262,144 bytes / 65,000 tokens):

```markdown
## Context Requirements

Before implementation, load FND03 security packet:

```bash
read_file --path .context-packets/fnd03-packet-20261106.md
```

This packet contains:
- 18 security-critical RBAC implementation files (uncompressed)
- 12 discovered callers with `canAccessResource` invocation sites
- 5 Drizzle schemas and fail-closed SQL migrations
- 4 security regression tests with negative boundary cases
- 3 Sol decision documents with D1/D3 architectural requirements

Packet provenance:
- Source HEAD: f5c15fc4 (FND03 approved implementation)
- Tool HEAD: aa33e494 (Argon v1.1.0)
- Graph verified: ✅ (manifest SHA-256 match)
- Secret scan: ✅ PASS (0 forbidden patterns)

Do NOT skip files from packet to save tokens. Complete context is required for security tasks.
```

### Option 2: Chunked Retrieval (Packets Exceeding Budget)

For packets that exceed budget, use the 4-chunk pattern (see "Chunk Retrieval Pattern" section above).

### Option 3: Hybrid Approach (Packet + Selective Deep Dive)

For workflows that need packet overview plus deep implementation focus:

```markdown
## Context Requirements

1. **Initial context (packet overview):**
   ```bash
   read_file --path .context-packets/fnd03-packet-20261106.md --offset 0 --limit 500
   ```
   (Loads provenance, file manifest, and first 500 lines)

2. **Deep dive files (when implementation starts):**
   ```bash
   read_file --path packages/auth/src/rbac/ownership.service.ts
   read_file --path packages/auth/src/rbac/enforcer.ts
   read_file --path packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts
   ```

This hybrid approach:
- Provides complete context map upfront (500 lines, ~2K tokens)
- Loads detailed implementation only when needed
- Reduces initial context load while preserving security completeness
```

### Option 4: Conventional Workflow (No Tooling)

Agents may **always** fall back to conventional workflows:

```markdown
## Context Requirements (Conventional)

Use existing graphify/grep/read_file workflow:

1. Query ownership architecture:
   ```bash
   graphify query "ownership service tenant isolation"
   ```

2. Discover callers:
   ```bash
   grep_search --query "canAccessResource" --includePattern "**/*.ts"
   ```

3. Read implementation files:
   ```bash
   read_file --path packages/auth/src/rbac/ownership.service.ts
   read_file --path packages/auth/src/rbac/enforcer.ts
   ```

4. Read Sol decisions:
   ```bash
   read_file --path audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md --offset 145 --limit 50
   ```

This workflow is **always valid** and requires no new tooling. Context optimization is optional.
```

**Critical Rule:** The orchestrator launching the workflow **MUST NOT** read source files themselves when using "Delegate all work" mode. Source reading is the workflow agent's responsibility. The orchestrator's job is to specify which packet/chunk/files to load, not to pre-read and summarize them.

---

## Fail-Closed Guarantees

### Security Properties Enforced

When `mode: full` and `verify-canaries: true`, the CLI guarantees:

1. **Completeness:** All files in `securityCriticalFiles`, `schemaAndMigrationFiles`, `securityTestFiles`, `solDecisionFiles` arrays are included (exit 1 if any missing)

2. **Secret-free:** No live credentials, PEM keys, database passwords, or API tokens are present (exit 1 if any pattern matches `config.secretDenylist`)

3. **Provenance-verified:** `graphify-out/graph.json` matches `graphify-out/manifest.json` per-file AST MD5 hashes (exit 1 if drift detected)

4. **Budget-aware:** Packet size reported with exit 1 if exceeded, never silently truncated

5. **Caller discovery integrity:** Ripgrep/graphify execution errors (exit code > 1) are distinguished from genuine zero-matches (exit code 1) and reported as failures

### What Fail-Closed Does NOT Guarantee

1. **Semantic correctness:** CLI cannot verify that implementation correctly implements Sol decisions
2. **Test coverage:** CLI verifies tests are included, not that they provide adequate coverage
3. **Architectural fitness:** CLI cannot validate whether implementation follows project conventions
4. **Current test passing:** CLI does not execute tests, only includes their source code
5. **Future stability:** Packets are point-in-time snapshots and do not guarantee compatibility with future changes

**Critical Rule:** Fail-closed packet generation is a **necessary but not sufficient** condition for security. All FND implementations still require Sol independent review with APPROVED verdict.

---

## Configuration Reference

### Packet Definition in `config.json`

```json
{
  "packets": {
    "fnd03": {
      "id": "fnd03",
      "title": "FND03 Tenant & Resource Ownership Isolation Packet",
      "taskIds": ["FND03", "TC01", "TC02", "TC03", "TC05", "TC06", "TC09"],
      "description": "Complete task-scoped context packet for FND03...",
      "callerSearchPattern": "canAccessResource|requirePermissionOrOwnership|hasPermissionOrOwnership",
      "callerSearchRoots": ["packages/auth", "apps", "src"],
      "securityCriticalFiles": [
        "packages/auth/src/rbac/ownership.service.ts",
        "packages/auth/src/rbac/enforcer.ts",
        "packages/auth/src/rbac/rbac.guard.ts"
      ],
      "schemaAndMigrationFiles": [
        "packages/db/src/schema/auth.ts",
        "packages/db/migrations/0001_fnd03_add_tenant_ownership.sql"
      ],
      "securityTestFiles": [
        "packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts"
      ],
      "solDecisionFiles": [
        "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
        "audit/FND03_FND11_Sol_Review_041e5fe9.md"
      ]
    }
  }
}
```

### Adding New Packets

To add a new packet for a different FND task:

1. **Copy existing packet definition** (e.g., `fnd03`) as template
2. **Update file arrays** with task-specific files
3. **Define caller search pattern** for task-specific functions
4. **Commit updated `config.json`** to repository
5. **Test packet generation** with `build-packet --packet <new_id> --mode full`
6. **Verify canaries pass** with `verify-canaries --packet <new_id> --canary-type all`

**Example: Adding FND11 Packet**

```json
{
  "packets": {
    "fnd11": {
      "id": "fnd11",
      "title": "FND11 People Projection & Tenant-Scoped Email Uniqueness",
      "taskIds": ["FND11", "TC09", "TC10"],
      "description": "Complete task-scoped context packet for FND11 tenant email isolation...",
      "callerSearchPattern": "normalizePeopleRoles|createPerson|admitEnquiry",
      "callerSearchRoots": ["packages/auth", "apps/skillup-admin", "apps/api-server"],
      "securityCriticalFiles": [
        "packages/auth/src/people/people-projection.service.ts",
        "packages/auth/src/people/normalize-people-roles.ts",
        "apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts"
      ],
      "schemaAndMigrationFiles": [
        "packages/db/src/schema/people.ts",
        "packages/db/migrations/0015_fnd11_tenant_email_unique.sql"
      ],
      "securityTestFiles": [
        "packages/auth/src/people/__tests__/sol-fnd11-email-collision.test.ts"
      ],
      "solDecisionFiles": [
        "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
        "audit/FND03_FND11_Sol_Review_041e5fe9.md"
      ]
    }
  }
}
```

---

## Troubleshooting

### Problem: "Graph provenance verification failed"

```
❌ Graph provenance verification failed
  Recorded: sha256:abc123...
  Current:  sha256:def456...
  
Cause: graphify-out/graph.json has been modified since provenance was recorded

Solution:
  1. Rebuild graph: graphify build
  2. Record new provenance: node tools/ai-context/context-cli.mjs record-graph-provenance --packet fnd03
  3. Retry packet build: node tools/ai-context/context-cli.mjs build-packet --packet fnd03 --mode full
```

### Problem: "Caller discovery failed with exit code 2"

```
❌ Caller discovery failed: ripgrep exit code 2
  Pattern: canAccessResource|requirePermissionOrOwnership
  
Cause: ripgrep execution error (not zero-matches, which would be exit 1)

Solution:
  1. Verify ripgrep is installed: rg --version
  2. Check pattern syntax: rg "canAccessResource" packages/auth
  3. Verify search roots exist: ls packages/auth apps src
  4. Check config.graphify.ripgrepFallbackPaths for valid rg.exe path
```

### Problem: "Secret scanner detected live credentials"

```
❌ Secret scan failed: 1 forbidden pattern detected
  File: packages/db/config/database.ts:45
  Pattern: DATABASE_URL_WITH_PASSWORD
  Match: postgres://admin:prod_pass_123@...
  
Cause: Live database password in packet source files

Solution:
  1. Replace hardcoded credential with placeholder or env var reference
  2. Verify .env files are in config.secretDenylist.forbiddenPathGlobs
  3. Commit credential removal
  4. Retry packet build
```

### Problem: "Packet exceeds sourcePacketBudget"

```
❌ Packet exceeds budget: 312,456 bytes (119.2% of 262,144)
  
Cause: Too many large files in packet (common for FND tasks with many callers)

Solution:
  1. Use chunked retrieval pattern (see "Chunk Retrieval Pattern" section)
  2. CLI automatically generates chunk commands - use those in workflow brief
  3. DO NOT reduce securityCriticalFiles array to fit budget (violates fail-closed security)
  4. Consider splitting into multiple smaller packets if chunks are unwieldy
```

### Problem: "Required file missing from packet"

```
❌ Completeness check failed: 1 required file missing
  Missing: packages/auth/src/rbac/enforcer.ts (security-critical)
  
Cause: File listed in config.packets.fnd03.securityCriticalFiles but not found on disk

Solution:
  1. Verify file exists: ls packages/auth/src/rbac/enforcer.ts
  2. Check for typos in config.json file path
  3. Verify file wasn't renamed or moved since config was written
  4. Update config.json if file path changed legitimately
```

---

## CLI Exit Codes

| Exit Code | Meaning | Action Required |
|-----------|---------|-----------------|
| 0 | Success (all validation passed) | Proceed with workflow |
| 1 | Fail-closed violation (security/budget/completeness) | Fix reported issues, retry command |
| 2 | Configuration error (invalid packet ID, missing config.json) | Check packet ID, verify config file exists |
| 3 | Tool dependency error (graphify/ripgrep not found) | Install missing dependencies |
| 4 | Graph provenance error (manifest drift detected) | Rebuild graph, record new provenance |

**Critical Rule:** Workflow agents **MUST** check CLI exit codes. Exit 1 from `build-packet` or `verify-canaries` means fail-closed criteria were violated - do NOT proceed with implementation.

---

## References

- **Operating Guide:** `docs/ai-context/operating-guide.md` (DOC01)
- **Checkpoint Template:** `docs/ai-context/fnd-checkpoint-template.md` (DOC02)
- **CLI Implementation:** `tools/ai-context/context-cli.mjs` v1.1.0 (commit aa33e494)
- **Config Schema:** `tools/ai-context/config.json` v1.1.0
- **Argon Handoff:** `audit/Argon_Context_Optimization_Handoff.md`
- **Sol Decisions:** `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md`

---

**Version History:**
- v1.1.0 (2026-11-06): Initial task retrieval guide with fail-closed packet generation, chunk retrieval patterns, and workflow integration
