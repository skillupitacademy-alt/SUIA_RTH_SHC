# AI Context Optimization Operating Guide (DOC01)

**Version:** 1.1.0  
**Tooling:** `tools/ai-context/context-cli.mjs` v1.1.0 (Argon commit aa33e494)  
**Configuration:** `tools/ai-context/config.json` v1.1.0  
**Status:** IMPLEMENTED_UNVERIFIED (awaiting Gemini VAL01-VAL12 validation and Sol final acceptance)  
**Authority:** `audit/Argon_Developer_Context_Optimization_Assignment.md` (OPT01-OPT05)

---

## Purpose

This guide documents the v1.1.0 context optimization CLI, covering all commands, security guardrails, fail-closed modes, provenance verification, checkpoint validation, and full-source fallback behavior. The tooling is currently optional and under independent validation - no mandatory changes to AGENTS.md/CLAUDE.md are authorized until Sol grants final acceptance.

---

## Prerequisites

**Node.js Requirements:**
- Node.js v18+ (ESM module support required)
- No npm install needed - CLI is standalone with node: imports only

**Repository Requirements:**
- Must be executed from repository root: `E:\onlinewebsites\quiz-platform`
- Requires `graphify-out/graph.json` and `graphify-out/manifest.json` for graph-based queries
- Requires `ripgrep` (`rg.exe`) for caller discovery fallback

**Environment:**
- Windows PowerShell or bash
- Git repository with committed changes (for checkpoint validation)
- No environment variables required

---

## Command Reference

### Core Commands (OPT01-OPT05)

All commands use this invocation pattern:
```powershell
node tools/ai-context/context-cli.mjs <subcommand> [options]
```

#### 1. `record-graph-provenance` (OPT01)

**Purpose:** Record cryptographic provenance of `graphify-out/graph.json` against per-file AST MD5 hashes in `graphify-out/manifest.json` and current git HEAD.

**Usage:**
```powershell
node tools/ai-context/context-cli.mjs record-graph-provenance --packet fnd03
```

**Options:**
- `--packet <id>`: Packet ID from `config.json` (e.g., `fnd03`)
- `--config <path>`: Custom config path (optional, defaults to `tools/ai-context/config.json`)

**Output:**
- Writes `.context-packets/graph-provenance.json` with:
  - `repoHead`: Current git HEAD SHA
  - `graphSha256`: SHA-256 hash of `graph.json`
  - `manifestSha256`: SHA-256 hash of `manifest.json`
  - `sourceRevision`: git commit SHA for tracked source files
  - `perFileFingerprints`: Array of `{path, sha256}` for each tracked file
  - `manifestAstHashes`: Per-file MD5 `ast_hash` from `manifest.json`

**Validation:**
- Compares recorded MD5 `ast_hash` (27/27 FND03 files) against actual disk file MD5
- Verifies working tree is clean via `git status --porcelain`
- Marks graph as `"advisory": true` with file-level reasons if mismatches detected

**Exit Codes:**
- `0`: Success, provenance recorded
- `1`: Git HEAD unavailable, manifest missing, or file read errors

---

#### 2. `sql-coverage` (OPT01)

**Purpose:** Verify SQL file coverage in `graphify-out/graph.json`.

**Usage:**
```powershell
node tools/ai-context/context-cli.mjs sql-coverage
```

**Options:**
- `--config <path>`: Custom config path (optional)

**Output:**
- Reports total SQL files in repository vs indexed in graph
- Lists supported constructs: `file_node`, `CREATE TABLE`, `CREATE INDEX`
- Lists unsupported constructs: PL/pgSQL procedural blocks, Drizzle TypeScript-to-SQL edges
- Shows example indexed files: `0001_fnd03_add_tenant_ownership.sql`, `0029_fnd03_add_tenant_to_progress.sql`

**Known Limitations:**
- `tree_sitter_sql` indexes 131 `.sql` files with 833 SQL nodes
- Procedural `DO $$ ... END $$;` blocks do not produce child symbol edges
- Cross-language Drizzle-to-SQL relationships not captured
- **Mitigation:** Always include full SQL migration files and Drizzle schemas directly in `--mode full` packets

**Exit Codes:**
- `0`: Success, coverage reported
- `1`: Graph file missing or malformed

---

#### 3. `query-graph` (OPT01)

**Purpose:** Execute provenance-checked multi-hop dependency traversal with ripgrep fallback.

**Usage:**
```powershell
node tools/ai-context/query-graph "canAccessResource isValidTenantPair 0001_fnd03"
```

**Options:**
- `<query>`: Space-separated search terms
- `--depth <n>`: BFS traversal depth (default: 2)
- `--budget <tokens>`: Token budget for native graphify CLI (default: 1800)
- `--packet <id>`: Packet context for caller search roots (optional)
- `--config <path>`: Custom config path (optional)

**Execution Phases:**
1. **Lexical Seeds:** Substring/symbol matching in graph nodes
2. **BFS Dependency Traversal:** Multi-hop inbound-caller and outbound-callee edge traversal (depth ≤ 2)
3. **Native Graphify CLI:** Invokes `graphify query "<q>" --depth 2 --budget 1800`
4. **Source Fallback:** `rg.exe` or `git grep` with symbol case preservation

**Provenance Checks:**
- Verifies per-file MD5 `ast_hash` from `manifest.json` against disk files
- Verifies recorded SHA-256 fingerprints in `.context-packets/graph-provenance.json`
- Marks results `"advisory": true` if graph is stale with file-level mismatch reasons

**Ripgrep Error Handling:**
- Exit status `1` = zero matches (expected, not an error)
- Exit status `> 1` or spawn failure = execution error (throws `CALLER_SEARCH_EXECUTION_ERROR`)
- Validates regex syntax upfront to prevent command injection

**Output:**
- Writes `.context-packets/query-<timestamp>.json` with:
  - `lexicalSeeds`: Matched graph nodes
  - `bfsDependencyTraversal`: Multi-hop edges
  - `nativeGraphifyCli`: Full graphify output
  - `sourceFallbackResults`: Ripgrep matches
  - `provenanceAdvisory`: Graph freshness warnings (if any)

**Exit Codes:**
- `0`: Success, results written
- `1`: Graph missing, provenance failed, or regex syntax error

---

#### 4. `build-packet` (OPT02)

**Purpose:** Build fail-closed source packet with security guardrails.

**Usage:**
```powershell
# Full security mode (fail-closed)
node tools/ai-context/context-cli.mjs build-packet --packet fnd03 --mode full

# Navigation outline only (not audit-safe alone)
node tools/ai-context/context-cli.mjs build-packet --packet fnd03 --mode navigation
```

**Options:**
- `--packet <id>`: Packet ID from `config.json` (required)
- `--mode <mode>`: `full` (fail-closed) or `navigation` (outline only, default: `full`)
- `--max-bytes <n>`: Override `sourcePacketBudget.maxBytes` (default: 262144)
- `--config <path>`: Custom config path (optional)

**Modes:**

**1. Full Security Mode (`--mode full`):**
- Includes complete function bodies, test assertions, SQL DDL, Sol decisions
- Enforces `config.secretDenylist.forbiddenPathGlobs` (15/15 canary checks)
- Enforces `config.defaultExcludeGlobs` (node_modules, .next, dist, etc.)
- Runs caller discovery via ripgrep against `callerSearchPattern`
- **Fail-Closed Behavior:** If ANY required file is omitted, ANY discovered caller is uncovered, or `packetBytes > maxBytes`:
  - Sets `completenessStatus = "FAILED_INCOMPLETE"`
  - Writes full untruncated artifact to `.context-packets/<id>-packet.md`
  - Writes bounded chunk files: `.context-packets/<id>-full-chunk-part1.md`, `part2.md`, ...
  - Reports exact omitted files and uncovered callers
  - Exits with code `1` (`PACKET_INCOMPLETE_FAIL_CLOSED`)
- **Security Guardrails:**
  - Path confinement: Rejects `..` traversal and symlink escapes
  - Forbidden path detection: Blocks `.env`, `.npmrc`, `*.pem`, `credentials*.json`, SSH keys
  - Secret pattern detection: Redacts PEM blocks, database URLs with passwords, hardcoded tokens
- Adds line numbers (`1..N`) and SHA-256 headers to each file section

**2. Navigation Mode (`--mode navigation`):**
- Strips function bodies and test assertions
- Preserves only signatures, imports, exports, and structure
- Explicitly marks `auditSafeForSecurityReview: false`
- No fail-closed enforcement (budget overflow is allowed)
- **Use Case:** Initial orientation only, never for security sign-off

**Output Files:**
- `.context-packets/<id>-packet.md`: Full packet (full mode) or outline (navigation mode)
- `.context-packets/<id>-packet.json`: Manifest with file list, SHA-256 hashes, byte/char counts
- `.context-packets/<id>-full-chunk-partN.md`: Bounded chunks (if budget overflows in full mode)
- `.context-packets/<id>-navigation-packet.md`: Navigation outline (if navigation mode)

**Token Estimates:**
- Uses deterministic `Math.ceil(chars / 4)` formula
- Explicitly distinguished from external Repomix `o200k_base` counts
- **NOT** equivalent to model billing metrics

**Exit Codes:**
- `0`: Success, packet complete
- `1`: Fail-closed - budget overflow, omitted files, uncovered callers, or forbidden paths detected

**Example FND03 Full Packet:**
- 30 required files (ownership, callers, schemas, SQL, tests, Sol decisions)
- 214,849 bytes (214,593 chars, ~53,649 estimated tokens)
- 18.24% overhead vs raw files due to line numbers + SHA-256 headers
- Saves 47.01% vs conventional workflow (eliminates 253.8 KB discovery overhead)

---

#### 5. `verify-canaries` (OPT02)

**Purpose:** Execute 15 synthetic security-canary tests and fail-closed negative controls.

**Usage:**
```powershell
node tools/ai-context/context-cli.mjs verify-canaries
```

**Options:**
- `--config <path>`: Custom config path (optional)

**Tests Executed:**
1. `.env` blocked by `**/.env` glob
2. `apps/api-server/.env.production` blocked by `**/.env.*` glob
3. `.env.example` allowed by `!**/.env.example` negation rule
4. `config/.npmrc` blocked by `**/.npmrc` glob
5. `certs/server.pem` blocked by `**/*.pem` glob
6. `secrets/credentials-prod.json` blocked by `**/credentials*.json` glob
7. `ssh/id_ed25519` blocked by `**/id_ed25519*` glob
8. `node_modules/vitest/index.js` blocked by `node_modules/**` default exclude glob
9. Synthetic PEM private key header detected and redacted
10. Synthetic database URL with password detected and redacted
11. Synthetic GitHub PAT (`ghp_...`) detected and redacted
12. Synthetic live secret assignment (`UPSTASH_REDIS_REST_TOKEN=...`) detected and redacted
13. Budget overflow in full mode fails closed with exit code `1`
14. Missing required file + uncovered caller fails closed with exit code `1`
15. Parent traversal (`../outside.txt`) rejected with `PATH_CONFINEMENT_ERROR`

**Output:**
- JSON report for each test: `{id, description, expectedOutcome, observedOutcome, status: "PASS"|"FAIL"}`
- Secret values are **never** printed to console (only `valueRedactedFromOutput: true` flag)

**Exit Codes:**
- `0`: All 15 canary checks PASS
- `1`: Any canary check FAIL

---

#### 6. `benchmark` (OPT03)

**Purpose:** Compare identical 30-file FND03 security coverage across conventional vs optimized workflows.

**Usage:**
```powershell
node tools/ai-context/benchmark --packet fnd03
```

**Options:**
- `--packet <id>`: Packet ID from `config.json` (required)
- `--config <path>`: Custom config path (optional)

**Measurement Rows:**
1. **Conventional Same-Coverage End-to-End** (30 required + 3 discovery overhead files)
   - 435,576 B end-to-end (181,713 B payload + 253,863 B discovery)
   - ~108,810 estimated tokens
2. **Raw 30 Required Security Files Only** (zero-discovery reference floor)
   - 181,713 B, ~45,365 estimated tokens
   - No line numbers or headers
3. **Optimized Full FND03 Security Workflow** (packet + bounded graph query)
   - 230,806 B end-to-end (214,849 B packet + 15,957 B query)
   - ~57,638 estimated tokens
   - **-47.01%** vs conventional end-to-end
4. **Optimized Navigation Outline Only** (orientation only)
   - 39,321 B, ~9,808 estimated tokens
   - **-90.97%** vs conventional end-to-end
   - Explicitly `auditSafeForSecurityReview: false`

**Benchmarking Constraints:**
- `identicalSecurityFileSet: true` (exact same 30 files in rows 1-3)
- Frozen source revisions: `sourceHead = f0216273`, `testHead = f88fef44`
- All 14/14 discovered callers included
- Token estimates use deterministic `chars/4`, distinguished from Repomix `o200k_base`

**Output:**
- Writes `.context-packets/benchmark-<timestamp>.json` with byte/char/token breakdowns
- Terminal summary table with delta percentages

**Exit Codes:**
- `0`: Success, benchmark complete
- `1`: Packet missing or measurement failure

---

#### 7. `checkpoint-create` (OPT04)

**Purpose:** Create commit-aware checkpoint with distinct source/tool/test revisions and verified Sol D1/D3 sections.

**Usage:**
```powershell
node tools/ai-context/checkpoint-create --packet fnd03
```

**Options:**
- `--packet <id>`: Packet ID from `config.json` (required)
- `--config <path>`: Custom config path (optional)

**Checkpoint Schema (v1.1.0):**
```json
{
  "schemaVersion": "1.1.0",
  "packetId": "fnd03",
  "title": "FND03 Tenant & Resource Ownership Isolation Packet",
  "created": "2026-11-06T12:00:00.000Z",
  "repoHead": "f4ba1762...",
  "sourceHead": "f0216273...",
  "toolHead": "aa33e494...",
  "testHead": "f88fef44...",
  "solDecisionSections": [
    {
      "sectionId": "D1",
      "heading": "## D1. Private profile ownership and explicit tenant provenance",
      "sourceFile": "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
      "lineRange": [50, 92],
      "contentSha256": "abc123...",
      "verified": true
    },
    {
      "sectionId": "D3",
      "heading": "## D3. Tenant persistence, progress, exports and admin context",
      "sourceFile": "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
      "lineRange": [113, 143],
      "contentSha256": "def456...",
      "verified": true
    }
  ],
  "observedCheckpointRunnerEvidence": [
    {
      "command": "node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary",
      "recordedIn": "audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md",
      "observedResult": "Exit 1; six files, 60 passed / 1 failed"
    }
  ]
}
```

**Distinct Commit Revisions:**
- `repoHead`: Current HEAD (`git rev-parse HEAD`)
- `sourceHead`: Last commit touching production/schema/migration paths (`git log -n 1 --format=%H -- <paths>`)
- `toolHead`: Last commit touching `tools/ai-context/*` (`git log -n 1 --format=%H -- tools/ai-context`)
- `testHead`: Last commit touching security test paths (`git log -n 1 --format=%H -- <test-paths>`)

**Sol Decision Extraction:**
- Reads `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md`
- Extracts exact `## D1.` (lines 50-92) and `## D3.` (lines 113-143) section headings and ranges
- Computes SHA-256 hash of extracted content
- Does NOT hardcode architectural instructions - only references observed Sol decisions

**Output:**
- Writes `.context-packets/<id>-checkpoint.json`
- Terminal confirmation of distinct commits and verified Sol sections

**Exit Codes:**
- `0`: Success, checkpoint created
- `1`: Git HEAD unavailable, Sol decision file missing, or section extraction failed

---

#### 8. `checkpoint-validate` (OPT04)

**Purpose:** Validate checkpoint against current repository state.

**Usage:**
```powershell
node tools/ai-context/checkpoint-validate --file .context-packets/fnd03-checkpoint.json
```

**Options:**
- `--file <path>`: Path to checkpoint JSON file (required)
- `--config <path>`: Custom config path (optional)

**Validation Checks:**
1. **Repo HEAD Match:** Current HEAD matches `checkpoint.repoHead`
2. **Source HEAD Match:** Source file commit matches `checkpoint.sourceHead`
3. **Tool HEAD Match:** Tool file commit matches `checkpoint.toolHead`
4. **Test HEAD Match:** Test file commit matches `checkpoint.testHead`
5. **Sol Decision SHA-256 Match:** D1/D3 content hashes match recorded values

**Output:**
- Reports each validation check: `VALID` or `MISMATCH`
- Lists exact mismatches with expected vs actual commit SHAs
- Explains checkpoint invalidation reasons

**Exit Codes:**
- `0`: Checkpoint valid, all checks pass
- `1`: Checkpoint invalid - HEAD mismatch, Sol decision change, or schema version unsupported

**Checkpoint Invalidation Triggers:**
- New commits to source files after `sourceHead`
- New commits to tooling after `toolHead`
- New commits to tests after `testHead`
- Sol decision section content modified (SHA-256 mismatch)
- Working tree dirty (uncommitted changes)

---

#### 9. `host-inventory` (OPT05)

**Purpose:** Non-destructively inventory host instruction files and reference approved Sonnet documentation paths.

**Usage:**
```powershell
node tools/ai-context/host-inventory
```

**Options:**
- `--config <path>`: Custom config path (optional)

**Inventoried Paths:**
- `AGENTS.md` (if exists)
- `CLAUDE.md` (if exists)
- `.kiro/steering/*.md` (if directory exists)
- `.codex/` (if directory exists)
- `.claude/` (if directory exists)
- `.agents/` (if directory exists)
- `.gemini/` (if directory exists)

**Documentation References:**
- `DOC01`: `docs/ai-context/operating-guide.md` (this file)
- `DOC02`: `docs/ai-context/fnd-checkpoint-template.md`
- `DOC03`: `docs/ai-context/task-retrieval-guide.md`

**Output:**
- Writes `.context-packets/host-inventory.json` with:
  - File/directory existence flags
  - SHA-256 hashes for existing files
  - Byte sizes and modification times
  - Stale content warnings (e.g., `.kiro/steering/active-sprint.md` references Window 2 / Sprint 0)

**Exit Codes:**
- `0`: Success, inventory complete (always succeeds, non-destructive)

---

## Security Guardrails

### Path Confinement (OPT02)

**Enforcement:**
- All file paths resolved via `resolveRepoPath()` with strict repository-root confinement
- Rejects `..` parent traversal attempts
- Verifies symlink targets resolve inside repository root
- Throws `PATH_CONFINEMENT_ERROR` for violations

**Example Rejections:**
- `../outside.txt` → `PATH_CONFINEMENT_ERROR: Parent traversal ('..') is forbidden`
- Symlink pointing to `/etc/passwd` → `PATH_CONFINEMENT_ERROR: Symlink target escapes repository root`

### Forbidden Path Globs (OPT02)

**Configured in `config.json`:**
```json
"forbiddenPathGlobs": [
  "**/.env", "**/.env.*", "!**/.env.example", "!**/.env.template",
  "**/.npmrc", "**/*.pem", "**/*.key", "**/*.p12", "**/*.pfx",
  "**/credentials*.json", "**/secrets*.json", "**/*secret*.key",
  "**/id_rsa*", "**/id_ed25519*"
]
```

**Enforcement:**
- Evaluated via `globToRegExp()` and `matchGlobRules()` with `!` negation support
- Last matching rule wins (negation rules can allow specific files)
- Throws `FORBIDDEN_SECRET_PATH_GLOB` if file matched

**Example Matches:**
- `.env` → **BLOCKED** by `**/.env`
- `apps/api-server/.env.production` → **BLOCKED** by `**/.env.*`
- `.env.example` → **ALLOWED** by `!**/.env.example` negation rule
- `certs/server.pem` → **BLOCKED** by `**/*.pem`
- `ssh/id_ed25519` → **BLOCKED** by `**/id_ed25519*`

### Secret Content Patterns (OPT02)

**Configured in `config.json`:**
- PEM private key blocks
- Database URLs with non-placeholder passwords
- Live secret assignments (Upstash, QStash, Stripe, Resend, Supabase)
- GitHub PATs, AWS keys, Slack tokens, OpenAI/Anthropic keys
- Bearer JWT credentials

**Enforcement:**
- Scanned via regex patterns in `config.secretDenylist.contentPatterns`
- Secret values **never** printed to console or terminal output
- Only `valueRedactedFromOutput: true` flag appears in JSON reports
- Throws `FORBIDDEN_SECRET_CONTENT_DETECTED` if matched

### Default Exclude Globs (OPT02)

**Auto-excluded:**
- `node_modules/**`
- `.next/**`, `dist/**`, `build/**`, `coverage/**`
- `.turbo/**`, `.git/**`
- `.context-packets/**`, `graphify-out/**`

**Enforcement:**
- Applied to all file discovery operations
- Cannot be overridden by command-line arguments

---

## Fail-Closed Enforcement

### Budget Overflow (`--mode full`)

**Trigger:** `packetBytes > maxBytes` (default: 262,144 bytes)

**Behavior:**
1. Writes full untruncated packet to `.context-packets/<id>-packet.md`
2. Writes bounded chunk files: `.context-packets/<id>-full-chunk-part1.md`, `part2.md`, ...
3. Sets `completenessStatus = "FAILED_INCOMPLETE"`
4. Reports all overflowing files in JSON manifest
5. Provides chunk retrieval commands for agent use
6. Exits with code `1` (`PACKET_INCOMPLETE_FAIL_CLOSED`)

**Rationale:** Never silently truncates function bodies or test assertions

### Omitted Required Files (`--mode full`)

**Trigger:** Any file in `securityCriticalFiles`, `schemaAndMigrationFiles`, `securityTestFiles`, or `solDecisionFiles` is missing on disk

**Behavior:**
1. Sets `completenessStatus = "FAILED_INCOMPLETE"`
2. Lists every omitted file path in `omittedRequiredFiles` array
3. Exits with code `1` (`PACKET_INCOMPLETE_FAIL_CLOSED`)

**Rationale:** Security packets must include all required files explicitly

### Uncovered Callers (`--mode full`)

**Trigger:** Ripgrep caller search finds callers not already in required file list

**Behavior:**
1. Sets `completenessStatus = "FAILED_INCOMPLETE"`
2. Lists all uncovered callers in `uncoveredCallers` array with file path and match context
3. Exits with code `1` (`PACKET_INCOMPLETE_FAIL_CLOSED`)

**Rationale:** All callers must be explicitly enumerated for security review

### Navigation Mode Does NOT Fail-Closed

**Explicit Warning:** Navigation mode (`--mode navigation`) allows budget overflow and omits function bodies. It is explicitly marked `auditSafeForSecurityReview: false` and should never be used alone for security sign-off.

---

## Full-Source Fallback Behavior

### When Graph Is Stale or Unavailable

**Trigger:** Graph provenance check fails (MD5 mismatch, missing manifest, dirty working tree)

**Behavior:**
1. Marks query results `"advisory": true` with file-level mismatch reasons
2. Falls back to ripgrep (`rg.exe`) or `git grep` for caller discovery
3. Preserves symbol case in search patterns
4. Continues execution with warning - does NOT fail closed
5. Includes full source files in packet regardless of graph state

**Rationale:** Graph is a performance optimization, not a security dependency

### Ripgrep Execution Safety

**Error Handling:**
- Exit status `1` = zero matches (expected, not an error)
- Exit status `> 1` = execution error (throws `CALLER_SEARCH_EXECUTION_ERROR`)
- Spawn failure = execution error (throws `CALLER_SEARCH_EXECUTION_ERROR`)
- Validates regex syntax upfront to prevent command injection

**Fallback Chain:**
1. Primary: `rg.exe` from configured paths in `config.graphify.ripgrepFallbackPaths`
2. Secondary: `git grep` (always available in git repository)
3. If both fail: Includes empty results with execution error warning

---

## Checkpoint Validation

### When Checkpoints Become Invalid

**Automatic Invalidation:**
- New commits to source files after `sourceHead`
- New commits to tooling after `toolHead`
- New commits to tests after `testHead`
- Sol decision content modified (SHA-256 mismatch on D1 or D3 sections)
- Working tree dirty (uncommitted changes via `git status --porcelain`)

**Manual Invalidation:**
- Developer edits `.context-packets/<id>-checkpoint.json` directly
- Checkpoint file deleted or corrupted

### Recovery After Invalidation

**Workflow:**
1. Review changes that invalidated checkpoint
2. Verify changes don't contradict Sol decisions or security requirements
3. Run test suite to confirm no regressions
4. Create new checkpoint: `node tools/ai-context/context-cli.mjs checkpoint-create --packet <id>`
5. Validate new checkpoint: `node tools/ai-context/context-cli.mjs checkpoint-validate --file .context-packets/<id>-checkpoint.json`

**DO NOT:**
- Manually edit checkpoint file to "fix" mismatches
- Reuse stale checkpoints across incompatible revisions
- Skip checkpoint validation before starting task implementation

---

## Known Limitations

### 1. Graphify SQL Coverage

**Limitation:** Procedural PL/pgSQL `DO $$ ... END $$;` blocks and cross-language Drizzle TypeScript-to-SQL edges do not produce child symbol edges in `graph.json`.

**Mitigation:** Always include full SQL migration files and Drizzle schema files directly in `--mode full` packets.

**Affected Files:**
- `packages/db/migrations/0001_fnd03_add_tenant_ownership.sql`
- `packages/db-tutorial/migrations/0029_fnd03_add_tenant_to_progress.sql`
- `packages/db/src/schema/auth.ts`
- `packages/db-tutorial/src/schema/tutorial-progress.ts`

### 2. Dynamic and Next.js Route Callers

**Limitation:** Static AST edges in `graph.json` do not capture every dynamic caller or Next.js API route caller unless combined with lexical/regex search.

**Mitigation:** `build-packet --mode full` requires `uncoveredCallersCount === 0` against ripgrep/git grep caller scan.

**Example:** Next.js route `/api/auth/profile` calling `canAccessResource()` may not have static edge in graph, but ripgrep discovers it.

### 3. Token Estimation vs Model Billing

**Limitation:** Deterministic `Math.ceil(chars / 4)` token estimates do NOT match external Repomix `o200k_base` counts or model billing metrics.

**Rationale:** Different tokenizers produce different counts. The `chars/4` formula provides a deterministic, reproducible upper-bound estimate for budget gates.

**Example FND03 Discrepancies:**
- CLI estimate: ~53,649 tokens (`214,593 chars / 4`)
- Repomix `o200k_base`: 41,664 tokens (measured externally)
- Model billing: Varies by tokenizer (GPT-4, Claude, Gemini use different algorithms)

**Mitigation:** Use CLI estimates for budget gates only. Verify actual token usage in model UI after execution.

### 4. Host Instruction Files Not Modified

**Current State:** `AGENTS.md`, `CLAUDE.md`, and `.kiro/steering/*.md` are NOT automatically updated by this tooling.

**Reason:** No mandatory changes authorized until Sol grants final acceptance.

**Future Integration (after Sol acceptance):**
- Argon proposes minimal 3-line pointer in `AGENTS.md` and `CLAUDE.md`
- `.kiro/steering/active-sprint.md` remains stale (references Window 2 / Sprint 0)
- Sonnet DOC01-DOC03 documentation serves as authoritative guide until official integration

---

## Troubleshooting

### Error: `PATH_CONFINEMENT_ERROR`

**Cause:** Attempted `..` traversal or symlink escape outside repository root.

**Solution:** Use repository-relative paths only. Remove `..` segments.

**Example:**
```powershell
# ❌ WRONG
--extra-file "../outside.txt"

# ✅ CORRECT
--extra-file "audit/SomeDocument.md"
```

### Error: `CALLER_SEARCH_EXECUTION_ERROR`

**Cause:** Ripgrep exit status > 1 or spawn failure.

**Solution:**
1. Verify `rg.exe` is available on PATH or in configured `ripgrepFallbackPaths`
2. Check regex syntax is valid
3. Fallback to `git grep` if ripgrep unavailable

**Example:**
```powershell
# Test ripgrep manually
rg.exe "canAccessResource" --type ts

# Verify git grep fallback
git grep "canAccessResource" -- "*.ts"
```

### Error: `PACKET_INCOMPLETE_FAIL_CLOSED: BUDGET_OVERFLOW_IN_FULL_SECURITY_MODE`

**Cause:** Packet exceeds `sourcePacketBudget.maxBytes` in `--mode full`.

**Solution:**
1. Review `.context-packets/<id>-packet.json` manifest
2. Load `.context-packets/<id>-navigation-packet.md` for orientation
3. Load specific chunks: `.context-packets/<id>-full-chunk-part1.md`, `part2.md`, ...
4. **DO NOT** use `--mode navigation` alone for security sign-off

**Chunk Retrieval Pattern:**
```powershell
# 1. Review navigation outline first
cat .context-packets/fnd03-navigation-packet.md

# 2. Load specific full chunks as needed
cat .context-packets/fnd03-full-chunk-part1.md
cat .context-packets/fnd03-full-chunk-part2.md
```

### Error: `REPO_HEAD_MISMATCH` / `SOURCE_HEAD_MISMATCH`

**Cause:** Checkpoint validation failed - current commit doesn't match checkpoint.

**Solution:**
1. Review `git log` to see what changed
2. Verify changes don't contradict Sol decisions
3. Run test suite to confirm no regressions
4. Create new checkpoint: `checkpoint-create --packet <id>`

**Example:**
```powershell
# Check what changed
git log f0216273..HEAD -- packages/auth/src/rbac/

# Review Sol decisions
cat audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md

# Create new checkpoint after verification
node tools/ai-context/context-cli.mjs checkpoint-create --packet fnd03
```

### Warning: `Graph marked advisory - MD5 mismatch`

**Cause:** Graphify graph is stale - source files changed after last `graphify update .`.

**Solution:**
1. Run `graphify update .` to rebuild graph
2. Re-run `record-graph-provenance --packet <id>`
3. Verify 27/27 FND03 AST MD5 hashes match

**Example:**
```powershell
# Update graph
graphify update .

# Record fresh provenance
node tools/ai-context/context-cli.mjs record-graph-provenance --packet fnd03

# Verify in output: all 27/27 AST hashes verified
```

---

## Best Practices

### 1. Always Use `--mode full` for Security Sign-Off

**Rationale:** Navigation mode strips function bodies and test assertions.

**Practice:**
- Initial orientation: `--mode navigation`
- Security review: `--mode full` (fail-closed)
- Budget overflow: Load bounded chunks, not navigation outline alone

### 2. Validate Checkpoints Before Starting Implementation

**Rationale:** Prevents working from stale Sol decisions or outdated source.

**Practice:**
```powershell
# Before starting task
node tools/ai-context/context-cli.mjs checkpoint-validate --file .context-packets/fnd03-checkpoint.json

# If valid, proceed
# If invalid, create new checkpoint after reviewing changes
```

### 3. Run `verify-canaries` After Config Changes

**Rationale:** Confirms security guardrails still enforced.

**Practice:**
```powershell
# After editing config.json
node tools/ai-context/context-cli.mjs verify-canaries

# Verify all 15/15 checks PASS before committing
```

### 4. Update Graph Provenance After Source Changes

**Rationale:** Keeps graph queries reliable and prevents stale advisory warnings.

**Practice:**
```powershell
# After committing source changes
graphify update .
node tools/ai-context/context-cli.mjs record-graph-provenance --packet fnd03

# Verify in output: 27/27 AST hashes verified
```

### 5. Review Benchmark Before Claiming Optimization

**Rationale:** Verifies identical security coverage and actual byte savings.

**Practice:**
```powershell
# Generate benchmark report
node tools/ai-context/context-cli.mjs benchmark --packet fnd03

# Verify identical 30-file set in rows 1-3
# Confirm -47.01% savings vs conventional workflow
# Check `.context-packets/benchmark-<timestamp>.json` for details
```

---

## Integration Status

**Current State:** IMPLEMENTED_UNVERIFIED

**Pending:**
- Gemini VAL01-VAL12 independent validation
- Sol final acceptance

**Not Yet Authorized:**
- Modifications to `AGENTS.md` or `CLAUDE.md`
- Changes to `.kiro/steering/*.md`
- Mandatory use in Tera TC01-TC20 workflow

**Optional Use:**
- Developers may use tooling voluntarily for context optimization
- All workflows continue without tooling until Sol acceptance

**Next Steps:**
1. Sonnet completes DOC01-DOC03 (this file + fnd-checkpoint-template.md + task-retrieval-guide.md)
2. Gemini executes VAL01-VAL12 independent validation
3. Sol reviews validation results and grants/denies final acceptance
4. If accepted: Argon updates `AGENTS.md`/`CLAUDE.md` with minimal integration pointer

---

## References

**Configuration:** `tools/ai-context/config.json` (schema v1.1.0)  
**CLI Implementation:** `tools/ai-context/context-cli.mjs` (v1.1.0, commit aa33e494)  
**Assignment:** `audit/Argon_Developer_Context_Optimization_Assignment.md` (OPT01-OPT05)  
**Handoff Report:** `audit/Argon_Context_Optimization_Handoff.md` (v1.1.0 corrections)  
**Sol Decisions:** `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md` (D1, D3)  
**Related Documentation:**
- `docs/ai-context/fnd-checkpoint-template.md` (DOC02 - checkpoint schema reference)
- `docs/ai-context/task-retrieval-guide.md` (DOC03 - task workflow integration)

---

**Version History:**
- v1.1.0 (2026-11-06): Initial documentation by Claude Sonnet 4.5 (DOC01)
- Authority: Argon v1.1.0 implementation at commit aa33e494
- Status: Awaiting Gemini VAL01-VAL12 validation and Sol final acceptance
