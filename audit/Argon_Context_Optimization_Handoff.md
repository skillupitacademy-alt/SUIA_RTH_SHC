# Argon Context Optimization Handoff (`OPT01`–`OPT05`)

- **Assigned project role**: `Argon` (`OPT01`–`OPT05` tooling implementation and integration)
- **Runtime model**: Gemini 4 Argon (Medium)
- **Packet**: `audit/Argon_Developer_Context_Optimization_Assignment.md` (`OPT01`–`OPT05`)
- **Baseline branch & commit**: `remediation/w1-2-batch-05-targeted` @ `62c0072e9557b4c9cd119aadb6c9656d6211edd8`
- **Governing Sol policy commit**: `c166119ab79a260d57069c9535e69aec433eeaf5` (`audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md`)
- **Scope**: Developer context optimization tooling (`tools/ai-context/config.json`, `tools/ai-context/context-cli.mjs`), `.gitignore` ignore rule for local generated packets (`/.context-packets/`), and this handoff report (`audit/Argon_Context_Optimization_Handoff.md`). Zero production code, schema, migration, or existing test modifications.
- **Next handoff**:
  1. **Claude Sonnet 4.5** (`DOC01`–`DOC03` documentation authoring in `docs/ai-context/*`)
  2. **Gemini** (`VAL01`–`VAL12` independent validation in `tests/tooling/ai-context/*` and `audit/Gemini_Context_Optimization_Validation.md`)
  3. **Sol** (final architectural acceptance)

---

## 1. Pre-Edit Plan & Post-Edit File Manifest

### Allowed & Modified / Created Repository Files

| File Path | Action | Item Scope | Purpose |
| :--- | :--- | :--- | :--- |
| `.gitignore` | Modified | `OPT02` / `OPT03` | Narrowly ignores `/.context-packets/` so generated local context packets, benchmark artifacts, and checkpoint files do not pollute git status. |
| `tools/ai-context/config.json` | Created | `OPT01`–`OPT04` | Single canonical configuration defining Graphify paths/SQL parser metadata, `explorationBudget` / `sourcePacketBudget` / `terminalSummaryBudget`, `secretDenylist` patterns, default exclusions, and the `fnd03` packet + conventional baseline definitions. |
| `tools/ai-context/context-cli.mjs` | Created | `OPT01`–`OPT05` | Executable Node.js CLI implementing `sql-coverage`, `query-graph`, `build-packet`, `benchmark`, `checkpoint-create`, `checkpoint-validate`, and `host-inventory`. Uses only Node.js built-ins (`node:crypto`, `node:child_process`, `node:fs`, `node:path`, `node:url`) for offline determinism. |
| `audit/Argon_Context_Optimization_Handoff.md` | Created | `OPT01`–`OPT05` | This completion report, benchmark evidence, host-instruction inventory, rollback plan, and handoffs. |

### Out-of-Scope Files Verified Untouched
- No production source files under `apps/**`, `packages/**`, or `src/**` were modified.
- No database migrations or schemas were modified.
- `AGENTS.md` and `CLAUDE.md` were inventoried non-destructively (not edited yet; proposed minimal reference diff is provided in Section 6 for Sol review).
- `docs/ai-context/*` was not created (reserved for **Claude Sonnet 4.5** under `DOC01`–`DOC03`).
- `tests/tooling/ai-context/*` and `audit/Gemini_Context_Optimization_Validation.md` were not created (reserved for **Gemini** under `VAL01`–`VAL12`).

---

## 2. Environment & Dependency Versions

| Tool / Dependency | Exact Version / Path | Role in Context Workflow |
| :--- | :--- | :--- |
| **Node.js** | Built-in ESM runtime (`node`) | Executes `tools/ai-context/context-cli.mjs` offline with zero external npm runtime dependencies. |
| **Graphify + `tree_sitter_sql`** | `graphify` CLI with Python `tree-sitter-sql` installed (`35,981` nodes, `85,733` edges, `1,278` communities) | Structural AST & SQL graph extraction (`graphify-out/graph.json`). |
| **ripgrep (`rg`)** | `ripgrep 15.2.0` (`C:\Users\RealTutorialHub\AppData\Local\Microsoft\WinGet\Packages\BurntSushi.ripgrep.MSVC_Microsoft.Winget.Source_8wekyb3d8bbwe\ripgrep-15.2.0-x86_64-pc-windows-msvc\rg.exe` and `C:\Users\RealTutorialHub\.gemini\tmp\bin\rg.exe`, with automatic fallback to `git grep -l -E`) | Deterministic caller and text fallback when Graphify is advisory/incomplete. |
| **Repomix** | `repomix 1.14.0` (`tiktoken` `o200k_base` token counter) | External calibration reference for compressed vs uncompressed FND03 packets in `E:\AI-Context-Packets\`. |

---

## 3. Item-by-Item Implementation & Verification Summary (`OPT01`–`OPT05`)

### `OPT01`: Graphify SQL Coverage & Provenance-Checked Query Wrapper

1. **SQL Extraction Verification (`sql-coverage`)**:
   - Command: `node tools/ai-context/context-cli.mjs sql-coverage`
   - Result: Verified `graphify-out/graph.json` contains **35,981 nodes**, **85,733 edges**, and **833 SQL nodes across 131 distinct `.sql` files**. The previous `warning: 131 .sql file(s) contributed nothing — install tree-sitter-sql` is completely resolved.
   - Both FND03 migrations (`packages/db/migrations/0001_fnd03_add_tenant_ownership.sql` and `packages/db-tutorial/migrations/0029_fnd03_add_tenant_to_progress.sql`) are indexed in `graphify-out/graph.json`.
   - **Documented Parser Boundary**: `tree_sitter_sql` indexes `.sql` file nodes, `CREATE TABLE` nodes, and `CREATE INDEX` nodes, but procedural PL/pgSQL `DO $$ BEGIN RAISE EXCEPTION ... END $$;` blocks (such as the fail-closed migration guards in `0001` and `0029`) and `ALTER TABLE` statements do not emit separate child symbol nodes, nor are Drizzle TypeScript `pgTable` definitions linked to SQL DDL via cross-language graph edges. Consequently, `context-cli.mjs` always embeds the full `.sql` migration files and Drizzle schema files in `full` security packets.
2. **Provenance & Fallback Query Wrapper (`query-graph`)**:
   - Command: `node tools/ai-context/context-cli.mjs query-graph "canAccessResource isValidTenantPair 0001_fnd03_add_tenant_ownership"`
   - Checks `graphify-out/graph.json` modification time and git working tree cleanliness against `HEAD`. When the worktree is dirty or `graph.json` is not strictly tied to a clean `HEAD`, sets `"advisory": true` with an explicit `"advisoryReason"`.
   - Enforces `explorationBudget` (`maxBytes: 16384`, `maxResults: 15`), emits explicit truncation metadata (`truncated`, `incompletenessReason`), and runs `ripgrep` / `git grep` fallback (`sourceFallbackResults`).

### `OPT02`: Reproducible Source Packet Generator & Security Controls (`build-packet`)

- Command:
  - Full security packet: `node tools/ai-context/context-cli.mjs build-packet --packet fnd03 --mode full` (add `--allow-dirty` when testing uncommitted worktree state)
  - Structural navigation packet: `node tools/ai-context/context-cli.mjs build-packet --packet fnd03 --mode navigation`
- **Outputs**:
  - `.context-packets/fnd03-packet.md` + `.context-packets/fnd03-packet.manifest.json`
  - `.context-packets/fnd03-navigation-packet.md` + `.context-packets/fnd03-navigation-packet.manifest.json`
- **Why Pure `--compress` / Structural Outlines Are Never Used Alone for Security Sign-Off**:
  - Comparing `E:\AI-Context-Packets\FND03-RBAC-Structure.md` (`--compress`, 6,038 tokens) against uncompressed source proved that AST compression strips:
    1. `brand: auth.brand || 'realtutorialhub'` at `packages/auth/src/rbac/rbac.adapter.ts:64` (an active FND03 P1 defect flagged by Sol D1).
    2. The implementation bodies of `isValidTenantPair`, `hasPermissionOrOwnership`, `isOwner`, and `canAccessResource` in `packages/auth/src/rbac/ownership.service.ts`.
    3. The `ROLE_PERMISSIONS` mapping in `packages/auth/src/rbac/role-permissions.ts` (`ROLES.STUDENT` holding `PROFILE_READ` / `PROFILE_WRITE`, which Sol D1 ordered removed).
    4. All `expect(...)` assertions inside `sol-fnd03-tenant-boundary.test.ts` and `ownership.service.test.ts`.
  - Therefore, `--mode full` preserves 100% of function bodies, line numbers, callers, Drizzle schemas, SQL migrations, negative security tests, and Sol D1/D2 decision documents uncompressed.
- **Complete FND03 Caller Coverage**:
  - Using `ripgrep` (`canAccessResource|requirePermissionOrOwnership|hasPermissionOrOwnership|isOwner|createOwnershipChecker|withOwnershipRBAC|withRBAC|createRBACUser|OwnershipRBACService`), `build-packet` verifies all **14 matching files** across `packages/auth` and `apps/api-server` are included (`uncoveredCallersCount: 0`), including `apps/api-server/src/app/api/auth/onboarding/route.ts` (which also contains a residual `'realtutorialhub'` fallback at lines 79 and 87).
- **Mandatory Security Controls Verified**:
  1. **Repo-Root Path Confinement**: `resolveRepoPath()` rejects any `..` traversal segment or symlink resolving outside `REPO_ROOT`. Verified with `--extra-file "../outside.txt"` -> exits `1` with `PATH_CONFINEMENT_ERROR`.
  2. **Secret Denylist Scan**: `scanContentForSecrets()` blocks `.env*` (except `.env.example`), `.npmrc`, `.pem`/`.key`/`.p12`/`.pfx`, private key headers, non-local DB URLs with passwords, and live token assignments without printing the matched secret value. Verified with `--extra-file ".npmrc"` -> exits `1` with `SECRET_SCAN_ABORT`.
  3. **Dirty Worktree Guard**: Refuses to build a packet on a dirty worktree unless `--allow-dirty` is passed, and records exact `dirtyFiles` SHA-256 hashes in `.manifest.json`.

### `OPT03`: Token / Byte Budget Gates & Comparable FND03 Benchmark (`benchmark`)

- Command: `node tools/ai-context/context-cli.mjs benchmark --packet fnd03`
- Artifact: `.context-packets/fnd03-benchmark.json`
- All recipes were measured on the **same frozen `HEAD` (`62c0072e9557b4c9cd119aadb6c9656d6211edd8`)** using identical counting methods (`Buffer.byteLength` for UTF-8 bytes, `.length` for characters, and deterministic `Math.ceil(chars / 4)` for token estimates, alongside external Repomix 1.14.0 `o200k_base` token counts):

| Recipe / Artifact | Files Included | Exact Bytes | Exact Chars | Lines | Deterministic Tokens (`chars/4`) | Repomix `o200k_base` Tokens | Delta vs Conventional Baseline | Audit-Safe for Security Sign-Off? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Conventional Unscoped Baseline** (`GRAPH_REPORT.md` + full Tera/Gemini/Sol handoffs + FND03 source/tests/migrations) | 33 | `426,162` | `425,772` | `10,127` | `106,443` | N/A | Baseline (`0.00%`) | Yes (but exceeds `262,144` B budget by `1.63x` and injects unrelated `TC04`–`TC20` noise) |
| **2. Optimized Full FND03 Packet** (`.context-packets/fnd03-packet.md`, `--mode full`) | 30 | `220,693` | `220,385` | `5,152` | `55,097` | ~`41,664` (25-file Repomix ref) | **`-48.21%`** (`-205,469` B) | **Yes** (100% uncompressed FND03 code, 14/14 callers, schemas, SQL migrations, negative tests, and Sol D1/D2 decisions; within `262,144` B budget) |
| **3. Optimized Navigation Outline Packet** (`.context-packets/fnd03-navigation-packet.md`, `--mode navigation`) | 30 | `39,468` | `39,378` | `1,001` | `9,845` | ~`6,038` (13-file Repomix `--compress` ref) | **`-90.74%`** (`-386,694` B) | **No** (navigation/orientation only; function bodies & test assertions stripped) |

### `OPT04`: Commit-Aware FND Session-Resumption Checkpoints (`checkpoint-create` & `checkpoint-validate`)

- Commands:
  - Create: `node tools/ai-context/context-cli.mjs checkpoint-create --packet fnd03`
  - Validate: `node tools/ai-context/context-cli.mjs checkpoint-validate --file .context-packets/fnd03-checkpoint.json`
- **Fail-Closed Guarantees Verified**:
  1. Records `sourceHead`, `toolHead`, `testHead` (`62c0072e9557b4c9cd119aadb6c9656d6211edd8`), `solDecisionPath` (`audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md`), `solDecisionRevision` (`c166119ab79a260d57069c9535e69aec433eeaf5`), `solDecisionSha256`, and SHA-256 fingerprints for all 30 tracked FND03 files.
  2. Fails closed (`exitCode = 1`) when `HEAD` changes (verified via `--simulate-head 0000000000000000000000000000000000000000`), when any tracked file hash changes, when any tracked file is dirty without `--allow-dirty`, or if `status === "CLOSED"` (since only Sol holds closure authority).
  3. Enforces `autoExecuteCommands: false`; `verificationCommandsAdvisoryOnly` are never executed by the validator.

### `OPT05`: Non-Destructive Host Instruction Inventory & Proposed Minimal Reference Diff

- Command: `node tools/ai-context/context-cli.mjs host-inventory`
- Artifact: `.context-packets/host-inventory.json` (redacts all credential/setting values).

| Host Path | Host / Agent | Status | Findings / Scope Conflicts |
| :--- | :--- | :---: | :--- |
| `AGENTS.md` | All Agents / Graphify / Antigravity / Codex | `present` (13 lines, 1,197 B) | Contains `## graphify` rules only; does not yet reference `tools/ai-context/context-cli.mjs` or `docs/ai-context/WORKFLOW.md`. |
| `CLAUDE.md` | Claude Code / Claude Sonnet | `present` (10 lines, 1,073 B) | Contains `## graphify` rules only; does not yet reference `tools/ai-context/context-cli.mjs` or `docs/ai-context/WORKFLOW.md`. |
| `.kiro` | Kiro IDE | `present` (`settings`, `specs`, `steering`) | **CONFLICT DETECTED**: `.kiro/steering/active-sprint.md` references stale `Window 2 / Sprint 0` scope, conflicting with current W1–W3 remediation governance under Sol. |
| `.codex` | OpenAI Codex CLI | `present` (`config.toml`) | Present; no environment or token values dumped. |
| `.claude` | Claude Code CLI | `present` (`settings.local.json`) | Present; no environment or token values dumped. |
| `.agents` | Workspace Agent Skills & Workflows | `present` (`skills`, `workflows`) | Contains legacy/workspace skills and evidence archives. |
| `.gemini` | Gemini / Antigravity Workspace Config | `absent` | Absent at workspace root (Antigravity uses user-level `~/.gemini/antigravity` + repo `AGENTS.md`). |

#### Proposed Minimal Host-Instruction Diff (For Sol Review — Not Applied Yet)

Once **Claude Sonnet 4.5** authors `docs/ai-context/WORKFLOW.md` (`DOC01`–`DOC03`) and **Gemini** validates the workflow (`VAL01`–`VAL12`), `AGENTS.md` and `CLAUDE.md` can each be updated with the following minimal 3-line pointer block (keeping `docs/ai-context/WORKFLOW.md` as the single canonical workflow document):

```diff
+## AI Context Packets & Checkpoints
+- Canonical workflow & security packet rules: see `docs/ai-context/WORKFLOW.md` and `tools/ai-context/config.json`.
+- Build task-scoped packets and validate checkpoints via `node tools/ai-context/context-cli.mjs <subcommand>`; never use compressed/navigation outlines alone for security sign-off.
```

---

## 4. Rollback Procedure

If any part of `OPT01`–`OPT05` needs to be rolled back:
1. Delete generated local artifacts: `Remove-Item -Recurse -Force .context-packets`
2. Revert the commit or remove `tools/ai-context/config.json`, `tools/ai-context/context-cli.mjs`, `audit/Argon_Context_Optimization_Handoff.md`, and the `/.context-packets/` line in `.gitignore`.
3. Because zero production code, schemas, migrations, or existing tests were modified, rollback has zero runtime or database impact.

---

## 5. Required Sequential Handoffs

### Next required model — Claude Sonnet 4.5
- **Assigned Scope**: `DOC01`–`DOC03` in `audit/Argon_Developer_Context_Optimization_Assignment.md`
- **Allowed Files**:
  - `docs/ai-context/WORKFLOW.md`
  - `docs/ai-context/SECURITY_GUARDRAILS.md`
  - `docs/ai-context/BENCHMARKS_AND_LIMITATIONS.md`
  - `audit/Sonnet_Context_Optimization_Documentation_Handoff.md`
- **Key Inputs from Argon**:
  - `tools/ai-context/config.json` and `tools/ai-context/context-cli.mjs`
  - Measured benchmark numbers and parser/compression boundaries in Section 3 of this handoff (`audit/Argon_Context_Optimization_Handoff.md`).

### Next required model — Gemini
- **Assigned Scope**: `VAL01`–`VAL12` independent validation in `audit/Argon_Developer_Context_Optimization_Assignment.md`
- **Allowed Files**:
  - `tests/tooling/ai-context/*`
  - `audit/Gemini_Context_Optimization_Validation.md`
- **Key Verification Targets**:
  - Independently execute `sql-coverage`, `query-graph`, `build-packet`, `benchmark`, `checkpoint-create`, `checkpoint-validate`, and `host-inventory`, plus negative tests for path traversal (`..`), secret denylist aborts, stale `HEAD` checkpoint rejection, and `FND03` completeness (`VAL01`–`VAL12`).

### Next required model — Sol
- **Assigned Scope**: Final architectural review and acceptance of `OPT01`–`OPT05`, `DOC01`–`DOC03`, and `VAL01`–`VAL12`, plus approval to apply the minimal pointer diff to `AGENTS.md` / `CLAUDE.md` and proceed with the next bounded `FND03` / `TC18` implementation assignment.
