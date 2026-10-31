# Project LLM Linux Pre-Deployment Verification

Date: 2026-10-31 (Asia/Calcutta)
Branch: `feature/project-llm-linux-worker`
Status: local compatibility checks passed; VPS deployment not performed.

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

## Executed Checks

| Check | Result |
| --- | --- |
| Focused Python placement, patcher, fixture, progress and worker regression tests | 101 passed |
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

Linux image tested: `quiz-platform-project-ai-toolchain:smoke`.
No running application or database containers remain from these checks.

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
25 minutes 36 seconds. Authenticated Linux worker evidence is still separate.

## Not Verified or Not Done

- Full worker image/source-bundle build from a new committed revision.
- Worker startup using actual mounted VPS configuration.
- Exact-commit admin/learner Next.js builds inside the Linux worker.
- Authenticated database-backed learner lifecycle inside that worker.
- Nginx runtime configuration test on the VPS and CDN request-timeout behavior.
- VPS capacity under real concurrent production traffic.
- Deployment, commit, push or merge of this branch.

No VPS connection, live service restart, or live database mutation was performed
for this pre-deployment verification. The results establish Linux toolchain and
safety-mechanism compatibility, not full production runtime certification.

See `services/project-ai/deploy/README.md` for the one-time private worker setup,
existing deployment command, persistent-volume rollback caveat and CDN limitation.
