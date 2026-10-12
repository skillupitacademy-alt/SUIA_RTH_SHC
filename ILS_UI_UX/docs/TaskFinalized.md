I’ve reviewed the relevant material from both Implement GitHub Evidence.txt and Explain I2 Creation Files.txt, including the sections on repository discovery, candidate creation, evidence, and Tutorial Composer integration.

The central conclusion is that Project LLM is not intended to replace Tutorial Composer or become another block-design editor. It is the engineering control plane that helps you create, integrate, verify, and certify new tutorial blocks so that Tutorial Composer can use them reliably.

Implement GitHub Evidence.txt

Explain I2 Creation Files.txt

1. The relationship between Project LLM and Tutorial Composer
You — the product owner

Choose the block family and intended version; decide what the block should do and look like.

Project LLM

Discovers existing implementations, generates the engineering contract, checks candidate files, plans safe repository changes, and verifies integration.

External AI + your approval

Develop the visual design and implementation using the repository-derived contract.

Project LLM — integration and certification

Compare, validate, test, propose placement, obtain approval, integrate, and collect real evidence.

Tutorial Composer

Discover the certified block, let an author select and configure it, and include it in a tutorial.

Tutorial runtime → learner

Render the resulting tutorial through the existing platform.

This separation is important: Project LLM certifies that an implementation is fit for the platform; Tutorial Composer remains the authoring and composition experience.

Explain I2 Creation Files.txt

2. How Project LLM helps create an I2 block
Suppose you want to create or update Introduction I2.

Step 1 — You specify the target
You select the family and intended version in Project LLM. It must preserve that target throughout the workflow rather than guessing a version or silently changing it.

Step 2 — Project LLM discovers the real repository architecture
The system examines the repository snapshot and existing canonical artifacts. It investigates the applicable reference implementations—such as I1, C1, and D1 where they exist—and discovers the actual:

Block components, schemas, types, and version conventions.

Renderer and registry integration.

Tutorial Composer registration and authoring contract.

Runtime and browser-test requirements.

Theme and brand boundaries.

ILS, LSNB, and RSSB responsibilities.

The key is to derive these requirements from actual repository evidence, not from assumptions or hard-coded examples. If an expected reference file is missing, Project LLM should report that limitation rather than fabricate a reference.

Step 3 — Project LLM generates a self-contained engineering contract
The external AI should not be expected to know your repository or understand internal names such as I1, UBRC, or TutorialBlockRenderer.

Project LLM therefore converts its findings into a package that explains the target, required artifacts, integration rules, tests, acceptance criteria, prohibited behaviors, and relevant repository evidence.

Step 4 — External AI and you develop the block
External AI can create an HTML/CSS/JavaScript/JSON prototype first. You review the design, and after approval, External AI produces the React/TypeScript candidate and supporting files.

Project LLM establishes engineering constraints; you and the external AI retain responsibility for the creative design decisions.

Branch · Explain I2 Creation Files.txt

Step 5 — Project LLM inspects and integrates the candidate
After upload, Project LLM should:

Inventory and hash the files.

Verify the family, version, workflow, and contract binding.

Compare the candidate with the current repository and canonical contracts.

Identify missing artifacts, conflicts, duplicates, and incompatible dependencies.

Produce a placement manifest using ADD, UPDATE, EXTEND, REUSE, or REJECT.

Obtain the required human approval before repository changes.

Perform the approved placement through a controlled repository operation.

Rediscover the repository and verify the resulting implementation.

It should update or extend existing registries, contracts, and documentation where appropriate rather than creating parallel copies.

Explain I2 Creation Files.txt

3. The most important part: prove the block works in Tutorial Composer
A component existing in the repository is not sufficient. Project LLM must verify the complete path from the repository through Composer and into a rendered tutorial.

Discoverability: the block appears in Tutorial Composer's available block options.

Selection and configuration: an author can select it, provide valid content, and configure its supported properties.

Serialization: Composer produces a valid tutorial configuration containing the correct block identity, type, version, and data.

Rendering: the existing renderer resolves that configuration to the correct implementation.

Runtime compatibility: the block participates in the existing runtime without creating replacement navigation, progress, or telemetry systems.

Browser verification: automated browser tests exercise the real authoring and rendering path rather than merely checking that a React component can render in isolation.

Certification: the final status is based on actual test results and evidence. Missing or inconclusive evidence must not be reported as a pass.

These checks should be part of the certification pipeline. The final acceptance test is not simply “I2 compiles”; it is “I2 is available in Composer, can be configured into a tutorial, and renders correctly in the existing platform.”

Explain I2 Creation Files.txt

Branch · Explain I2 Creation Files.txt

4. Where I2-only creation and Mix & Match fit
The attached discussions contain an important distinction: creating a certified block and certifying a composition made from existing blocks are different things.

| Capability | Purpose | Responsibility |

| ------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |

| I2-only creation | Create or update the intended Introduction I2 implementation. | External AI + user design; Project LLM integration and certification. |

| Mix & Match | Let the user and external AI reuse or combine design ideas and compatible implementation patterns. | User + External AI decide the design. |

| Composition verification | Check whether the resulting combination is compatible and renders correctly. | Project LLM verifies engineering compatibility when that composition is submitted for verification. |

| Tutorial authoring | Select and configure available certified blocks to build a tutorial. | Tutorial Composer. |

My recommendation: do not turn Project LLM into a separate visual composition editor. Mix & Match should be a design/reuse input, not a second workflow engine. If a combination creates a distinct composition that needs certification, track that certification separately from the certification of its individual blocks.

Explain I2 Creation Files.txt

Explain I2 Creation Files.txt

5. What the implementation needs to prioritize
The two files describe an intended architecture, not proof that every capability is already implemented. The implementation should be audited against these milestones.

Priority 1 — Repository intelligence and contract generation

Use authoritative repository discovery and evidence to produce the target-specific engineering contract. Preserve family/version identity from the beginning.

Priority 2 — Candidate intake and safe integration

Implement upload, hashing, comparison, placement planning, human approval, controlled placement, and post-placement rediscovery.

Priority 3 — Real certification

Wire the actual Composer, registry, renderer, runtime, browser, ILS, LSNB, RSSB, theme, brand-independence, and test checks. No placeholder PASS results.

Priority 4 — Project LLM UI connected to FastAPI

Expose the real workflow, candidate status, approval requests, evidence, and certification results. The UI must not create a second source of workflow truth.

Priority 5 — Golden end-to-end test

Demonstrate the complete journey from selecting a target and generating its contract through candidate upload, approved integration, Composer use, tutorial rendering, and final certification.

This is consistent with the architectural division in Implement GitHub Evidence.txt: deterministic repository discovery and snapshots establish repository facts, while the separate Project AI service handles orchestration and analysis. The existing product stack and Tutorial Composer remain the product platform rather than being replaced by Project LLM.

Implement GitHub Evidence.txt

Implement GitHub Evidence.txt

6. What I would instruct the Project AI multi-agent system to do
The agents should follow a controlled sequence:

First: audit the existing implementation and canonical documentation. Identify what already works and what is missing.

Second: implement repository-derived contracts and candidate intake/comparison.

Third: implement approval-controlled placement and real post-placement certification.

Fourth: connect the Project LLM UI to the stable backend contracts.

Finally: run the end-to-end Composer-to-tutorial journey and independently inspect the evidence.

Parallel work is appropriate for independent components, but placement must wait for comparison and approval, and the final gate must wait for the required verification evidence.

Apply the existing canonical-artifact rule throughout: search for the relevant document or registry first, update it when appropriate, and create a new permanent artifact only when no existing canonical artifact can represent the information.

Final recommendation
The product goal is not to create more AI agents, databases, or status dashboards. Those are supporting mechanisms.

The goal is to make Tutorial Composer extensible through a reliable, evidence-backed engineering workflow. You should be able to request Introduction I2, let an external AI develop the design and implementation, submit the candidate to Project LLM, approve the proposed repository changes, and have Project LLM establish that the block genuinely works in Tutorial Composer and the tutorial runtime.

That is the outcome I would use to judge whether Project LLM is fulfilling its intended purpose—not the number of agents implemented or the number of tests that happen to pass.

First, establish an evidence-based audit baseline
I’ll treat this as a repository audit followed by a gated multi-agent implementation plan, not as a declaration that the earlier design has already been implemented.

I have confirmed that the GitHub repository skillupitacademy-alt/SUIA_RTH_SHC exists, its default branch is main, and the branch project-llm-e2e-implementation is available. I also inspected the integration workflow and migration-repair verification code on that branch.

One important finding is already clear: the existing integration workflow runs Drizzle migrations before the Python integration tests. If migrations fail, the downstream tests cannot provide evidence that the application works. We must record those tests as blocked or not run, not passed. The workflow is here: integration-tests.yml.

The source documents explain the intended architecture, but they do not prove that the live branch implements each capability. I will keep these categories separate throughout the audit:

Verified implemented — supported by code and test evidence.

Implemented, not adequately verified — code exists, but required tests or end-to-end proof are missing.

Partially implemented — only some required behavior exists.

Missing — no implementation was found in the inspected scope.

Unknown — repository access or evidence is insufficient to make a reliable determination.

A finding is not considered resolved merely because an agent reports that it completed its task.

Preliminary audit: how far have we reached?
The following findings are based on files inspected on project-llm-e2e-implementation. This is a preliminary, evidence-backed audit, not yet a complete repository inventory or a successful test run.

Capability Preliminary status Evidence / gap

Python/FastAPI service foundation Present services/project-ai/pyproject.toml declares FastAPI, Pydantic, SQLAlchemy and PostgreSQL drivers. This does not prove the full product workflow is connected.

PostgreSQL / Drizzle integration Present packages/db-tutorial has Drizzle scripts and configuration.

Migration and integration CI Needs repair Workflow runs migrations before Python integration/security tests; a migration failure blocks downstream verification.

Command execution and output hashing Partial foundation migration_repair/runner.py validates commands, uses shell-free subprocess execution, and hashes captured output. Its evidence-routing and command-validation behavior need further tests.

Database test safety Gap identified safety.py allows only specific test database names, while the CI workflow uses tutorial_test. These policies need deliberate reconciliation without weakening production protections.

Cleanup verification Gap identified verification.py treats a nonzero status-query result as evidence that the database is down. That is not reliable proof of cleanup.

Exact tested-commit verification Gap identified final_gate_agent.py contains a TODO and temporarily returns the current SHA as both the current and tested SHA. This cannot establish that the tested code is the code being published.

Real database verification tests Insufficient proof The inspected integration test mocks the verification pipeline and database validation. It verifies orchestration behavior, not the actual migration/database lifecycle.

Candidate Block upload and placement Not yet verified Requires a complete code and route inventory before concluding whether it is missing or implemented elsewhere.

Contract generation from repository evidence Not yet verified Must be traced from discovery through contract generation and API/UI usage.

Tutorial Composer discovery, configuration and rendering Not yet verified Must be demonstrated through actual Composer and runtime tests.

I2-only creation and Mix & Match verification Not yet verified Must be traced against real block-family contracts and certification paths.

End-to-end certification and browser evidence Not yet verified Needs a traceable run showing a candidate becoming usable in Composer and rendering in the existing runtime.

Relevant inspected files:

Project AI Python dependencies

Command runner

Database safety policy

Verification pipeline

Final gate agent

Verification runner integration tests

Architectural recommendation: do not expand the migration-repair subsystem just because it already exists. First determine which components are reusable for Project LLM's actual candidate lifecycle and certification requirements. Retain useful command execution, evidence and orchestration utilities where justified; deprecate or simplify repair-specific behavior if it is not a product requirement.

The multi-agent execution plan
Use one orchestrator, specialized implementation agents, and an independent final auditor. Agents should exchange structured artifacts rather than rely on conversational summaries.

Wave 0 — Sequential: repository baseline

No implementation changes allowed.

Agent A0 — Repository Audit Lead

Pin the branch and base commit SHA.

Inventory existing code, API routes, UI screens, registries, block families, tests and canonical documentation.

Map current implementation to the Project LLM requirements.

Record confirmed, partial, missing and unknown states.

Identify the existing source of truth for each requirement.

Wave 1 — Sequential: requirements and architecture gate

Agent A1 — Architecture and Contract Lead

Produce a requirements-to-code matrix.

Define API contracts and agent input/output schemas.

Resolve block-family/version binding and certification states.

Assign exact file ownership to implementation agents.

Obtain approval before database schema changes or destructive operations.

Wave 2 — Parallel: independent implementation tracks

Start only after Wave 1 is approved. Keep file ownership disjoint.

A2 — Repository intelligence

Discovery, snapshots, evidence-backed repository facts and contract generation.

A3 — Candidate lifecycle

Upload, inventory, hashes, validation, collision analysis and placement manifest.

A4 — Composer integration

Block registration, selection, configuration, serialization, rendering and I2/Mix & Match verification.

A5 — Evidence and testing

Test contracts, run records, artifact hashes, evidence integrity and reproducible results.

A6 — UI integration

Project LLM screens wired to agreed API contracts; no separate workflow state.

A7 — CI and database

Minimal workflow fixes, isolated database tests and migration-safety verification.

A7 must not generate or apply schema changes before the architecture/schema gate. A4 must use the real Composer contract discovered by A0/A1, not invent a parallel registry.

Wave 3 — Sequential: integration and reconciliation

Agent A8 — Integration Lead

Reconcile agent changes and schema migrations.

Check canonical documentation and registries for duplication.

Resolve API/type mismatches and merge conflicts.

Confirm the complete dependency graph.

Freeze the candidate integration commit for testing.

Wave 4 — Parallel: independent verification

A9 — Code and security audit

Authorization, path traversal, untrusted files, command safety, secret handling.

A10 — Test audit

Run unit/type/schema checks and verify that tests exercise real behavior.

A11 — Composer E2E audit

Verify actual authoring, serialization, rendering and browser behavior.

A12 — Evidence audit

Verify run IDs, artifact hashes, test exit codes and exact tested SHA.

Wave 5 — Sequential: release gate

Agent A13 — Independent Final Gate

Require all mandatory checks to pass.

Block certification if required evidence is absent, stale, or contradictory.

Verify the tested commit SHA matches the candidate intended for publication.

Produce a release decision and evidence manifest.

Publish only after human approval and required repository checks.

Which work must never run in parallel?

These operations require explicit sequencing:

Repository audit before new implementation.

Requirements/schema approval before migration creation or application.

Candidate comparison before placement planning is approved.

Human approval before repository mutation.

Migration success before database-dependent tests.

Integration before full end-to-end testing.

All mandatory test results before certification.

Final SHA verification before publication.

Parallel agents should not edit the same canonical registry, migration, API schema, or documentation file simultaneously. If two tracks require the same file, one becomes the owner and the other submits a change proposal.

What each workflow agent must return
Every agent should produce a structured result, not just “done.”

{

"run_id": "unique-run-id",

"agent_id": "A3-candidate-lifecycle",

"base_sha": "exact-base-commit",

"tested_sha": null,

"status": "PASS",

"changed_files": [],

"checks": [


{
  "check_id": "candidate-inventory-unit-tests",
  "status": "PASS",
  "command": "exact command executed",
  "exit_code": 0,
  "duration_ms": 1250,
  "stdout_artifact": "artifacts/candidate-tests.stdout.txt",
  "stderr_artifact": "artifacts/candidate-tests.stderr.txt"
}
],

"evidence_artifacts": [],

"unresolved_findings": [],

"blocked_reason": null

}

This is an illustrative result contract, not a claim that the repository currently emits this exact JSON. Align it with existing canonical evidence schemas during Wave 0 rather than introducing a duplicate schema.

Use a common status vocabulary:

PASS — the check ran and met its criteria.

FAIL — the check ran and did not meet its criteria.

BLOCKED — a prerequisite prevented execution.

SKIPPED — deliberately not run, with a recorded reason.

UNKNOWN — evidence is insufficient to determine the result.

An agent must never convert BLOCKED, SKIPPED, or UNKNOWN into PASS.

How to log every test so I can inspect the results on GitHub
Store machine-readable records and human-readable logs as workflow artifacts. Update the existing canonical evidence location if it already serves this purpose; do not create a second competing evidence ledger.

Suggested run artifact layout:

artifacts/

project-llm-audit/


manifest.json
requirements-to-code.csv
findings.json
changed-files.json
test-summary.json
test-summary.md
logs/
  discovery.log
  backend-tests.log
  frontend-tests.log
  database-migrations.log
  security-tests.log
  composer-e2e.log
  final-gate.log
junit/
  backend.xml
  frontend.xml
  browser-e2e.xml
evidence/
  candidate-manifest.json
  placement-plan.json
  certification-report.json
These are proposed artifact names. Reuse existing repository conventions when the audit identifies a canonical equivalent.

Each run should record:

Field Why it matters

Repository, branch and base SHA Establishes the starting state.

Candidate and tested SHA Establishes exactly which code was checked.

Run ID and workflow/job IDs Lets us locate the same execution on GitHub.

Exact command and working directory Makes local reproduction possible.

Exit code and duration Distinguishes successful execution from a logged attempt.

stdout/stderr artifact references Preserves the actual diagnostic output.

Artifact SHA-256 hashes Detects evidence changes or corruption.

Prerequisites and blocked reason Explains why downstream tests did not run.

Findings and remediation references Connects failures to concrete code changes.

Final gate verdict Records the release decision and why it was reached.

Avoid logging secrets, database passwords, tokens, or sensitive user content. Sanitize logs before uploading them.

Minimal GitHub Actions artifact step

After Wave 0 establishes the existing CI structure, an artifact upload step can be added or adapted to the existing workflow. For example:

name: Upload Project LLM test evidence

if: always()

uses: actions/upload-artifact@v4

with:

name: project-llm-evidence-${{ github.run_id }}-${{ github.run_attempt }}

path: |


artifacts/project-llm-audit/
services/project-ai/test-results/
packages/db-tutorial/test-results/
if-no-files-found: warn

retention-days: 30

This is a template: verify the real output paths and ensure each test runner actually writes its reports before enabling it. The artifact step preserves available files; it does not itself create valid test evidence.

Once a workflow run is uploaded, I can inspect the commit, workflow jobs, test reports, logs and artifacts available through GitHub and compare them against the requirements matrix.

Fix the existing evidence and migration issues first
The initial audit has identified four particularly important correctness problems to resolve before relying on the current migration-repair final gate:

Test database allowlist mismatch. The workflow uses tutorial_test, but the inspected trusted database list does not include that name. Confirm the intended isolated test target, then align the policy and CI configuration. Do not bypass the allowlist or relax host checks.

Cleanup verification can falsely pass. A failed status query is not proof that a database container has been removed. Return a failure or unknown result when cleanup cannot be verified.

Tested SHA is not independently established. Obtain the tested SHA from a trusted run record and compare it to the exact candidate commit. If the value is absent, block the final gate.

Mocked tests are not real database proof. Retain unit tests for orchestration, but add isolated PostgreSQL integration tests for migrations, schema validation, cleanup, and the failure paths.

The earlier CI failure also means we should inspect the exact failed job logs before making changes. We should not infer the root cause solely from the fact that the migration step failed.

The acceptance gate for Project LLM
Before calling the implementation successful, require evidence for the complete journey:

 A user can select a block family and explicit target version.

 Repository discovery generates a contract from real files and verified repository facts.

 Candidate files are inventoried, hashed and validated.

 The placement plan identifies additions, updates, extensions, reuse and rejections.

 Repository changes cannot happen before the required approval.

 The approved implementation updates canonical artifacts without creating redundant registries or documentation.

 Required tests run against the correct isolated database and target commit.

 The candidate appears in Tutorial Composer and supports valid authoring and serialization.

 The existing renderer and runtime display the resulting tutorial correctly.

 I2-only creation and submitted Mix & Match compositions receive the appropriate verification.

 Certification is based on actual evidence, not a hard-coded fixture or optimistic agent status.

 The final gate verifies the exact tested SHA and preserves the evidence needed for independent review.

What I recommend doing next
Start with Wave 0 and do not begin broad implementation changes yet. The preliminary audit has exposed migration/evidence defects, but it has not established the full current state of candidate intake, contract generation, Composer integration, or certification.

The first deliverable should be one consolidated, evidence-backed requirements-to-code matrix maintained in an existing canonical audit or implementation document. It should identify, for every requirement, the relevant file or API, current status, test evidence, missing work, owner agent, dependencies, and acceptance criteria. That matrix will become the authority for deciding what to reuse, fix, implement, or retire.

One limitation to be clear about: I have inspected selected GitHub files, not executed the full repository test suite or completed the entire code inventory in this response. No code changes, tests, or commits have been made by this audit. The next audit pass should inspect the actual Composer implementation, block registries, renderer/runtime, current API/UI wiring, canonical evidence schemas, existing docs, and recent workflow artifacts before assigning final implementation statuses.

3. Branch-by-branch audit against main
I compared the five requested branch names against main and checked the current GitHub branch list.

Repository: SUIA_RTH_SHC · Audit date: 12 October 2026

| Branch | GitHub comparison | Finding | Recommended action |

| ------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |

| m1-repository-discovery | 0 commits ahead, 1 behind | Its head is an ancestor of main; PR #23 is already merged. | Treat as merged; no further merge needed. |

| m2-project-ai-canonical-wiring | 256 commits ahead, 0 behind | Large unmerged history relative to main; many evidence and implementation files. | Audit changes and tests before merging. |

| m2-project-ai-foundation | 69 commits ahead, 0 behind | Separate implementation history; its latest commit describes 83 test failures needing fixture repairs. | Fix and verify, then decide whether changes are still needed. |

| project-llm-e2e-implementation | 316 commits ahead, 0 behind | Contains newer workflow changes, but its latest recorded verification verdict is BLOCKED. | Do not merge until reconciled and verified. |

| project-llm-e2e-implementation-fix | Branch not found | GitHub returned “Branch not found.” It is not in the current branch listing. | Confirm whether it was deleted, renamed, or never pushed. |

Sources: M1 merged PR #23, canonical wiring branch, foundation branch, E2E implementation branch.

Important: “256 commits ahead” or “316 commits ahead” does not mean those commits should all be merged. These branches contain substantial overlapping histories and evidence artifacts. We need to compare their actual code changes, identify which branch contains the intended final implementation, and check for duplicate or superseded work.

4. The active pull request that needs attention
PR #24 — M2.9: Wire Project LLM external-AI workflow safeguards

Open

Verification incomplete

Head: project-llm-e2e-implementation

Current base: m2-project-ai-canonical-wiring

The PR description explicitly states that integration tests are queued, frontend and backend checks are pending, and the golden E2E test still contains stubbed steps and simulated approval. It also cautions against merging directly to main before reconciling the intended canonical base.

My recommendation is to keep PR #24 open while the audit runs. It may contain valuable safeguards, including preventing fabricated PASS results, but the available evidence does not yet justify merging it.

5. Which Project LLM branches were created in the last seven days?
For this audit, the seven-day window is 5–12 October 2026. GitHub's branch list does not provide a branch creation timestamp, so the following is a list of branches whose latest commits fall in that window—not a definitive list of when each branch was created.

| Branch | Latest commit date (UTC) | Interpretation |

| -------------------------------- | ------------------------ | ----------------------------------------------------------------------- |

| project-llm-e2e-implementation | 11 Oct 2026 | Recent activity; verification verdict recorded as BLOCKED. |

| m2-project-ai-canonical-wiring | 10 Oct 2026 | Recent activity; substantial branch history still needs reconciliation. |

| m2-project-ai-foundation | 7 Oct 2026 | Recent activity; latest commit documents outstanding test failures. |

| m1-repository-discovery | 5 Oct 2026 | Its PR has already been merged into main. |

The requested project-llm-e2e-implementation-fix branch was not found. I also found a separate project-ai-gui branch, which should be included in the wider audit to check whether its changes are already represented elsewhere.

6. Which branches should be merged, retained, or closed?
I would use these decisions as the merge policy:

M1 repository discovery: already merged; preserve the branch history and avoid a redundant merge.

M2 foundation: audit its implementation against the canonical wiring branch. Repair the documented test failures before deciding whether any unique code needs to be ported.

M2 canonical wiring: audit as a candidate integration base, not as an automatic merge.

Project LLM E2E implementation: retain while its useful changes are reconciled, tests run, and PR #24 is reviewed.

E2E implementation fix: first establish whether it exists under another name or whether its changes have already been incorporated.

Project AI GUI: compare its unique changes with the other branches before including or closing it.

Do not delete branches simply because they are old or merged. Preserve useful audit history and only clean up redundant branches after confirming that their unique changes are safely integrated.

7. Open issues and closure
My GitHub search did not return any open issues matching the Project LLM query. That is not sufficient to conclude that there are no open issues in the repository: issue search can miss differently titled issues, and pull requests are tracked separately.

The next closure pass should enumerate all open repository issues and all open pull requests, then classify each as:

Completed and safe to close.

Duplicate of another tracked item.

Superseded by a verified implementation.

Still blocked or requiring engineering work.

Unrelated to Project LLM.

PR #24 should not be closed as completed while its own description says verification is pending. Dependency-update PRs should be assessed independently rather than closed just to reduce the open-item count.

8. Merge execution plan
The safe sequence is:

Audit the full branch diffs and current main baseline, including project-ai-gui and the five requested branches.

Identify unique, useful changes and determine the intended canonical implementation base.

Repair migration, test, and evidence-integrity failures before relying on CI results.

Prepare or update pull requests targeting main with explicit scope and test evidence.

Run required checks and verify the exact tested SHA before each merge.

Close only issues and pull requests whose status is genuinely resolved, recording why they were closed.

Re-audit main after merging and publish the final branch, issue, PR, and test-result inventory.

I have performed the comparison and read-only inspection above. I have not merged branches, changed PR targets, closed issues, or deleted branches. The present evidence includes an explicit blocked verification verdict, so making those mutations now would risk merging unverified or overlapping work into main.

The immediate next task is to complete the file-level diff and PR/check audit, then select the smallest verified set of changes for integration. That is how we can get to a clean main without losing work or treating incomplete evidence as success.

Project LLM implementation and multi-agent execution plan
The objective is to turn the existing Project LLM work into a verified, maintainable workflow that takes a requested block from repository discovery through approved integration and real Tutorial Composer certification, while reconciling the existing branches and preserving test evidence.

I recommend implementing this as a gated multi-agent workflow—not letting every agent modify the repository simultaneously.

The plan below combines the two attached architecture discussions with the GitHub audit we just performed. It distinguishes existing evidence from work that remains unverified; it is an implementation plan, not a claim that these changes have already been applied.

1. First principle: establish one trustworthy baseline
The current branch audit revealed three important conditions:

m1-repository-discovery is already merged into main through PR #23.

PR #24 is open against m2-project-ai-canonical-wiring, and its description says the full end-to-end journey is not yet proven.

The latest commit on project-llm-e2e-implementation records a BLOCKED verification verdict.

Therefore, do not merge all branches directly into main. First determine which code is unique, which is duplicated, which tests actually pass, and which branch should serve as the integration base. Use the exact Git commit SHA for every test result and certification claim.

2. Target architecture
Product owner / Project LLM UI

Select block family, target version, design brief, and approval decisions

Sequential workflow coordinator

Owns state transitions, agent dependencies, approvals, retries, and final gates

Repository intelligence

Deterministic discovery, snapshot, contracts, evidence

Candidate analysis

Inventory, hashes, contract binding, collision checks

Placement and approval

Manifest, review, controlled repository changes

Certification

Contracts, runtime, Composer, browser, evidence

Existing Tutorial Composer and runtime

Discover → select → configure → serialize → render → execute

The existing React/TypeScript/Next.js and Node services remain the product platform. The Project AI Python/FastAPI service can coordinate repository analysis and engineering workflows if that matches the actual repository architecture. It must not become a replacement Composer or a second source of truth for tutorial runtime state.

3. Workflow-agent division
Use the existing agent registry and coordinator wherever they already support the required capability. Do not create a second registry or a separate agent framework merely to implement the plan.

The canonical-artifact policy already present in 
canonical-artifact-policy.md
 says to search for an existing canonical file and extend it before creating another document. The same rule should apply to code, tests, registries, evidence, and configuration.

Agent ownership matrix
| Agent / role | Responsibility | Can run in parallel? | Gate it must satisfy |

| --------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |

| A0 — Workflow coordinator | Create run, track dependencies, approvals, timeouts, retries, and final status | No; coordinates the whole workflow | Valid state transitions and complete run record |

| A1 — Repository auditor | Inspect main, requested branches, PRs, tests, architecture, and canonical docs | Yes, with other read-only audits | Baseline report references exact SHAs |

| A2 — Deterministic discovery | Inventory actual block files, registries, renderer, Composer, runtime, and tests | Yes, read-only | Snapshot and evidence are complete and reproducible |

| A3 — Contract generator | Produce a self-contained target-specific engineering contract | After A2 | Contract is bound to target family/version and snapshot |

| A4 — Candidate intake | Validate uploaded archive, paths, hashes, file types, dependencies, and contract binding | After A3; independent analyses may run in parallel | Candidate passes intake checks |

| A5 — Placement planner | Classify proposed changes as ADD, UPDATE, EXTEND, REUSE, or REJECT | Yes, with test planning | Manifest references actual files and explains each decision |

| A6 — Test planner / test engineer | Build validation plan and execute safe pre-placement checks | Yes, after candidate intake | Results include real commands, exit codes, and logs |

| A7 — Approval controller | Present manifest and evidence; persist human approval or rejection | No during the approval decision | Approval is bound to manifest hash and candidate hash |

| A8 — Placement executor | Apply only approved changes to an isolated work branch/worktree | No; one writer at a time | Actual changes match approved manifest |

| A9 — Post-placement discovery | Rediscover repository and compare before/after snapshots | After A8 | New snapshot records the tested commit |

| A10 — Composer integration verifier | Test discovery, selection, configuration, serialization, renderer, and runtime | Parallel by independent test domain after A9 | Required Composer/runtime tests pass |

| A11 — Evidence verifier | Verify provenance, completeness, hashes, test authenticity, and commit identity | Parallel with A10 | No missing, fabricated, stale, or misbound evidence |

| A12 — Final gate / certification | Evaluate all required gate results | Sequential after A10 and A11 | All mandatory checks pass on the same tested SHA |

| A13 — GitHub integrator / release agent | Prepare PRs, inspect checks, merge approved changes, and reconcile branch state | Sequential for mutations | Correct base, current head SHA, required checks, reviewed diff |

These are responsibilities, not a requirement to create thirteen new agent definitions. Map them onto the agents already registered in the repository. Add a new agent only if the audit proves that no existing agent can own that responsibility without becoming ambiguous or overloaded.

4. Which work runs sequentially and which runs in parallel?
The key rule is: parallelize independent read and verification work, but serialize repository mutations, approval decisions, database migrations, and final certification.

#chatgpt-mermaid-_r_12v_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_12v_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_12v_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_12v_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_12v_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_12v_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_12v_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_12v_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_12v_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_12v_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_12v_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_12v_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_12v_ p{margin:0;}#chatgpt-mermaid-_r_12v_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_12v_ .label text,#chatgpt-mermaid-_r_12v_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ .node rect,#chatgpt-mermaid-_r_12v_ .node circle,#chatgpt-mermaid-_r_12v_ .node ellipse,#chatgpt-mermaid-_r_12v_ .node polygon,#chatgpt-mermaid-_r_12v_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .rough-node .label text,#chatgpt-mermaid-_r_12v_ .node .label text,#chatgpt-mermaid-_r_12v_ .image-shape .label,#chatgpt-mermaid-_r_12v_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_12v_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .rough-node .label,#chatgpt-mermaid-_r_12v_ .node .label,#chatgpt-mermaid-_r_12v_ .image-shape .label,#chatgpt-mermaid-_r_12v_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_12v_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_12v_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_12v_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_12v_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_12v_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_12v_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_12v_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_12v_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_12v_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_12v_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_12v_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_12v_ .icon-shape,#chatgpt-mermaid-_r_12v_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_12v_ .icon-shape p,#chatgpt-mermaid-_r_12v_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_12v_ .icon-shape .label rect,#chatgpt-mermaid-_r_12v_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_12v_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_12v_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_12v_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_12v_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_12v_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_12v_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_12v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_12v_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_12v_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_12v_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_12v_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_12v_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_12v_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_12v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_12v_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_12v_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_12v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_12v_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_12v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_12v_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_12v_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_12v_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_12v_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_12v_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .node rect,#chatgpt-mermaid-_r_12v_ .node circle,#chatgpt-mermaid-_r_12v_ .node ellipse,#chatgpt-mermaid-_r_12v_ .node polygon,#chatgpt-mermaid-_r_12v_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_12v_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_12v_ .node.mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_12v_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_12v_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_12v_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}W0: Freeze baseline and auditmain/branchesW1: Requirements-to-codematrixW2: Repository discovery andevidenceW3: Generate target-specificcontractW4: Upload and validatecandidateW5: Placement plan andpreflight testsHuman approves exactmanifest hash?Reject or revise candidateW6: Apply approvedplacement onceW7: Post-placement discoveryand snapshotW8A: Structural, type, contracttestsW8B: Composer, renderer,runtime testsW8C: Security, dependencies,evidence auditW9: Final gate on exact testedSHAAll mandatory gates pass?BLOCKED: preserve evidenceand create fix planW10: PR review and mergeW11: Verify main and archivefinal evidenceNoYesNoYes

Detailed wave schedule
W0
Sequential

Baseline and branch audit

Record main SHA, branch SHAs, PR targets, merged PRs, open issues, workflow runs, and existing canonical docs. Compare all requested branches and project-ai-gui. Do not modify repository state during this wave.

W1
Sequential

Requirements-to-code matrix

For every requirement, record its canonical requirement source, implementation path, test path, evidence, status, dependency, and acceptance criteria. Resolve whether the intended integration base is main or a controlled candidate branch before implementation begins.

W2
Parallel

Independent repository discovery

Run read-only inspections of block implementations, registry and schema contracts, Composer, renderer/runtime, theme/brand rules, tests, and GitHub branch history. Each worker owns a distinct audit domain and reports evidence rather than editing files.

W3–W5
Gated

Contract, candidate intake, and preflight

Generate the contract from the discovery snapshot; validate the candidate; create the placement manifest; run safe preflight tests. The approval screen must show the exact candidate and manifest hashes. No repository placement is allowed yet.

W6–W7
Sequential

Approved placement and rediscovery

One placement executor applies approved changes. Then deterministic discovery generates a new snapshot. If the actual diff deviates from the approved manifest, stop and request a new approval.

W8
Parallel

Independent verification

Run structural/type tests, domain tests, Composer/browser/runtime tests, security checks, and evidence-integrity checks in isolated workers. All workers must test the same immutable candidate commit.

W9–W11
Sequential

Final gate, merge, and closure

Evaluate all mandatory results, review the PR, merge only after required checks pass, then verify main and record the final state. A failed or incomplete mandatory gate blocks publication.

Parallelization rules that must be enforced
No two agents may write the same files in the same wave.

No two agents may apply migrations or mutate the same test database concurrently.

Test agents may run concurrently only when they use isolated worktrees, services, or test data.

The placement agent cannot run before explicit approval of the exact manifest.

The final gate cannot use a test result from a different commit SHA.

A failed prerequisite blocks dependent work; do not silently skip a test and report overall success.

Documentation updates should be batched into canonical files, not multiplied into per-agent Markdown reports.

5. Define the implementation contracts before assigning coding work
Each agent needs an explicit input/output contract. Otherwise, the coordinator will have several agents reporting “done” while producing incompatible outputs.

5.1 Shared workflow state
The coordinator should own a single persisted workflow record. Use the repository's existing database and persistence layer if suitable; do not introduce a new database merely for agent coordination.

A proposed typed model:


  
from datetime import datetimefrom enum import StrEnumfrom pydantic import BaseModel, Fieldclass WorkflowStatus(StrEnum):    CREATED = "CREATED"    DISCOVERING = "DISCOVERING"    CONTRACT_READY = "CONTRACT_READY"    CANDIDATE_VALIDATING = "CANDIDATE_VALIDATING"    AWAITING_APPROVAL = "AWAITING_APPROVAL"    PLACEMENT_APPROVED = "PLACEMENT_APPROVED"    PLACED = "PLACED"    VERIFYING = "VERIFYING"    CERTIFIED = "CERTIFIED"    REJECTED = "REJECTED"    BLOCKED = "BLOCKED"class TargetBlock(BaseModel):    family: str    version: str    creation_mode: str  # I2_ONLY or MIX_AND_MATCH    contract_id: strclass WorkflowRun(BaseModel):    run_id: str    status: WorkflowStatus    target: TargetBlock    base_commit_sha: str    candidate_sha256: str | None = None    manifest_sha256: str | None = None    tested_commit_sha: str | None = None    created_at: datetime    updated_at: datetime
  
This is a proposed contract, not an instruction to add these exact classes if equivalent models already exist. Have the schema/persistence owner compare it with the current models first.

The coordinator must reject illegal state transitions. For example, AWAITING_APPROVAL → PLACED is forbidden without a valid approval record. VERIFYING → CERTIFIED is forbidden unless all required gates have valid passing evidence.

5.2 Agent result contract
Every agent should return a structured result, rather than only a free-form message.


  
from datetime import datetimefrom typing import Literalfrom pydantic import BaseModel, Fieldclass EvidenceRef(BaseModel):    evidence_id: str    path: str    sha256: str    media_type: str    source_commit_sha: strclass AgentResult(BaseModel):    run_id: str    agent_id: str    task_id: str    status: Literal[        "PASS", "FAIL", "BLOCKED", "SKIPPED"    ]    started_at: datetime    finished_at: datetime    exit_code: int | None = None    tested_commit_sha: str    summary: str    findings: list[str] = Field(default_factory=list)    blockers: list[str] = Field(default_factory=list)    evidence: list[EvidenceRef] = Field(default_factory=list)
  
Important distinctions:

FAIL means a check ran and failed.

BLOCKED means it could not safely or validly run.

SKIPPED means it was intentionally not run, with a recorded reason.

PASS means the named check actually ran and satisfied its acceptance criteria.

A missing test result must never default to PASS.

5.3 Placement manifest
The placement planner should produce a machine-readable manifest that can be reviewed before any changes are applied.


  
from typing import Literalfrom pydantic import BaseModelclass PlacementItem(BaseModel):    source_path: str    target_path: str | None    action: Literal[        "ADD", "UPDATE", "EXTEND", "REUSE", "REJECT"    ]    reason: str    expected_before_sha256: str | None = None    candidate_sha256: str | None = None    required_tests: list[str]class PlacementManifest(BaseModel):    run_id: str    target_family: str    target_version: str    base_commit_sha: str    candidate_sha256: str    items: list[PlacementItem]    approval_required: bool = True
  
The manifest should also be bound to a canonical manifest hash. Approval records must reference that hash, so changing the plan invalidates the earlier approval.

For existing files, compare their current content against expected_before_sha256 before modifying them. If the file changed since planning, stop and regenerate the plan rather than overwriting the newer content.

6. How candidate intake and placement should work
The candidate intake pipeline must be deterministic for file and repository facts, even if an LLM assists with semantic classification.


  
from pathlib import PurePosixPathimport hashlibMAX_FILES = 500MAX_FILE_BYTES = 5 * 1024 * 1024MAX_TOTAL_BYTES = 50 * 1024 * 1024def sha256_bytes(content: bytes) -> str:    return hashlib.sha256(content).hexdigest()def validate_candidate_entries(entries):    """    `entries` is a sequence of (archive_path, content_bytes).    The archive extraction layer must separately enforce safe extraction.    """    if len(entries) > MAX_FILES:        raise ValueError("Candidate exceeds file-count limit")    seen = set()    total_bytes = 0    inventory = []    for archive_path, content in entries:        path = PurePosixPath(archive_path)        if path.is_absolute() or ".." in path.parts:            raise ValueError(f"Unsafe path: {archive_path}")        normalized = str(path)        if normalized in seen:            raise ValueError(f"Duplicate candidate path: {normalized}")        seen.add(normalized)
  
This is a starting validation function, not a complete secure archive extractor. The actual implementation must also protect against symlinks, archive bombs, path normalization collisions, disallowed file types, and dependency or script execution during validation.

After inventory, the candidate workflow should:

Resolve the workflow's original target family and version.

Verify that the submitted candidate references the expected contract ID and hash.

Compare its file inventory with the current repository snapshot.

Validate required files, schemas, dependencies, and naming conventions.

Produce the placement manifest.

Run non-mutating checks.

Request approval.

Apply the approved changes in an isolated worktree or branch.

Compare the actual diff against the manifest.

Run post-placement verification.

Never execute candidate scripts, package installation hooks, or arbitrary build commands in a privileged environment simply because they were uploaded.

7. Certification must verify the actual Tutorial Composer journey
A component compiling in isolation is not sufficient. The certification workflow must exercise the real authoring and rendering path.

| Gate | What it proves | Required evidence |

| ------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |

| G1 — Repository discovery | Correct block and integration files were found | Snapshot manifest and file hashes |

| G2 — Contract compliance | Candidate matches the requested family/version and requirements | Contract validation output |

| G3 — Structural/type checks | Required schemas, types, and exports are valid | Actual command output and exit code |

| G4 — Registry integration | Composer can discover the block | Registry/discovery test results |

| G5 — Authoring | Author can select and configure it | Component or browser test output |

| G6 — Serialization | Saved tutorial data preserves identity, version, and configuration | Validated serialization fixture/output |

| G7 — Renderer/runtime | Existing runtime renders the selected block correctly | Renderer and runtime test results |

| G8 — Browser E2E | The real authoring-to-render journey succeeds | Browser report, screenshots or trace, console output |

| G9 — Security and platform boundaries | No prohibited dependency, brand coupling, or runtime replacement | Relevant security and compatibility results |

| G10 — Evidence integrity | All results correspond to the same tested commit | Evidence manifest and SHA validation |

| G11 — Final gate | All mandatory requirements are satisfied | Final machine-readable verdict |

For I2-only creation, the tests must prove the intended I2 family/version is preserved. For Mix & Match, tests must additionally validate the compatibility of the submitted composition. The certification of individual blocks and the certification of a composition must remain distinct.

8. Log all tests so the results can be independently audited
This is essential to your request. When code is uploaded to GitHub, I should be able to inspect the recorded evidence and determine which tests ran, which failed, what was skipped, and whether the tested code is the code that was merged.

8.1 Canonical evidence layout
First check the existing evidence conventions and reuse them. If the existing structure can hold these records, extend it rather than creating another parallel evidence directory.

A possible logical structure is:


  
.agents/
  
  evidence/
  
    agent-runs.jsonl
  
    evidence.jsonl
  
    test-results.jsonl
  
    <run-id>/
  
      run-manifest.json
  
      branch-audit.json
  
      requirements-matrix.json
  
      repository-snapshot.json
  
      candidate-inventory.json
  
      placement-manifest.json
  
      approval-record.json
  
      test-results.json
  
      final-verdict.json
  
      logs/
  
        <task-id>.stdout.log
  
        <task-id>.stderr.log
  
      artifacts/
  
        <task-id>-junit.xml
  
        <task-id>-browser-report.zip
  
These are proposed logical artifacts, not a recommendation to create all these paths unconditionally. Extend the current canonical evidence model where possible; create a separate artifact only if the existing model cannot represent a required record.

8.2 Test result format
Each test execution should produce a record similar to this:


  
{
  
  "run_id": "project-llm-20261012-example",
  
  "task_id": "composer-browser-e2e",
  
  "agent_id": "composer-integration-verifier",
  
  "command": "pnpm test:e2e",
  
  "working_directory": "actual/package/path",
  
  "started_at": "2026-10-12T08:00:00Z",
  
  "finished_at": "2026-10-12T08:01:25Z",
  
  "exit_code": 1,
  
  "status": "FAIL",
  
  "tested_commit_sha": "full-40-character-sha",
  
  "stdout_path": "logs/composer-browser-e2e.stdout.log",
  
  "stderr_path": "logs/composer-browser-e2e.stderr.log",
  
  "artifacts": [],
  
  "failure_summary": "Replace with the real failure summary"
  
}
  
The example is a schema illustration, not a real test result. Actual records must contain the actual command, timestamps, SHA, exit code, and output. Never insert a synthetic result merely to make the evidence inventory look complete.

Record at least:

Repository, branch, full commit SHA, and workflow run ID.

Agent and task IDs.

Exact command and working directory.

Start/end timestamps and exit code.

Raw stdout/stderr or a securely stored equivalent.

Test report paths and artifact hashes.

Skipped-test reasons and unresolved blockers.

Dependency versions and runtime/environment information needed for reproduction.

Whether the result was obtained locally or from GitHub Actions.

8.3 Capture command output reliably
A shared helper can capture test commands, but it must be called from the actual test runner and must not swallow failures.


  
import jsonimport subprocessfrom datetime import datetime, timezonefrom pathlib import Pathdef run_and_record(    command: list[str],    *,    cwd: str,    run_id: str,    task_id: str,    tested_commit_sha: str,    log_dir: Path,) -> dict:    log_dir.mkdir(parents=True, exist_ok=True)    started_at = datetime.now(timezone.utc)    result = subprocess.run(        command,        cwd=cwd,        capture_output=True,        text=True,        shell=False,        check=False,    )    finished_at = datetime.now(timezone.utc)    stdout_path = log_dir / f"{task_id}.stdout.log"    stderr_path = log_dir / f"{task_id}.stderr.log"    stdout_path.write_text(result.stdout, encoding="utf-8")    stderr_path.write_text(result.stderr, encoding="utf-8")    status = "PASS" if result.returncode == 0 else "FAIL"    record = {        "run_id": run_id,        "task_id": task_id,        "command": command,        "working_directory": cwd,        "started_at": started_at.isoformat(),        "finished_at": finished_at.isoformat(),        "exit_code": result.returncode,        "status": status,        "tested_commit_sha": tested_commit_sha,        "stdout_path": str(stdout_path),        "stderr_path": str(stderr_path),    }    result_path = log_dir / f"{task_id}.result.json"    result_path.write_text(        json.dumps(record, indent=2) + "\n",        encoding="utf-8",    )    return record
  
This helper is illustrative. Production code must add timeout handling, cancellation, redaction of secrets, bounded output sizes, artifact hashing, and robust failure recording if writing the evidence itself fails. It must not report a test as passing if evidence persistence failed.

For CI, upload test reports and logs as GitHub Actions artifacts even when tests fail. Commit only the evidence that is intended to be part of the repository's canonical audit trail; avoid committing enormous or sensitive raw logs. The durable record should contain artifact references, hashes, and the GitHub Actions run URL.

9. GitHub Actions implementation
The current integration workflow has a PostgreSQL service and runs Drizzle migrations before Python tests. Its current branch triggers include main and m2-project-ai-canonical-wiring, but do not explicitly include project-llm-e2e-implementation as a push target. Pull-request execution is therefore particularly important.

I would organize the CI workflow into dependent jobs:


  
name: Project LLM Verification
  

  
on:
  
  pull_request:
  
  push:
  
    branches:
  
      - main
  

  
permissions:
  
  contents: read
  

  
jobs:
  
  static-checks:
  
    runs-on: ubuntu-latest
  
    steps:
  
      - uses: actions/checkout@v4
  
        with:
  
          fetch-depth: 0
  

  
      - name: Record tested commit
  
        run: git rev-parse HEAD > tested-commit.txt
  

  
      - name: Install dependencies
  
        run: |
  
          corepack enable
  
          pnpm install --frozen-lockfile
  

  
      - name: Run type checks
  
        run: pnpm type-check
  

  
      - name: Upload static-check evidence
  
        if: always()
  
        uses: actions/upload-artifact@v4
  
        with:
  
          name: static-check-evidence
  
          path: |
  
            tested-commit.txt
  
            **/test-results/**
  
            **/coverage/**
  
          if-no-files-found: warn
  

  
  backend-tests:
  
    runs-on: ubuntu-latest
  
    steps:
  
      - uses: actions/checkout@v4
  
        with:
  
          fetch-depth: 0
  

  
      - name: Run Project AI tests
  
        run: |
  
          cd services/project-ai
  
          python -m pytest -q
  

  
      - name: Upload backend evidence
  
        if: always()
  
        uses: actions/upload-artifact@v4
  
        with:
  
          name: backend-test-evidence
  
          path: |
  
            services/project-ai/test-results/**
  
            services/project-ai/.pytest_cache/**
  
          if-no-files-found: warn
  

  
  integration-gate:
  
    needs:
  
      - static-checks
  
      - backend-tests
  
    if: always()
  
    runs-on: ubuntu-latest
  
    steps:
  
      - name: Require prerequisite jobs to pass
  
        env:
  
          STATIC_RESULT: ${{ needs.static-checks.result }}
  
          BACKEND_RESULT: ${{ needs.backend-tests.result }}
  
        run: |
  
          test "$STATIC_RESULT" = "success"
  
          test "$BACKEND_RESULT" = "success"
  
Do not paste this into the repository unchanged. The package scripts, test-report paths, Python environment, database requirements, and migration commands must be reconciled with the actual monorepo. For example, pnpm type-check must exist at the root, or be replaced by the appropriate workspace command. This minimal workflow is a design sketch for dependency gating, not a verified drop-in workflow.

The final production workflow also needs:

A disposable, isolated PostgreSQL test target where integration tests require it.

Drizzle migration verification before dependent database tests.

Explicit browser E2E tests for the real Composer/runtime journey.

if: always() evidence uploads, without making failed tests appear successful.

A final gate that fails if any required job is failed, cancelled, skipped, or missing.

A protected, reviewable merge path and exact tested-SHA verification.

Do not use the presence of a successful CI job alone as certification if that job contains mocked approval, stubbed browser steps, or placeholder results.

10. Branch reconciliation and merge agents
The branch cleanup should be a distinct workflow from candidate-block implementation. It has different safety requirements.

| Step | Agent | Output |

| ---- | --------------------- | ------------------------------------------------------------------------------------- |

| B0 | Branch auditor | All branch SHAs, merge bases, ahead/behind counts, open/merged PR state |

| B1 | Diff classifier | Unique code changes, duplicate files, obsolete artifacts, conflicting implementations |

| B2 | Test-evidence auditor | Actual CI results for each candidate SHA; identifies stale or incomplete evidence |

| B3 | Integration planner | Proposed merge order and target branch with justification |

| B4 | Fix agents | Repair selected test/code defects on isolated branches |

| B5 | Independent reviewer | Reviews final diff, security, tests, evidence integrity |

| B6 | Release coordinator | Updates PR target or creates a focused PR; waits for required checks |

| B7 | Final verifier | Confirms merged SHA, checks main, and updates canonical status records |

For the branches currently in scope:

M1: no further merge is required; PR #23 is already merged.

M2 foundation and canonical wiring: determine the unique, still-needed changes and reconcile them before merging.

E2E implementation / PR #24: preserve useful fixes, but resolve the declared test and E2E gaps before approval.

E2E implementation fix: first locate its changes or establish that the branch no longer exists.

GUI branch: audit its unique UI work and integration contracts before inclusion.

Open issues and dependency PRs: classify independently; do not close them merely because a similarly named branch has been merged.

The release agent must not force-push shared branches, bypass required checks, or close unresolved issues just to reach a clean-looking dashboard.

11. Definition of done
The implementation should be considered complete only when all the following are demonstrably true.

Current repository state, branches, PRs, and canonical artifacts have been audited.

Every requirement maps to actual implementation and a test or an explicitly recorded gap.

Existing agent definitions are reused wherever they can own the work.

Repository discovery is deterministic and produces a reproducible snapshot.

The engineering contract is derived from repository evidence and bound to the selected target/version.

Candidate intake is safe, hashed, and validated.

Placement is planned and approved against the exact manifest hash.

The placement executor changes only approved files.

Post-placement discovery verifies the actual result.

Composer discovers, selects, configures, and serializes the certified block.

The existing renderer and runtime display it correctly.

Browser E2E verifies the real authoring-to-render journey without simulated approval.

I2-only creation and Mix & Match composition verification are tested separately.

All mandatory results are tied to the exact tested commit SHA.

Logs, exit codes, reports, and evidence artifacts are retained.

Final certification is fail-closed: missing or inconclusive mandatory evidence means BLOCKED.

Branches and issues are merged or closed only after the relevant changes are verified.

The final main state and merged SHA are independently checked.

12. How we should execute this in practice
Start with W0 and W1 only. Ask the Project AI coordinator to perform the read-only audit, reconcile the existing evidence, and produce the requirements-to-code matrix. Do not begin schema changes or broad parallel coding until those outputs identify the actual missing work.

Then assign disjoint implementation domains to agents, require each to return its structured result and evidence references, integrate through one controlled writer, and run the final gate on a frozen commit. Upload the resulting PR, CI reports, artifacts, and canonical evidence records to GitHub. I can then inspect the repository and the actual run results to distinguish what is implemented, what passed, what failed, and what remains pending.

That gives us a traceable implementation rather than a collection of agent claims—and makes it possible to improve Project LLM while preserving the existing Tutorial Composer architecture.

