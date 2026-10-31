# Project LLM Linux Pre-Deployment Verification

Date: 2026-10-31 (Asia/Calcutta)
Branch: `feature/project-llm-linux-worker`
Status: local Windows checks and authenticated Linux diagnostic passed;
VPS deployment not performed.
Tested code revision: `4d1632d3af2b6ab08715f58b49c558b5099a9bd8`.

## Implemented

- Optional non-root Project AI worker in both Hostinger Compose configurations.
- Linux toolchain image with Python, Git, pnpm, Node and version-matched Chromium.
- Private committed-source bundle and persistent repository/worktree/state volumes.
- Single-job admission control and isolated preview process-group cleanup.
- Mounted private configuration and explicit fixture-database write permission.
- Long-running verification transport and origin proxy timeout handling.
- Existing deploy-smart/image archive workflow retained, worker explicitly selected.
- Runtime-bundle shell newline normalization for Windows-built archives.
- Native discovery snapshot generation into worker state, with commit parity check.
- Linux ENOTDIR handling when discovery probes a regular file as a package path.
- Shared persistent pnpm cache and offline-first, fail-closed startup installation.

## Executed Checks

| Check | Result |
| --- | --- |
| Focused Python placement, patcher, fixture, progress and worker regression tests | 103 passed |
| Admin backend transport tests | 3 passed |
| Admin TypeScript check | Exit 0 |
| Frozen-lockfile dependency install | Passed; lockfile unchanged |
| Repository lint, serial task execution | 17 tasks passed; no lint errors or warnings |
| Repository typecheck:all | 27 tasks passed |
| Full build:all package selection, serial execution in isolated checkout | 18 tasks passed |
| Focused admin transport/client/block-conversion/reorder tests | 25 passed |
| Additional top-level Project LLM tests with explicitly scoped discovery | 30 passed |
| Tutorial schema certification tests | 21 passed |
| Runtime Compose schema check, without resolving env files | Passed |
| Worker-only Next.js concurrency config imports | Both admin and learner passed |
| PowerShell parser: deploy-smart and build-save-images | Passed |
| Linux Docker toolchain build | Image created successfully |
| Non-root Linux Git/Node/pnpm and tenant loopback resolution | Passed |
| Non-root Linux Chromium launch and page render | Passed |
| Network-disabled Linux cross-process lock exclusion/release | Passed |
| Network-disabled Linux isolated process-group termination | Passed |
| Linux deployment shell syntax after package newline normalization | Passed |
| Git whitespace check | Exit 0; checkout newline warnings only |
| Discovery adapter/structure/error regression tests, Windows and Linux | 34 passed on each OS |
| Discovery package type check after Linux correction | Exit 0 |
| Shared-cache shell startup tests, network disabled | Cached success, missing-tarball retry and invalid-lockfile refusal passed |
| Full committed-source Linux worker image | Built successfully, linux/amd64 |
| Worker startup with mounted private local diagnostic configuration | Passed; health HTTP 200 |
| Exact-commit Linux SkillUp production build and authenticated Playwright | Passed |
| Required learner navigation/progress API observations | Both HTTP 200 |
| Candidate DOM, LSNB and RSSB | Passed for Objective O1 fixture |
| Browser console and page errors | None observed |
| Evidence and screenshot SHA-256 verification | Passed |
| Reserved fixture document restoration | Exact before/after equality |
| Dedicated fixture learner cleanup | Zero remaining rows in all three progress/telemetry tables |
| Temporary preview and worktree cleanup | Passed; only managed base checkout remains |

Full Linux image tested: `quiz-platform-project-ai:smoke-4d1632d3`.
Image digest: `sha256:95b1dab379a5fdab15cbd91c633af45081a196f6e02afbd2aabd1acff9da11bf`.
The final diagnostic used a one-CPU, 3 GB worker with non-root execution. Its build
approached that memory limit; this is not a production capacity guarantee.
Temporary worker containers and the temporary local API on port 3011 are stopped.
Ports 3011 and 8012 no longer listen. No application containers remain running.

The initial lint/type-check runs found a missing S1 schema export, a missing
union narrowing in its certification test, 68 admin warnings, one learner unused
catch binding, and a non-native drag interaction. These were corrected in source;
no lint rules or warning thresholds were weakened. Overlapping checks exhausted
Windows allocation capacity, so the final lint run used concurrency 1. The reorder
control tests also passed independently after an earlier worker-start timeout.

Full production builds passed in a separate temporary checkout with the current
application source changes. Build logs still contain old Browserslist data,
OpenTelemetry dynamic-dependency, dynamic-render/auth-state, and Turbo no-output
cache warnings. These are not lint warnings and were not hidden or disabled.
The API Sentry post-compile step took about 226 seconds. Total build sequence:
25 minutes 36 seconds.

## Authenticated Linux Evidence

The first full startup exposed Linux `ENOTDIR` behavior for
`services/a.txt/package.json`. The adapter now treats that impossible child path
as absent while still propagating permission failures. Regression tests and a real
Linux discovery scan passed after the correction.

A first diagnostic was deliberately stopped during duplicate dependency download;
it reported BLOCKED, restored the fixture, and produced no passing evidence. A
subsequent real diagnostic passed at `da897409`, using an explicitly shared cache.
The final image at `4d1632d3` includes that shared-cache startup behavior and was
then started and tested again successfully. Startup preserves install diagnostics
and only retries online for a missing offline tarball, not an invalid lockfile.

Final report: `.project-ai/linux-worker-smoke-final.json` (private, ignored).
Screenshot: `.project-ai/linux-worker-smoke-final.png` (private, ignored).

- Evidence SHA-256: `590fa767ce24e6b663d1bbfa46a89821c5c527ed37796e42ae19c0e3c5d288d6`.
- Screenshot SHA-256: `420566e6d0210b235590459ebea329bfca20ef9e0fdc9646d5a7354d561bd37d`.
- Verified commit: `4d1632d3af2b6ab08715f58b49c558b5099a9bd8`.

The real learner browser ran against a detached preview at that commit. It used
the approved reserved fixture in the existing remote database and a short-lived
fixture session. Only dedicated test content was temporarily replaced; the exact
original document was restored. A separate read-only database check confirmed zero
remaining dedicated learner rows in `block_telemetry_events`,
`block_learning_state`, and `tutorial_navigation_progress` for the fixture page.
No authored lesson or real learner progress was selected for mutation or cleanup.

This is a diagnostic of the Objective O1 registry default in one configured fixture,
not workflow certification. It does not prove every family/version/theme, Composer
Save/Publish, the isolated admin browser gate, or the complete ZIP upload journey.
It never advances a workflow or marks an uploaded candidate certified.

## Not Verified or Not Done

- Worker startup using actual mounted VPS configuration.
- Exact-commit isolated admin build/browser gate inside the Linux worker.
- Full ZIP-to-certification and Composer Save/Publish lifecycle inside Linux.
- Nginx runtime configuration test on the VPS and CDN request-timeout behavior.
- VPS capacity under real concurrent production traffic.
- VPS architecture and private production configuration validation.
- Deployment, push or merge of this branch.

Changes were committed locally on `feature/project-llm-linux-worker`, with the
user's unrelated untracked architecture/audit documents excluded. No VPS connection,
VPS service restart, push, or merge was performed. `main` remains at
`3a225dc3880e0aa3c0877a47c75e3f5b73880f18`.
The reserved remote fixture was used with explicit permission as described above.
These results establish the tested Linux execution path, not full VPS production
certification or a guarantee that future candidates will pass.

See `services/project-ai/deploy/README.md` for the one-time private worker setup,
existing deployment command, persistent-volume rollback caveat and CDN limitation.
