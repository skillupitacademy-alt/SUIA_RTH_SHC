# Sol Advisory Review — AI Context Optimization (OPT01–OPT05 / DOC01–DOC03 / VAL01–VAL12)

- **Status of this document**: `ADVISORY — PENDING OWNER/SOL RATIFICATION`
- **Prepared**: 2026-11-06, at the project owner's request, on Sol's behalf
- **Independence caveat**: This review came from the same conversation that wrote the Gemini validation suite (`797f7928`, `45299cca`, `1adb10d0`). It is **not** independent of that work. The new evidence below was gathered with fresh probes against the source, not by re-reading Gemini's report. Even so, ratification should come from Sol or the owner.
- **Reviewed HEAD**: `1adb10d0` (local working tree clean at review time)
- **Frozen inputs**: Argon `aa33e494` · Sonnet `11ced9c1` · Gemini `797f7928`, `45299cca`, `1adb10d0`

## Disposition: `PARTIAL_ACCEPTANCE`

| Scope | Disposition |
| --- | --- |
| OPT01–OPT05 tooling (`aa33e494`) | **ACCEPTED for optional, advisory use** |
| DOC01–DOC03 documentation (`11ced9c1`) | **ACCEPTED** (files present: operating-guide 31.7 KB, fnd-checkpoint-template 26.0 KB, task-retrieval-guide 28.0 KB) |
| VAL01–VAL12 + SUPP-01–SUPP-10 | **ACCEPTED WITH CONDITIONS C1–C4** |
| Mandatory adoption | **NOT AUTHORIZED** |
| `AGENTS.md` / `CLAUDE.md` reference edits | **DEFERRED** until C1–C3 are closed |
| FND03 / W1–W3 / TC01–TC20 | **Unaffected; remain open** |

Optional use means an agent may use packets for navigation and discovery. Security sign-off must still be based on the full-mode packet or the source files directly, never on navigation-mode output.

## Evidence gathered in this review

### R1. SUPP-05 chunk body integrity: closed
Probe: `scratch/sol_review_chunk_integrity.mjs`. It forces overflow (`--max-bytes 32768`) into a unique, gitignored out-dir, then extracts each file body from its chunk and strips the line-number prefixes. Each body's SHA-256 is compared with the file on disk. Afterwards it removes only its own directory.

Result: CLI exit `1` (fail-closed as designed), **9 chunks, 30/30 file bodies match disk, 0 mismatches**.

Qualification: the comparison normalizes CRLF→LF and the trailing newline. That proves content integrity, but not raw-byte identity, because the packet format re-renders line endings. This is acceptable for an LLM-context artifact.

### R2. The conventional benchmark baseline is not reproducible across revisions (finding)
`conventionalDiscoveryOverheadFiles` includes three files that change often:
`graphify-out/GRAPH_REPORT.md` (rewritten on every `graphify update`, last `4c206898`), `audit/Tera_W1_W3_Critical_Handoff.md` and `audit/Gemini_W1_W3_Independent_Verification_Report.md` (last `27fa8afe`).
The conventional total has already drifted from **422,469 to 437,041 bytes** between runs, which moved the headline figure from 45.35% to 47.13%.
The baseline also assumes the conventional workflow loads all of `GRAPH_REPORT.md`, a modelling choice that favours the tool.
**Ruling**: report the reduction as a revision-pinned estimate (`~45–47% at the stated revisions`), not as a stable property. As already qualified, it is not a measurement of billing or of the five-hour quota.

### R3. The offline claim is narrower than the report states (finding)
- The root `vitest.config` loads `apps/api-server/src/test/setup.ts`, **not** `audit/W1_W3_Offline_Test_Network_Guard.ts`. The suite as a whole therefore did not run under the offline guard. Only the two SUPP-08 subprocesses ran with the preload guard.
- `benchmark` calls `runQueryGraph(..., { runNativeCli: true })`, which spawns the native `graphify` (Python) CLI. A Node `-r` preload cannot guard that subprocess.
**Ruling**: VAL11 is accepted only for the tested scope, meaning the `context-cli` Node process and its direct Node sockets with `--no-native-cli`. The native graphify subprocess remains unguarded and must be stated as such.

### R4. Test-order coupling (finding)
At 11 points the suite reads shared artifacts under `.context-packets/fnd03-*` that earlier tests produce (L75, 92, 105, 117, 160, 181, 209, 406, 408, 492, 514). Running VAL04, VAL05, VAL12, SUPP-06 or SUPP-07 on its own can fail, or can pass against a stale artifact. The full-suite 22/22 result is valid. The individual results are not independently reproducible.

## Conditions (narrow; no re-implementation)

| ID | Owner | Condition |
| --- | --- | --- |
| C1 | Gemini | Correct `audit/Gemini_Context_Optimization_Validation.md`. VAL11 must be scoped as in R3: remove the claim that the suite ran under the W1–W3 offline guard and record the unguarded native graphify subprocess. The benchmark figures must be stated as revision-pinned (R2). Add R1 as SUPP-05 body-integrity evidence. |
| C2 | Gemini | Make each test that reads `.context-packets` artifacts generate its own artifacts in a unique out-dir, or mark the dependency explicitly with `describe.sequential`. Do this without weakening any assertion. |
| C3 | Argon (optional) | Pin the conventional baseline to content hashes or a frozen snapshot so the benchmark stays reproducible. Alternatively, document the drift in `config.json` and DOC01. |
| C4 | All | Keep packets advisory. Every FND security sign-off still requires the full-mode packet or direct source review, plus Sol's own acceptance. |

When C1–C3 are closed, the owner or Sol may authorize the minimal `AGENTS.md` / `CLAUDE.md` reference diff, keeping adoption optional.

## Unchanged priorities
Tera keeps TC01–TC20, using Gemini's ledger (`FAIL-01`–`FAIL-06`) as correction input. TC18 (nested-document `z.any()`) and TC20 (cross-brand analytics state, event consumer) are outstanding reproduced defects. Approval of the tooling does not gate or delay that work. No migrations, deployment, main merge or FND closure are authorized by this review.

