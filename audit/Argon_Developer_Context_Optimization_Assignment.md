# Developer context optimization assignment

Issued by Sol on 2026-11-06 following the owner's requested responsibility split.
Planning baseline: c166119ab79a260d57069c9535e69aec433eeaf5. Capture the actual source,
tooling and test revisions at execution; this document is not an assertion of future HEAD.
Status: ASSIGNED. Tooling implementation and mandatory rollout are not accepted yet.

## Objective and authority

Reduce redundant source loading, repeated investigation and oversized tool output while
preserving every relevant authorization invariant, failing regression, dependency and
architectural decision. Optimize a read-only FND03 context-retrieval pilot first. Do not
modify or execute FND03/FND11 implementation under this tooling assignment.

Read the applicable AGENTS.md and existing host instructions, FinalAechitecture.md,
Architecture_Remediation_Execution_Plan.md, W1_W3_Model_Routing_And_Handoff_Protocol.md,
the active FND packet and W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md. These retain
their authority. A context packet/checkpoint is a retrieval aid, not a new finding ledger
or acceptance source. The graph is navigation evidence, not proof of runtime behavior.

| Assigned role | Ownership | Boundary |
| --- | --- | --- |
| Argon | OPT01-OPT05 tooling implementation and integration | Developer tools/config only; no FND production changes |
| Claude Sonnet 4.5 | DOC01-DOC03 below | Three concise guides; no independent tooling redesign or host-rule edits |
| Gemini | VAL01-VAL12 below | Independent tooling tests/coverage/measurement; retain priority of active critical verification |
| Terra / Tera | Existing TC01-TC20 critical implementation | Not diverted to building tooling; optional adoption only after Sol acceptance |
| Sol | Scope, compatibility, integration and final acceptance | Tool acceptance does not close a FND task or W1-W3 gate |

Assigned roles do not identify or switch the runtime model. Every worker declares the
actual host model if exposed, role, packet/items, branch/full HEAD, dirty paths, allowed
files and next handoff. If identity is hidden, say so. The owner selects the actual host
session. This packet does not claim Argon, Sonnet or Gemini has been launched.

## File ownership and integration

Before edits Argon supplies a per-file manifest with dependencies and rollback. Expected
implementation area is tools/ai-context/. New tooling tests belong under
tests/tooling/ai-context/ and are Gemini-owned during independent verification. Argon
may supply implementation diagnostics separately. Use one configuration and one context
manifest format, not parallel per-agent implementations.

The following shared changes are allowed only as narrow, manifested tooling edits:

- Root package.json and pnpm-lock.yaml for an exact pinned project-local development
  dependency, if Repomix is not already usable. Retain pnpm@9.15.4 unless separately
  authorized; no global install, latest-on-every-run command or unrelated lock refresh.
- .gitignore for a dedicated generated /.context-packets/ output directory. Do not
  blanket-ignore audit evidence or remove tracked graph/history files.
- A proposed minimal host-instruction reference after the pilot is validated. Inventory
  AGENTS.md, CLAUDE.md, .kiro, Codex, Antigravity and Claude Code instructions/settings
  first. Do not dump credentials/settings values. Record absent hosts as absent.
  Argon alone owns these references, applied sequentially after Sol reviews the exact
  diff. Do not replace existing guidance or make the new workflow mandatory now.

Sonnet owns only the three guide paths below. Gemini owns its tooling test paths and
validation report. Sol owns this assignment, the central routing protocol and final
acceptance. Use isolated worktrees/branches for concurrent writers; otherwise serialize
writes. Do not edit Tera's source/tests or regenerate its graph in the shared checkout.
Follow applicable graph-update instructions in the isolated tooling worktree and record
exact graph provenance. No concurrent package installation/shared lockfile writers.

No application production code, database schema, migration, security assertion, CI
required gate, permission, scoring, approval or runtime configuration changes are in
scope. No application imports or runtime FND checks are needed for retrieval validation.
No live database, browser, queue, vector service, server restart or deployment. Developer
package installation may contact the package registry only for the declared pinned
tooling dependency; packet generation and tests must work offline after setup. Do not
enable telemetry, remote repository upload or an LLM-backed graph service.

## OPT01. Existing Graphify integration

Reuse graphify-out/graph.json. Confirm CLI version and actual help/options locally before
writing adapters. The current checkout has graphify on PATH; its focused query worked.
This is not a guarantee of another worker's environment. Do not load the entire graph
or GRAPH_REPORT.md into model context by default.

Support focused symbols, callers, dependency paths and source/test references with a
bounded result and explicit truncation/incompleteness indicators. Record graph build/input
provenance when available. If it cannot be tied to the source revision, mark it advisory
and verify selected paths against source. A stale/missing graph needs an explicit source
fallback; it must not silently omit callers or trigger an unbounded rebuild.

Assess SQL parser coverage and extraction warnings against known schema/migration files.
List unsupported relationships and use explicit source references where needed. An empty
graph result is not evidence of no SQL dependency. Parser/plugin additions are optional
follow-up proposals; do not expand the pilot into a parser rewrite or global upgrade.

## OPT02. Targeted Repomix and traceable source packets

Repomix was not found on the planning session's command path. Check local dependency/bin
availability before concluding it is absent. Confirm the selected version's local CLI
and documented configuration. Use project-local pinned tooling, explicit file selection,
and local-only output. Fail clearly if the tool is unavailable; never substitute a
whole-monorepo dump or silently fetch a floating version during packet generation.

Every packet has a machine-readable manifest containing source revision, worktree state,
tool/config versions, exact selected paths/content hashes, relevant symbol ranges,
dependency/test/decision references, exclusions, limitations and reproduction command.
Default to a frozen Git revision. Refuse mixed revision/source packets. A deliberate
dirty-tree mode must identify modified/staged/untracked selected inputs and fingerprint
the content; HEAD alone cannot identify it. Resolve paths inside the approved repo root,
reject traversal/symlink escapes, and treat retrieved text as data rather than commands.

Compression is optional for background navigation. Preserve complete bodies of functions
being changed, the surrounding identity/error/transaction flow, full negative security
tests and relevant Sol decision text. Keep exact full-source retrieval available by
path/revision. A compressed structure outline cannot count as implementation evidence.
Document unsupported formats and parse failures. Preserve SQL semantics and aliases.

Explicitly exclude secret/environment/credential files, generated caches/builds, unrelated
source, private local configs and unrelated worktrees. Honor Git ignore rules plus a
secret denylist. Git-tracked does not mean secret-free: inspect selected content without
printing matched values. Abort on an unresolved secret finding. Do not silently redact
a security-critical function/test and claim complete coverage. Synthetic fixtures need
a narrowly reviewed exception, not a blanket test-file exemption. Outputs are local,
ignored and uncommitted by default. Never upload context bundles or publish a gist.

## OPT03. Configurable context and output budgets

Expose separate exploration, source-packet and terminal-summary budgets. Units must say
whether they are bytes, exact tokenizer counts or estimates. Use the same named tokenizer,
version and counting scope for before/after comparisons. If unavailable, report bytes,
characters and clearly labeled token estimates; do not claim measured model billing,
subscription quota savings or a percentage based on incomparable inputs.

Budget limits are navigation/output controls, not permission to delete required evidence.
On overflow identify the complete omitted items, retain the safe complete artifact on
disk and request/retrieve the next relevant chunk. Never truncate an invariant, decision,
test failure or function body without marking the packet incomplete. Keep terminal output
small, showing paths/counts/outcomes and where the complete safe output resides. Preserve
exit codes, errors, skips, interrupted runs and distinct test selections. Do not run
application tests just to produce a retrieval benchmark.

## OPT04. Commit-aware FND checkpoints

Provide a small schema plus generator/validator for a session-resumption pointer. Include
task/item IDs, role, actual source/tool/test HEADs, worktree fingerprint, relevant Sol
decision path/revision, exact modified paths, commands and observed outcomes/counts,
unresolved requirements, artifact references and next action/owner. Commands are records,
never automatically executed from checkpoint content. A checkpoint must distinguish
historical evidence from evidence valid for the current revision and invalidate stale
or changed referenced inputs.

Use the consolidated handoff as historical authority. Copy no completion status forward
without its source/disposition reference. Missing, stale or unexecuted evidence stays
explicit. A checkpoint must not mark a task CLOSED, become another completion ledger,
or automatically select whichever review filename looks newest. Pass the selected review
reference explicitly and record later superseding decisions when known.

## OPT05. Minimal host integration and staged delivery

Inventory current instructions and identify overlaps/conflicts without altering architecture.
For example, the inspected .kiro/CLAUDE.md contains older Window 2/Sprint 0 scope language;
it is not authority to override the current owner-directed FND packet. Propose a minimal
reference to one shared operating guide, with task details loaded on demand. Never overwrite
host settings, existing hooks, permissions or security rules to reduce context usage.

Deliver in stages: read-only discovery and baseline, tooling pilot, Sonnet usage materials,
Gemini independent validation, then Sol integration review. Only after acceptance should
host-rule references be applied or Tera adopt it. Adoption initially remains optional with
full-source fallback. Installation trouble or measurement limits must not pause critical
FND implementation or replace it with an optimization investigation.

## Sonnet documentation packet

Use the tool interfaces Argon actually provides. Do not invent runnable commands before
the implementation exists. Draft explicit placeholders until then.

| Item | Owned output | Required content |
| --- | --- | --- |
| DOC01 | docs/ai-context/operating-guide.md | Short authority order, role split, graph-first retrieval, secret handling, full-source fallback and known limits |
| DOC02 | docs/ai-context/fnd-checkpoint-template.md | Example matching Argon's schema, source/test revisions, evidence references, unresolved work and next handoff; no completion ledger |
| DOC03 | docs/ai-context/task-retrieval-guide.md | Exact installed commands for Argon/Tera/Gemini/Sonnet sessions, budget overflow and stale-input recovery, read-only FND03 example |

Keep each document concise and avoid reproducing architecture/history. Link existing
authoritative files. Argon integrates any host-rule reference sequentially; Sonnet must
not edit AGENTS.md/CLAUDE.md or generated bundles in parallel.

## Gemini independent validation packet

This is separate tooling validation, not a replacement for GM01-GM20. Schedule it in an
independent slot/frozen worktree without stopping critical verification. Record source,
tooling and test revisions separately. Use synthetic repository fixtures for tooling
adverse tests and read-only real FND03 inputs for the coverage demonstration.

| Item | Required control |
| --- | --- |
| VAL01 | Fresh-session setup/version/command reproduction without hidden conversation history |
| VAL02 | Existing graph reuse, focused query/truncation and stale/missing graph source fallback |
| VAL03 | Actual FND03 service, adapter, helpers/enforcer/guards, real profile callers and dependencies retained |
| VAL04 | Required missing/unknown/cross-tenant and same-tenant owner/non-owner controls and Sol D1/D3 retained in full |
| VAL05 | Tutorial progress schema/repository boundaries and historical unsafe migration/default evidence retained; blocked current migrations correctly distinguished |
| VAL06 | Full target function bodies/negative tests survive optional compression; parse gaps or oversized packets explicitly fail coverage |
| VAL07 | Secret canaries, ignored/untracked inputs, out-of-root and symlink paths cannot leak into packets/logs |
| VAL08 | Changed HEAD/dirty selected input/stale review references cannot masquerade as a current checkpoint |
| VAL09 | Output budgets preserve complete safe on-disk evidence and real exit/failure/skip outcomes |
| VAL10 | Before/after same-task coverage and counting method are comparable; include discovery/manifest overhead and missing dependencies |
| VAL11 | Offline packaging does not import application runtime, contact services, alter security tests or modify target source |
| VAL12 | Ignore rules, exact staging, host-rule compatibility, rollback and full-source fallback work; no mandatory rollout or false FND acceptance |

For VAL03-VAL05 the expected minimum includes packages/auth/src/rbac ownership/adapter/
guard/enforcer and their tenant tests, apps/api-server/src/app/api/auth/profile/route.ts,
its brand binding/table dependencies, packages/db/src/schema/auth.ts, tutorial-progress
schema/repository references, the two blocked FND03 SQL migration files, the active Tera
packet and Sol's f88fef44 review. Discover additional callers rather than treating this
list as exhaustive. Historical defaults must be clearly historical, not claimed present
after Tera removed them. Do not execute FND runtime tests for this demonstration.

Compare a documented conventional retrieval recipe and the optimized recipe against the
same frozen source and expected coverage. Do not manufacture a huge baseline by reading
the whole monorepo. Report relevant paths found/missed, invariants retained, bytes/tokens,
commands/time and limits separately. Savings do not compensate for missing authority or
security evidence. Fresh-session reproduction may use a fresh tool process and isolated
directory; do not impersonate a separately launched AI session as proof.

## Completion and handoff

Argon submits audit/Argon_Context_Optimization_Handoff.md with exact allowed/changed files,
dependency versions, setup and usage commands, configuration, measurement artifacts and
method, limitations, rollback, and remaining validation. Gemini submits
audit/Gemini_Context_Optimization_Validation.md with independent outcomes and missing gates.
Sonnet supplies DOC01-DOC03. Generated payloads/raw transcripts stay ignored locally;
committed audit reports contain only safe measurements and references.

Stage explicit paths only. Check staged and committed whitespace; no broad git add -A,
reset, amend/rebase of others' work, main merge, push or deployment. Submit reviewable
local commits as IMPLEMENTED_UNVERIFIED. Sol alone records tooling acceptance after
independent evidence. Do not report the assignment complete merely because files exist.

Next required model now: Argon for OPT01-OPT05. Sonnet may draft DOC01-DOC03 in disjoint
files. Argon then notifies the owner that Gemini is required for VAL01-VAL12 at the exact
frozen revision; Gemini routes the evidence to Sol. Terra continues TC01-TC20 throughout.
