# Project LLM: recommended implementation plan

I reviewed the uploaded Project LLM Requirements Status Audit, audited on October 14, 2026, against repository revision `53ed8b0e` on `main`.

The central recommendation is to finish the end-to-end integration before adding more features or declaring the project complete. The audit identifies substantial backend foundations, but the admin frontend does not yet consistently use the real API, the golden E2E test can accept `BLOCKED`, and I2 is not implemented as a supported renderer target. Those are distinct gaps that need to be closed with evidence.&#x20;

Pasted markdown.md



## 1. What to prioritize

Priority 1 — Make release evidence truthful

Replace the simulated golden E2E with a real workflow using current APIs and verification runners. It must fail if required evidence is missing, and require `overall == PASS` tied to the tested commit SHA. `BLOCKED` should be a reported outcome, not a successful release test.

Priority 2 — Align the frontend and backend API

Establish one API contract based on the actual FastAPI routes and request/response models. Update the admin client, proxy/base URL, authentication, uploads, placement approval, and error handling to match it.

Priority 3 — Make the UI evidence-driven

Replace hard-coded workflow timelines, agent status, logs, evidence, and local workflow state with responses from the backend. The server's workflow ID and state should be authoritative.

Priority 4 — Implement I2 end to end

Add I2 through the canonical registry, schema, renderer component, Composer data path, tests, and verification. Do not present I2 as supported while the renderer deliberately rejects it.

Priority 5 — Run independent verification

Run the relevant backend and frontend suites, start the actual application, perform a browser-backed E2E run, and retain raw results and evidence tied to the tested commit.

This ordering follows the audit's remaining-work list; it is a dependency-based plan, not a claim that any of these tasks have now been implemented.&#x20;

Pasted markdown.md



## 2. Execute the work in controlled phases

Use your multi-agent workflow, but assign separate ownership and require one integration owner to reconcile the results. Parallel work should not mean parallel edits to the same API contract or documentation.

| Phase                | Owner                     | Deliverable and exit condition                                                                           |
| -------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| A. Baseline          | Verification lead         | Confirm branch, commit, working tree, relevant test commands, and current failures.                      |
| B. API contract      | Backend + frontend agents | A single verified API schema; client calls match real routes and models.                                 |
| C. UI integration    | Frontend agent            | Workflow creation, candidate upload, approval, progress, and evidence views use backend data.            |
| D. Real E2E          | Integration agent         | Actual application and API run through the required gates; no simulated PASS results.                    |
| E. I2                | Runtime agent             | I2 is registered, rendered, supplied with Composer data, and verified end to end.                        |
| F. Independent audit | Separate reviewer         | Re-run relevant tests, inspect the diff, verify evidence and commit SHA, and report unresolved blockers. |

Important: phases B and C can overlap only after the API contract is agreed. I2 work can proceed in parallel if it does not alter shared renderer or registry interfaces without coordination.

## 3. Give every agent the same governing instructions

Use this as the common instruction for the Project AI agents.

# Project LLM — Implementation and Verification Directive

## Objective

Complete the existing Project LLM implementation against the repository's canonical requirements. Prioritize truthful release evidence and end-to-end frontend/backend integration over adding unrelated features.

## Mandatory rules

1. Inspect the current repository, existing documentation, API routes, models, tests, and evidence before making changes.
2. Reuse and update existing canonical Markdown documents. Do not create another document when the same information belongs in an existing one. Create a new document only when no appropriate canonical location exists.
3. Treat the actual source code, API contracts, and reproducible test results as authoritative. A planning document, simulated test, or test that accepts BLOCKED does not prove completion.
4. Do not claim PASS unless the required operation actually ran and its evidence is available.
5. Never use production data for write-capable integration tests. Verify the effective database target before running them.
6. Preserve human approval gates, repository authorization, snapshot binding, and certification requirements.
7. Do not weaken assertions merely to make tests pass. Any contract change must be justified against the intended API behavior.
8. Do not add GitHub Actions, Docker, a new database, or unrelated infrastructure without separate approval.
9. Do not push, merge, reset, rewrite history, or discard user changes without explicit authorization.
10. Do not expose credentials or secrets in logs, reports, commits, or evidence.

## Work areas

- Backend: verify the canonical workflow, request/response models, state transitions, approval gates, and evidence persistence.
- Frontend: align the client with the real FastAPI API and replace static or local-only workflow data with server responses.
- E2E: replace simulated stages with actual API operations and required verification runners. Missing required evidence must fail release verification.
- Runtime: implement I2 through the canonical registry, schema, renderer, Composer data flow, and tests before advertising it as supported.
- Verification: run tests against the exact target commit and preserve raw output, exit codes, and failure details.

## Completion report

For every requirement, report:

- status: COMPLETE, PARTIAL, BLOCKED, or NOT STARTED;
- files changed;
- focused tests and commands run;
- actual results and exit codes;
- evidence location and tested commit SHA;
- unresolved dependencies and risks.

A separate reviewer must verify completion claims. Do not describe the project as release-ready while required integration, browser verification, or release evidence remains blocked.

## 4. What counts as proof of completion?

Use these gates rather than relying on an agent's summary.

## Release-readiness checklist

0 of 6

Repository baseline

The target commit, branch, working-tree state, and diff are recorded before and after work.

API contract

Frontend requests and responses match actual FastAPI routes, models, authentication, and error behavior.

Real workflow

The workflow exercises intake, comparison, human approval, isolated-worktree placement, verification, and final approval.

Evidence integrity

Required evidence exists, is tied to the tested commit SHA, and cannot be replaced by a stub or a BLOCKED result.

Runtime compatibility

I2 and the supported reference versions preserve registry, renderer, Composer, theme, brand, and runtime constraints.

Independent verification

Relevant tests and a real browser run have raw results; failures and skips are explained rather than hidden.

## 5. Start with these checks

Before assigning implementation work, establish a fresh baseline on the actual checkout. From the repository root, run:

```
git branch --show-current
git log -1 --format="%H%n%s"
git status --short
git diff --check
```

Then inspect the existing Project LLM implementation and tests before changing files. The audit identifies these key areas:

- `services/project-ai/app/orchestration/canonical_workflow.py`
- `services/project-ai/app/contracts/engineering_contract.py`
- `services/project-ai/app/api/routes/candidate.py`
- `services/project-ai/app/api/routes/workflows.py`
- `services/project-ai/app/placement/executor.py`
- `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/`
- `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

These paths come from the uploaded audit; they should be confirmed against the current checkout before edits.&#x20;

Pasted markdown.md



Do not begin by rerunning every test in the repository or by adding another summary document. First record the baseline and confirm the current failures. Then address the API mismatch and release-test integrity, because both affect whether the existing implementation can be trusted.

One final distinction: the audit is evidence of what was assessed at revision `53ed8b0e`, not proof that the current working tree has the same state or that the listed fixes have since landed. I have not made repository changes or independently rerun those tests in this turn.

 

# Project LLM: Detailed implementation and verification guide — Priorities 1–5

The goal is to take Project LLM from a backend with substantial engineering capabilities to a working, verifiable end-to-end system in which the admin frontend uses the real backend, workflows follow one authoritative state machine, human approvals are enforced, verification evidence is genuine, and certification happens only when the required gates have passed.

I will explain this in four parts:

1. What Priorities 1–5 mean in practical engineering terms.
2. How to execute the work in controlled phases.
3. How to coordinate all agents using one shared set of rules.
4. What concrete evidence is required before accepting work as complete.

The recommendations below are grounded in your uploaded requirements audit, which identifies the main gaps as simulated release evidence, frontend/backend API mismatches, static workflow UI data, and missing end-to-end I2 support.&#x20;

Pasted markdown.md



## Part 1 — What Priorities 1–5 actually mean

## Priority 1: Make release evidence truthful

## Build a real release-verification workflow

Purpose: prove that the application actually works instead of merely reporting that it should work.

### What is the problem?

The audit identifies a golden E2E test that simulates stages, accepts either `PASS` or `BLOCKED`, and does not prove that the complete workflow ran against the current implementation. It also identifies an evidence file dated October 13, 2026, tied to an older branch and reporting `overall: BLOCKED`.&#x20;

Pasted markdown.md



That means there are three different things which must not be confused:

- Implementation exists: the code for a capability is present.
- Verification ran: a test or real execution exercised that capability.
- Release is approved: all mandatory verification requirements passed for the exact release candidate.

For example, a test that returns `BLOCKED` because Playwright is missing may accurately describe the environment. It does not prove browser certification succeeded.

### What should the Project AI model do?

The Project AI model should coordinate the actual workflow and record the evidence generated at each stage.

1\. Start workflow

Record workflow ID, repository, target identity and source snapshot.

2\. Intake and compare candidate

Validate the submitted files, manifest, hashes and target match.

3\. Human implementation approval

Require the authorized approval bound to the exact workflow and target.

4\. Execute in an isolated worktree

Apply only authorized repository changes and capture the resulting diff and commit identity.

5\. Run required verification

Execute tests, runtime checks, theme/brand checks and browser verification where required.

6\. Final human approval and certification

Certify only when all mandatory evidence exists, passes and belongs to the current candidate.

This is the intended verification flow, not a claim that the full flow currently works. The audit specifically says the golden E2E needs to be changed to call current APIs and actual verification runners.&#x20;

Pasted markdown.md



### What needs to be implemented?

1. Replace mocked or stubbed workflow stages with real API calls and real verification execution.
2. Make the test assert the expected result for every mandatory stage.
3. Require `overall == PASS` for a successful release-verification run.
4. Record the tested commit SHA, workflow ID, evidence IDs, timestamps, and stage outcomes.
5. Fail or report `BLOCKED` if a required tool, environment, approval, or piece of evidence is missing.
6. Prevent final certification when required stages are failed, blocked, skipped without authorization, or unverified.
7. Preserve the raw outputs so another reviewer can reproduce the result.

Important distinction: a workflow can correctly report `BLOCKED`; the release gate must not treat that as a passing release test.

### What is the deliverable?

A real, API-driven golden E2E test and a corresponding evidence record. A reviewer should be able to answer:

- Which candidate was tested?
- Which source revision was used?
- Which stages actually executed?
- Which tests and browser checks ran?
- Where is the raw evidence?
- Did every mandatory gate pass?
- Was final certification permitted by the actual gate logic?

### When is Priority 1 complete?

Only when a real run exercises the required workflow, the evidence is tied to the tested SHA, and missing or failed mandatory evidence prevents a release PASS. Updating the test so that it merely asserts `PASS` without actually running the stages is not sufficient.

## Priority 2: Align the frontend and backend API

## Create one API contract and make both sides follow it

Purpose: eliminate the situation where the frontend calls endpoints or sends data that the backend does not support.

### What is the problem?

The audit says the admin frontend's `projectLlmClient.ts` calls endpoints that do not match the FastAPI implementation. It gives examples involving multipart candidate uploads, candidate routes, and placement approval.&#x20;

Pasted markdown.md



If the frontend sends `workflowId` and files as multipart form data but the backend expects a JSON `CandidatePackage`, the request can fail even when both the frontend and backend look reasonable in isolation.

The solution is not to keep adding endpoint-specific workarounds. It is to define one contract.

### What does an API contract include?

For each operation, document and verify:

| Contract element | What must be explicit                                    |
| ---------------- | -------------------------------------------------------- |
| Method and path  | For example, `POST /...` and the actual registered route |
| Authentication   | Required identity, role and permissions                  |
| Request          | JSON schema, multipart fields or file payload            |
| Response         | Response schema, identifiers and state fields            |
| Errors           | Expected HTTP status codes and error body                |
| State rules      | Which workflow states permit the operation               |
| Evidence         | What is recorded after successful or failed execution    |

The route examples above are illustrative. The actual paths and payloads must come from the current FastAPI route definitions and models.

### What should the agents do?

Backend agent

- Inventory the registered FastAPI routes and their request/response models.
- Confirm authentication and authorization requirements.
- Document legal state transitions and expected error responses.
- Expose the canonical OpenAPI schema if the application supports it.
- Add or update focused API tests.

Frontend agent

- Inspect every call in `projectLlmClient.ts` and the Project LLM pages.
- Map each call to a real backend operation.
- Update request encoding, payload names, response parsing and error handling.
- Configure the correct API base URL or proxy.
- Remove invented endpoints and assumptions about backend state.

Integration agent

- Exercise each operation across the frontend/backend boundary.
- Test success, invalid payload, unauthorized access, forbidden access, missing resources, and invalid workflow state.
- Check that the server-generated workflow ID and status are used consistently.

### What is the deliverable?

One canonical API contract, a matching client, and contract tests. Prefer a generated or schema-validated client where practical, but do not introduce unnecessary infrastructure solely to generate it.

### When is Priority 2 complete?

Every Project LLM frontend call must resolve to a real, verified API contract. A frontend page rendering successfully is not enough: its requests must reach the correct backend, use the correct payloads, handle responses correctly, and respect authorization and workflow-state rules.

## Priority 3: Make the admin UI evidence-driven

## Replace illustrative UI data with actual workflow data

Purpose: make the admin interface display what the backend actually knows, rather than what the frontend assumes.

### What is the problem?

The audit identifies static timelines, agent information, evidence lists, logs, and browser-persisted presentation state in the Project LLM admin UI. It says workflow and progress views need to become server-backed.&#x20;

Pasted markdown.md



Suppose the backend reports:

```
Workflow: wf-123
State: VERIFICATION_BLOCKED
Browser verification: BLOCKED
```

The frontend must not display:

```
Workflow: Completed
State: CERTIFIED
Browser verification: PASS
```

It must show the actual server state and explain why certification is blocked.

### What should change?

A. Workflow creation

The frontend submits the request to the backend. The backend creates the workflow and returns its canonical ID and state. The frontend must not invent a workflow ID or treat local storage as the workflow authority.

B. Progress and state

Display the actual workflow state and stage results from the server. If polling or refresh is required, refresh from the backend rather than advancing a local timeline optimistically.

C. Evidence and logs

Display evidence IDs, outcomes, timestamps, relevant commit SHA, and links or details for stored artifacts returned by the server. Clearly distinguish unavailable evidence from a failed test and a successful test.

D. Approval and certification

Show whether approval is required, pending, rejected, or granted. Only display certification as complete when the authoritative backend confirms it.

E. User experience

Implement loading, error, empty, stale-data, and blocked states. Avoid a blank screen or a fabricated success message when an API call fails.

### What about local storage?

Local storage can retain harmless presentation preferences, such as a collapsed panel or selected display filter. It must not be the authority for:

- Workflow identity or lifecycle state.
- Approval decisions.
- Verification outcomes.
- Evidence records.
- Certification status.

### When is Priority 3 complete?

Create a workflow through the UI, refresh the page, and verify that the same workflow and authoritative state are retrieved from the backend. Force an API failure and a blocked workflow; both must be displayed honestly. Verify that the UI never converts missing data into a success state.

## Priority 4: Implement I2 end to end

## Make I2 a real, registered, supported tutorial version

Purpose: ensure a candidate targeting I2 can be discovered, composed, rendered and verified through the actual runtime.

### What is the problem?

The audit says the renderer deliberately rejects Introduction versions other than I1. It identifies I2 as present in types, fixtures, or unsupported-version tests, rather than as an actual implementation.&#x20;

Pasted markdown.md



Adding `I2` to a TypeScript union type is not the same as implementing I2. The entire path from registry to rendered page must work.

### What must be implemented?

1

1\. Schema and types

Define I2's data contract, required properties, validation rules and compatibility expectations.

2

2\. Canonical registry

Register I2 through the existing version-discovery mechanism. Avoid adding a separate hard-coded registry.

3

3\. Component

Implement the I2 renderer/component with the correct runtime, theme and brand integration.

4

4\. Composer integration

Ensure Composer can discover, select and supply valid I2 data, rather than relying on a fixture-only path.

5

5\. Renderer routing

Route I2 to its actual component and retain explicit rejection of genuinely unsupported versions.

6

6\. Tests and verification

Test valid and invalid I2 data, registry discovery, DOM/rendering behavior, runtime contracts and the required browser checks.

### Preserve the existing architecture

The audit specifically calls out the boundaries for ILS, LSNB, RSSB, UBRC, theme, and brand. These constraints need to be verified against the canonical engineering contract and the actual runtime.&#x20;

Pasted markdown.md



Do not create an I2-specific bypass around shared renderer rules, theme providers, or runtime integration simply to make a test pass.

### When is Priority 4 complete?

A real I2 candidate must be discoverable through the canonical registry, selected by Composer, rendered by the intended component, and verified through the required runtime and browser path. Unsupported or invalid I2 inputs must fail predictably. Tests that only verify the string `"I2"` exists do not establish completion.

## Priority 5: Run independent verification

## Prove the integrated system works on the target commit

Purpose: verify the completed work independently rather than accepting implementation agents' claims.

Priority 5 is not simply “run pytest.” It is the verification and release decision for Priorities 1–4.

### What should be run?

1. Focused backend tests: validate changed routes, models, workflow transitions, approvals and evidence handling.
2. Relevant frontend tests: validate API-client behavior, state rendering, loading/error cases, and I2 renderer routing.
3. Contract tests: verify the frontend's requests and responses match the actual API.
4. Integration tests: exercise real backend operations against a verified isolated test environment.
5. Browser E2E: start the application and exercise the real admin workflow, including blocked and successful paths.
6. Security tests: check authentication, authorization, approval binding and protection against unauthorized repository mutation.
7. Independent review: inspect the diff, assertions, generated files, evidence records and unresolved failures.

### Important database safeguard

Before running write-capable integration tests, verify the effective `DATABASE_URL_TUTORIAL` target and confirm that it is an approved isolated test database or equivalent isolated test environment.

The environment variable's name, a transaction rollback, or a test report claiming rollback does not by itself prove that production data is protected. Do not run write-capable integration tests against `tutorial_prod`.

### What should the final report contain?

- Exact branch and commit SHA tested.
- Exact commands executed and their exit codes.
- Passed, failed, skipped and blocked test counts.
- Raw output and evidence locations.
- Browser run results.
- Security and database-isolation findings.
- Known limitations and unresolved defects.
- A final `COMPLETE`, `PARTIAL`, or `BLOCKED` status for each requirement.

### When is Priority 5 complete?

When an independent reviewer can reproduce the relevant results, all mandatory release gates have passed, evidence is tied to the correct revision, and no critical blocker remains hidden behind skipped tests, stubs, or permissive assertions.

The audit explicitly says that focused backend tests alone are not enough to declare the whole project release-ready.&#x20;

Pasted markdown.md



# Part 2 — Execute the work in controlled phases

The five priorities describe what must be achieved. Controlled phases describe how to achieve it safely without agents conflicting, creating duplicate work, or claiming completion prematurely.

## Phase A — Establish the baseline before coding

Objective: establish exactly what exists, what is broken, and which revision is being changed.

The verification lead should:

1. Confirm the current branch and commit.
2. Record whether the working tree contains uncommitted changes.
3. Read the existing Project LLM requirements, implementation notes, test reports and relevant source files.
4. Identify the existing canonical documentation to update.
5. Run focused baseline tests and record their actual results.
6. Identify whether the golden E2E is simulated, whether the frontend API calls match FastAPI, and whether I2 has a real implementation.

Use these commands from the repository root:

```
git branch --show-current
git log -1 --format="%H%n%s"
git status --short
git diff --check
```

These commands inspect repository state; they do not change branches or push anything.

Deliverable: a baseline report with the tested commit SHA, current defects, existing test evidence and recommended file ownership.

Exit condition: all agents know the baseline and understand which requirements remain incomplete. Do not accept a previous report as proof that the current checkout is unchanged.

## Phase B — Agree on the API contract

Objective: resolve the frontend/backend mismatch before implementing more UI behavior.

The backend agent inventories actual endpoints and schemas. The frontend agent inventories actual client calls. The integration owner compares them operation by operation.

For each operation, agree on:

- HTTP method and path.
- Authentication and authorization.
- Request format and fields.
- Response format and identifiers.
- Expected error responses.
- Legal workflow states.
- Evidence generated by the operation.

Then update the canonical API documentation or schema and add focused tests.

Deliverable: one agreed API contract and an explicit list of frontend calls that must change.

Exit condition: the backend and frontend agents agree on the same contract, and the integration owner verifies it against the actual registered routes and models.

Do not allow both agents to invent independent API designs and reconcile them only after implementation.

## Phase C — Wire the frontend to the real backend

Objective: make the admin UI operate on actual server workflows.

Implement in dependency order:

1. Workflow creation and server-generated ID.
2. Workflow detail retrieval and state refresh.
3. Candidate intake and validation.
4. Approval and authorization flow.
5. Verification progress, evidence and logs.
6. Final certification display.

Replace static data only where the backend has a real equivalent. If an endpoint is missing, document the gap and implement or agree on the required backend contract; do not silently substitute fake data.

Deliverable: functional UI screens backed by real API responses.

Exit condition: the core screens work across successful, failed, blocked, loading and empty states, and refreshing the browser preserves the real server-side workflow state.

## Phase D — Replace simulated E2E with actual execution

Objective: establish a repeatable end-to-end release test.

The E2E agent should:

1. Start the required services.
2. Create or select an approved test workflow.
3. Submit a candidate through the real API.
4. Exercise comparison and validation.
5. Exercise the required human approval gate.
6. Execute approved changes in an isolated worktree.
7. Run required verification tools, including browser verification.
8. Capture results and evidence.
9. Exercise final approval and certification gating.
10. Assert that certification is refused if required evidence is missing or any mandatory gate fails.

Deliverable: a real E2E test and evidence ledger for the tested revision.

Exit condition: the test genuinely executes the required operations and rejects missing or failed evidence. A mocked workflow or a test that accepts `BLOCKED` as a successful release does not satisfy this phase.

## Phase E — Implement I2

Objective: complete the missing runtime path without breaking I1, C1, D1 or shared integration contracts.

The runtime agent should follow the existing registry, schema, component, Composer and renderer architecture. The agent must inspect how the reference versions preserve DOM identity, runtime behavior, theme and brand constraints before making changes.

Deliverable: a registered, composable, renderable and testable I2 implementation.

Exit condition: I2 works in the actual application path, and regression tests demonstrate that existing supported versions still work.

## Phase F — Independent verification and release decision

Objective: determine whether the work is actually complete.

The reviewer should not rely solely on the implementation agents' reports. The reviewer must inspect the resulting diff, execute relevant tests independently, review raw results, confirm database isolation, and check that the evidence belongs to the target commit.

The reviewer should also verify that existing documentation has been updated rather than duplicated, and that no credentials or generated test artifacts have been accidentally exposed or committed.

Deliverable: an independent audit with evidence and explicit remaining blockers.

Exit condition: each requirement has a defensible status, and release readiness is declared only if all mandatory gates are satisfied.

### Dependency and parallel-work rules

### Recommended execution order

A. Baseline

Establish the current state first.

B. API contract

Agree on shared interfaces.

C. Frontend integration + D. E2E design

Can overlap once API ownership and contracts are fixed.

E. I2

Can overlap with C/D if shared files and interfaces are coordinated.

F. Independent verification

Verify the integrated result, not just individual contributions.

This permits useful parallelism without allowing multiple agents to make conflicting changes to the same contract, registry or evidence format.

# Part 3 — Give every agent the same governing instructions

The purpose of shared instructions is to prevent each agent from optimizing only for its own task. For example, a frontend agent must not declare a feature complete just because the page renders, while a backend agent must not declare it complete just because a unit test passes.

All agents should receive the same mandatory rules, followed by their individual responsibilities.

## A. Shared rules that apply to every agent

### Rule 1 — Inspect before editing

Every agent must inspect the existing implementation, requirements, tests and canonical documents before changing files.

The agent should identify the intended files to change and explain why the change belongs there. It should not create another Markdown file just because a new task has started.

### Rule 2 — Source code and executable evidence are authoritative

An implementation plan is not implementation. A test fixture is not a production code path. A simulated E2E result is not proof that the real workflow works.

Every completion claim must point to source changes and reproducible evidence.

### Rule 3 — Preserve the canonical workflow and human gates

No agent may bypass the canonical state machine, approval requirements, repository authorization, snapshot binding or final certification checks merely to make a workflow succeed.

The frontend may request an action; the backend must enforce whether the action is permitted.

### Rule 4 — Never fabricate a passing result

Missing browser tools, unavailable services, failed verification, missing evidence or unavailable approvals must be reported accurately.

`BLOCKED` means the requirement could not be verified or executed. It must not be converted to `PASS` by a test assertion, a fallback UI state or an agent summary.

### Rule 5 — Protect data and repository state

- Verify the effective database target before write-capable integration tests.
- Never use production data for integration-test writes.
- Do not expose credentials or secrets.
- Do not push, merge, reset, rewrite history or discard changes without explicit authorization.
- Do not introduce GitHub Actions, Docker, or a new database without separate approval.

### Rule 6 — Update existing documentation

Agents must search the existing canonical documentation and append or revise the appropriate section. A new document is acceptable only when no existing document is an appropriate home.

Agents must remove or correct stale claims where appropriate, without erasing useful historical evidence or rewriting history.

### Rule 7 — Report partial completion honestly

An agent must report `COMPLETE`, `PARTIAL`, `BLOCKED`, or `NOT STARTED` for its assigned work. If a task depends on another agent, it must identify the dependency rather than inventing a successful result.

## B. Assign explicit responsibilities

| Agent                | Primary responsibility                                                              | Must not do                                             |
| -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Backend/API agent    | Canonical API routes, schemas, workflow rules, authorization and evidence behavior  | Invent a second workflow authority                      |
| Frontend agent       | API client, UI integration, workflow state and evidence display                     | Replace missing backend results with fake success data  |
| E2E agent            | Real workflow execution, verification runners and evidence capture                  | Treat stubs or `BLOCKED` as a release PASS              |
| Runtime/I2 agent     | Registry, schema, component, Composer integration and compatibility tests           | Bypass shared renderer/theme/brand constraints          |
| Verification lead    | Baseline, test execution, raw results, commit identity and integration coordination | Accept summaries without supporting evidence            |
| Independent reviewer | Review the final diff, verify claims and decide whether release gates pass          | Approve solely on the basis of agent self-certification |

One person or agent can cover multiple roles in a small project, but implementation and final independent review should remain separate responsibilities whenever possible.

## C. Require a standard report from every agent

Each agent should return:

1. Assigned requirement and intended outcome.
2. Existing files inspected.
3. Files changed and reason for each change.
4. Tests executed, with exact commands.
5. Actual pass/fail/skip/blocked counts and exit codes.
6. Raw evidence locations and the commit SHA tested.
7. Unresolved issues, risks and dependencies.
8. Documentation updated.
9. Final status and a clear explanation of why that status is justified.

This report is the handoff to the integration owner; it is not a substitute for independent verification.

# Part 4 — What counts as proof of completion?

This is the most important control in the entire process. Your Project AI model needs a consistent standard for deciding whether a task is actually complete.

A requirement is not complete just because an agent says it is complete, the code compiles, or a test returns a green result. Completion requires evidence that proves the specific requirement was implemented and behaves correctly.

## A. Use four distinct evidence levels

Level 1 — Implementation evidence

The relevant source code, schema, API route or UI integration exists. The reviewer confirms that the implementation is in the correct location and follows the canonical architecture.

Proves: the code exists. Does not prove: it works end to end.

Level 2 — Focused test evidence

Relevant unit and contract tests exercise the changed behavior, including invalid inputs and failure paths.

Proves: the tested behavior works under the tested conditions. Does not prove: the complete application works.

Level 3 — Integration and E2E evidence

The actual application and services communicate correctly. Real workflow operations, authorization, approvals and required verification runners execute.

Proves: the integrated path works for the scenarios actually exercised.

Level 4 — Independent acceptance evidence

A separate reviewer checks the source, test results, target commit, security boundaries and required evidence. The reviewer records whether the acceptance criteria have been met.

Proves: the completion claim has been independently checked against the defined acceptance criteria.

The levels are cumulative where applicable. A successful unit test cannot replace an E2E test when the requirement specifically demands E2E verification.

## B. Define acceptance criteria before implementation

Every task should have explicit acceptance criteria. For example:

| Requirement       | Minimum acceptable proof                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| API integration   | Actual route and payload contract verified; success and failure responses tested                   |
| Workflow creation | Backend creates the workflow and returns its authoritative ID and state                            |
| Approval gate     | Unauthorized or unapproved operations are rejected by the backend                                  |
| Evidence display  | UI displays actual server-returned evidence and correctly represents missing or failed evidence    |
| I2 support        | Registry discovery, Composer data flow, rendering and relevant runtime tests pass                  |
| Golden E2E        | Real required stages execute, evidence is recorded, and the test requires a genuine `PASS`         |
| Release readiness | All mandatory gates pass on the identified release candidate, with independently reviewed evidence |

These are proposed acceptance criteria derived from the audit's identified gaps; the team should also preserve any additional criteria in the canonical requirements.

## C. Keep an evidence record for every verification run

For each test or E2E run, record:

- Run ID: a unique identifier for the verification execution.
- Target: branch and exact commit SHA.
- Environment: relevant runtime versions and test configuration, excluding secrets.
- Command: exact command or execution procedure.
- Outcome: `PASS`, `FAIL`, `BLOCKED`, or `SKIPPED`.
- Raw output: the actual test or execution output.
- Exit code: the process result.
- Evidence references: logs, artifacts, browser results and related test reports.
- Timestamp: when the verification was performed.
- Reviewer: who independently checked the result, if applicable.

The evidence must identify the code that was tested. If the source changes after the test, the prior result must not automatically be reused as proof for the new revision.

## D. Distinguish implementation status from verification status

Use these definitions consistently.

| Status        | Meaning                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `COMPLETE`    | The defined implementation and acceptance criteria are satisfied, with the required evidence.                            |
| `PARTIAL`     | Some functionality exists, but at least one required part or proof is missing.                                           |
| `BLOCKED`     | Progress or verification is prevented by an identified dependency, environment issue, missing approval or other blocker. |
| `NOT STARTED` | Work has not yet begun.                                                                                                  |

Also record the test outcome separately. A test can be `BLOCKED` even though some implementation exists. Conversely, code can be present while the requirement remains `PARTIAL`.

Do not let a test result determine implementation status automatically. The reviewer must evaluate both the source changes and the evidence.

## E. Example: what a valid completion report looks like

## Example: frontend API integration

Requirement

COMPLETE

All required Project LLM frontend operations use the agreed FastAPI contract.

Implementation evidence

- API client updated to match actual route and schema definitions.
- Workflow pages consume server responses rather than fabricated state.
- Error and loading states implemented.

Verification evidence

- Contract tests: all required cases passed.
- Integration tests: all required cases passed.
- Browser workflow: successful and blocked scenarios exercised.
- Exact tested commit SHA and raw outputs recorded.

Independent review

- Route/payload matching confirmed against the backend.
- No critical authorization or state-management gaps found.
- Evidence belongs to the reviewed commit.

Illustrative example only. This is not a report of tests that have actually been run.

By contrast, the statement “frontend API integration completed; tests passed” without commands, outputs, commit identity or evidence is an unverified completion claim.

# Part 5 — Your overall Project LLM operating model

These four principles should govern the whole implementation:

One canonical source of truth

The backend owns workflow state, approvals and certification. The API contract connects backend and frontend. The registry defines supported runtime versions. Canonical documentation records the requirements and decisions.

Agents implement; the integration owner coordinates

Each agent has a bounded task and clear acceptance criteria. The integration owner resolves shared-interface decisions and coordinates the order of work. An independent reviewer checks the resulting evidence.

Documentation and evidence evolve with the code

Update existing canonical documents, preserve useful historical records, and attach reproducible evidence to the correct revision. Do not generate a new report for every agent when a canonical report can be updated.

Certification is a gated decision

The model may coordinate tasks and report results, but it must not bypass required human approvals or certify a candidate without the mandatory evidence.

## What I recommend you do first

1. Have the verification lead establish the current baseline at the actual checkout.
2. Have the backend and frontend agents produce one reconciled API contract.
3. Fix the API integration and the simulated E2E release gate before claiming end-to-end readiness.
4. Implement I2 through the canonical runtime architecture.
5. Run independent verification and record the results against the exact tested commit.

Do not push or merge anything merely because this plan is approved. First establish the current repository state, implement the agreed changes, and verify them.

The final decision should be evidence-based: Project LLM is release-ready only when the required implementation, integration, verification, and approval gates have actually passed.

 

# Part 1 — Understand the complete user experience

The key is to separate the people who build and approve tutorial blocks from the people who create and consume tutorials.

Project LLM should make it possible for authorized admins and engineering teams to produce certified tutorial blocks safely. Tutorial Composer should then consume the supported blocks to assemble tutorial pages. Learners should see the finished tutorial experience, not the engineering workflow.

The architecture described in your existing project material also establishes an important boundary: individual blocks expose their identity and content, while shared page/runtime layers own learning telemetry, navigation and reading progress.&#x20;

Branch · Explain I2 Creation Files.txt



## 1. The three user-facing experiences

[AI Automation Workflow Dashboard - Library Page by Pickolab Studio on Dribbble](https://images.openai.com/static-rsc-4/N_Ofyr63E839RV4fN66iuf27z6I-Cj00YmH3_LklpIqgWtGLzabXpZR_YDdQITS-Y4HsTTr4TwSsVInVLXjHDCVvG_nvEeG9HTniyIWuuCisf1QDd6LopcC_3Jgb91g6UDqrT_x0bDOmcr3_FWLe4Lv3iIGu4aNo7ATPJBIftic?purpose=inline)

A. Project LLM — engineering and certification interface

Users: authorized SHC-admin/team engineers and approvers.

They discover a target block, define requirements, submit a candidate implementation, review comparison and verification evidence, approve changes when authorized, and certify only when the required gates pass.

[Rise 360: Modify and Manage Blocks](https://images.openai.com/static-rsc-4/2rFCUDryqWpXK1gvPuWG5kYj20gcEfQcRO8g6g_PWsAAytdQwjg00iv4fkhwQU4mvcUwbzVt8Xfz7W3j2M_FhqqEbpZQjNRuCmlype3B-xBTVS97tIprKaVc7HUxIXrYLjZjYSe5UcBm5Gm80Z6V-1LnqwZoxzJJ1fxuzi0DDD4?purpose=inline)

B. Tutorial Composer — tutorial authoring interface

Users: authorized tutorial authors and administrators.

They select supported certified blocks, arrange content, configure the tutorial and brand, preview the result, validate the document, and publish using the existing publishing workflow.

[Trenning – Learner Platform: Training Access & Issue Reporting by Bagus Fikri for Fikri Studio on Dribbble](https://images.openai.com/static-rsc-4/r9uwlh19XXTos7NiXwkTIQzUtHmQKnmWoxEen9cyqkydqC5y-J3Xr3Rm5_dqBkE929fsPs5RqudlJSpNMqZLaQEpzEl9p2RlDHdkUbGn1cu1DJtIGvet0asmugJwxRS4wsnDa2Yv7VfAP7Cu2tf361R57SaqLvoNefM_-X5o98k?purpose=inline)

C. Tutorial Page — learner interface

Users: learners consuming a published tutorial.

They open a tutorial, navigate between its sections or lessons, read and interact with the content, and receive the page-level reading/progress experience supported by the existing runtime.

These images illustrate the three experiences; they are not screenshots of the current repository implementation.

Important: Project LLM should not replace Tutorial Composer, and Tutorial Composer should not replace the learner-facing Tutorial Page. Each is responsible for a different stage of the lifecycle.

# Part 2 — The complete journey, from block engineering to learner

1\. Engineer uses Project LLM

Discover target → define contract → submit candidate

2\. Backend verifies and governs

Compare → request approval → execute safely → verify

3\. Authorized human approves certification

Only if mandatory gates and evidence are satisfied

4\. Tutorial Composer uses supported blocks

Select → arrange → configure → preview → validate → publish

5\. Learner opens the Tutorial Page

Render content → navigate → observe runtime → show page progress

The certified-block-to-Composer handoff is a target operating model. The exact publication mechanism, storage schema, routes and user permissions must be verified against the current repository before implementation is finalized.

# Part 3 — Project LLM UI: what an authorized engineer will actually do

The following is the proposed complete UI experience once the integration work is finished. It is a target design, not a statement that every screen or API currently exists.

## Screen 1: Project LLM workspace

# Project LLM

Engineering workspace

Engineering

Active workflows

# Live API

Not a hard-coded count

Awaiting approval

# Live API

Based on actual workflow states

### Workspace actions

Discover a target

Find the intended family, version and repository implementation.

Create an engineering workflow

Start a backend-owned workflow for a selected target.

Review existing workflows

Inspect actual states, pending approvals and evidence.

Illustrative layout; live data and available actions depend on backend permissions and implemented endpoints.

### What the backend must do

- Authenticate the user and authorize workspace access.
- Return real repository/target discovery results, rather than a static corpus.
- Create a workflow and return its canonical identifier.
- Return the current workflow list, state, timestamps and outstanding actions.
- Enforce role and state restrictions on every mutation.

The audit specifically identifies static repository intelligence and local presentation state as gaps that need real backend integration.&#x20;

Pasted text(20261005-071136).txt



## Screen 2: Select the target block

The engineer chooses a block family and version, for example `Introduction / I2`, when I2 becomes supported. The interface should show the discovered target, existing implementation paths, relevant dependencies, the selected source snapshot, and any unsupported or unresolved requirements.

The engineer should not be asked to manually guess repository paths if the discovery service can supply them.

Backend support:

1. Discover the canonical family/version and repository target.
2. Bind the selected target to the workflow.
3. Record the source snapshot or commit identity.
4. Generate a contract based on repository evidence and canonical requirements.
5. Refuse to proceed if the target cannot be identified safely.

For I2 specifically, the current audit says the implementation is pending. Therefore, the UI must not represent I2 as available for certification merely because it appears in a dropdown or type definition.&#x20;

Pasted markdown.md



## Screen 3: Review the engineering contract

Before producing or accepting a candidate, the engineer should see a human-readable contract covering:

- Target family, version and canonical identity.
- Required files and component responsibilities.
- Runtime, renderer and Composer integration.
- UBRC identity requirements.
- ILS, RSSB and LSNB boundaries.
- Theme and brand constraints.
- Required tests and browser verification.
- Prohibited changes and human approval gates.

The contract should be sealed or otherwise made immutable according to the existing backend contract mechanism. If the selected target or source snapshot changes, the system should make it clear that the contract and evidence may need to be regenerated.

Backend support: the contract-generation endpoint should return the actual contract bound to the selected workflow. The UI must not generate its own independent version of the requirements and treat it as authoritative.

## Screen 4: Submit and compare a candidate

The engineer uploads or submits the candidate package. The UI shows the real validation result, file/hash checks, manifest status, target match, comparison results and any missing requirements.

The interface should distinguish:

- Valid: the package passed the applicable validation checks.
- Revision required: a specific correction is needed.
- Blocked: a prerequisite or required verification could not be completed.
- Rejected: the applicable policy or validation gate rejected the candidate.
- Ready for approval: the required pre-approval checks passed.

These labels must map to the actual canonical backend states rather than becoming a second frontend-only state machine.

Backend support: candidate intake, manifest validation, target binding, comparison, evidence storage and explicit error responses.

## Screen 5: Review changes and approve implementation

The engineer or authorized reviewer sees the proposed repository changes, the affected files, the source snapshot, the comparison report and the risks.

The reviewer must explicitly approve the exact intended implementation before the executor can mutate the repository. Approval should be bound to the correct workflow, target and candidate, rather than being a generic checkbox.

Backend support: authorization checks, approval persistence, approval-to-candidate binding and safe execution in an isolated worktree.

The UI should disable or reject an action if the user lacks permission or the workflow is in an invalid state. A hidden button alone is not an authorization mechanism.

## Screen 6: Watch verification and certification

The engineer sees the actual stage-by-stage results:

- Build and type checks.
- Focused unit and contract tests.
- Relevant integration tests.
- Runtime and renderer verification.
- Theme and brand checks.
- Browser verification.
- Required evidence and outstanding blockers.

Each stage should expose its real outcome and relevant evidence. A missing browser runner must appear as blocked or unavailable, not as a fabricated PASS.

Once every mandatory gate has passed, the authorized reviewer can perform the final approval if required. The backend then records the certification decision and the exact candidate/revision to which it applies.

Backend support: workflow transitions, execution records, evidence ledger, final gate evaluation, authorization and certification persistence.

The audit identifies this final evidence gate as only partially complete and calls for a real E2E run rather than a simulated golden workflow.&#x20;

Pasted markdown.md



# Part 4 — Tutorial Composer: how certified blocks become a tutorial

Tutorial Composer is a downstream authoring experience. It should not need to know the internal Project LLM correction loops, agent execution details or engineering approval process to use a certified block.

## Screen 1: Create or edit a tutorial

The author opens Composer, selects a tutorial or creates one, chooses the applicable theme/brand, and adds supported blocks to the content outline.

The block picker should only offer versions that the platform considers supported and available under its current certification/publication policy.

## Screen 2: Select and configure blocks

The author adds supported blocks, edits their permitted content, and arranges them in the intended order. Composer validates the authoring data against each block's schema.

For each block, Composer should be able to resolve:

- Canonical block type and version.
- Required authoring data.
- Component/renderer mapping.
- Runtime identity.
- Theme and brand inputs.
- Any applicable content validation requirements.

The source material emphasizes that a version must have a real implementation, explicit identity, schema, registry entry, renderer routing, Composer integration and tests.&#x20;

Branch · Explain I2 Creation Files.txt



## Screen 3: Preview the actual Tutorial Page

Composer should render a preview through the same canonical renderer and page shell used by the learner-facing page. It should not maintain a separate preview implementation that behaves differently from the published runtime.

The preview should verify:

- The selected block renders through the intended component.
- Its identity is present in the DOM.
- Theme and brand configuration are applied correctly.
- Page-level navigation and progress do not get duplicated inside individual blocks.
- Invalid data or unsupported versions are reported clearly.

## Screen 4: Validate and publish

Before publication, Composer validates the tutorial document and checks that its block versions are resolvable by the runtime.

The publishing process should preserve the canonical document structure and apply the platform's existing authorization and publication rules. The exact save/publish APIs and storage model need to be confirmed from the repository; they should not be invented as part of Project LLM.

Result: once a supported block is certified and made available to Composer, an author can use it as a normal building block in a tutorial without repeating the engineering certification workflow.

# Part 5 — The learner's Tutorial Page: UBRC, ILS, RSSB and LSNB

This is where the different runtime responsibilities become visible to the learner. The learner should experience one coherent page; the systems below should work together behind that experience.

## 1. What each system owns

UBRC — block identity and runtime contract

The available project material specifies that a block exposes `data-block-id`, `data-block-type`, and `data-block-version`. These attributes let the runtime identify which block instance and version are rendered.

Learner experience: usually invisible. The page renders the intended block, and the platform can associate runtime observations with the correct block.

Boundary: UBRC identity must follow the canonical contract. A block must not invent a competing identity mechanism.

ILS — shared learning runtime

The project material describes blocks participating passively in ILS through their runtime identity and the shared runtime context/provider.

Learner experience: the tutorial behaves as part of the platform's learning experience, while the runtime can observe the relevant blocks.

Boundary: individual blocks must not create a second ILS system, own global learning state, implement telemetry transport or duplicate learning-progress calculations.

LSNB — page-level lesson navigation

The project material assigns lesson navigation to the page-level tutorial shell rather than individual blocks.

Learner experience: navigation between the applicable lessons or sections is provided consistently by the page.

Boundary: an individual content block must not add duplicate page-level Previous/Next controls, lesson navigation or a competing navigation state.

RSSB — page-level reading/progress experience

The project material assigns reading and lesson progress responsibilities to the page/runtime layer.

Learner experience: any supported reading-progress indicator or completion information is managed consistently by the shared page experience.

Boundary: individual blocks must not independently implement page-level reading progress, lesson progress or completion percentage.

The source material supports these architectural boundaries, but it does not fully specify the exact RSSB/ILS event schemas, persistence behavior or UI design. Those details must be confirmed from the canonical implementation before the agents build them.&#x20;

Branch · Explain I2 Creation Files.txt



## 2. What the learner sees

EXAMPLE TUTORIAL PAGE

# Introduction to the topic

Lesson 1 of the tutorial

Reading progress

Page/runtime supplied

Introduction · I1/I2 when supported

## The learning content

This area renders the selected, schema-valid tutorial block using the canonical renderer and the configured theme.

The actual content and controls depend on the selected block implementation.

Previous

LSNB: page-level navigation

Next

Illustrative wireframe only. It is not a screenshot or confirmation of current UI behavior. The progress display must use real runtime data; the example percentage is not an actual measurement.

The intended experience is straightforward:

1. The learner opens a published tutorial.
2. The page loads the canonical tutorial document and the correct theme/brand configuration.
3. The page shell renders each supported block through the canonical registry and renderer.
4. UBRC identity makes each block instance/version identifiable.
5. The shared ILS runtime can observe blocks according to the implemented contract.
6. LSNB provides page-level navigation.
7. RSSB provides the supported page-level reading/progress experience.
8. The page preserves these boundaries across supported blocks and versions.

The learner should not need to understand UBRC, ILS, RSSB or LSNB to use the page.

## 3. What backend support does the Tutorial Page need?

The learner page is not simply a React component. It depends on the correct tutorial document, renderer mapping, configuration and any server-backed runtime capabilities.

| Capability             | Backend/platform responsibility                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tutorial retrieval     | Return the correct published tutorial document and its supported block data.                                              |
| Version resolution     | Ensure every block type/version resolves to a supported implementation.                                                   |
| Theme and brand        | Supply the appropriate configuration through the canonical mechanism rather than hard-coded branding inside blocks.       |
| UBRC identity          | Ensure document data contains the identity needed by the renderer; the renderer exposes the required DOM attributes.      |
| ILS                    | Provide the shared runtime integration and any required persistence or telemetry services defined by the actual contract. |
| LSNB                   | Supply the applicable lesson/section structure if navigation depends on server-managed tutorial structure.                |
| RSSB                   | Supply or persist reading/progress data if the existing implementation requires server-backed state.                      |
| Publication and access | Enforce the platform's existing rules for which tutorial a learner can access.                                            |

The precise endpoint names and which of these capabilities already have backend persistence must be established from the repository. The architecture should reuse existing platform services rather than introducing a second telemetry or navigation backend.

# Part 6 — UBA remains on hold

I understand that UBA is explicitly out of scope for now.

That means the Priority 1–5 implementation should not depend on UBA being available. It should not block the Project LLM workflow, certified-block handoff, Tutorial Composer, or the existing Tutorial Page experience.

For the current scope:

- Keep UBA out of required workflow stages and release acceptance criteria.
- Do not invent UBA endpoints, database tables, state transitions or UI screens.
- Do not create a placeholder UBA integration that reports success.
- Preserve existing interfaces that might later support UBA, but only where those interfaces already exist and are justified.
- Document UBA as deferred in the existing canonical requirements or scope document, rather than creating another duplicate document.

When UBA is resumed, its actual requirements and integration contract can be agreed separately. Until then, the existing supported runtime and learning-page behavior must work independently of it.

# Part 7 — The end-to-end acceptance scenario

The strongest test of the finished system is a single traceable journey across the three experiences.

1\. Engineering

An authorized engineer creates a workflow, selects a discovered target, reviews its contract, submits a candidate and obtains the required approvals. The backend records actual verification evidence.

2\. Certification

The backend certifies the candidate only after all mandatory gates pass. A failed or blocked mandatory gate prevents a successful certification outcome.

3\. Composer

An author can discover and select the supported certified version, construct a valid tutorial document, and preview it through the actual renderer and page shell.

4\. Learner page

An authorized learner opens the published tutorial. The selected block renders with its UBRC identity, participates in the shared ILS runtime, and uses the page-level LSNB and RSSB responsibilities without duplicating them inside the block.

5\. Independent verification

The evidence ties the engineering run, certified candidate, tutorial document, runtime verification and tested revision together. Any unsupported version, missing required evidence or failed mandatory check is reported honestly.

## My recommendation

Treat the finished product as three connected but separately owned user experiences:

- Project LLM: engineer, verify, approve and certify blocks.
- Tutorial Composer: select supported blocks and construct/publish tutorials.
- Tutorial Page: render the published tutorial for learners using UBRC identity, ILS runtime integration, LSNB navigation and RSSB page-level progress.

Complete the actual API and evidence wiring first, then verify the certified-block-to-Composer handoff and the real learner rendering path. Keep UBA deferred, and do not mark I2 as supported until it passes that same end-to-end path.

That gives you a clear acceptance target: the engineer can certify a real block, the author can use it in a real tutorial, and the learner can consume that tutorial through the existing runtime without duplicate responsibilities or fabricated success states.

 

# Project LLM implementation plan: one GUI page at a time

My recommendation is to implement Project LLM as a sequence of small, fully integrated vertical slices. Each slice delivers one usable page or capability across the frontend, API, backend, persistence, authorization and tests before the team moves to the next page.

We will not ask multiple agents to independently build the entire application. That would risk conflicting API contracts, duplicate state machines, inconsistent documentation and tests that pass without exercising the real application.

The first deliverable will be the Project LLM Workspace page. It will be the foundation for the workflow creation, candidate submission, approvals, verification evidence and certification pages that follow.

The implementation guide you supplied establishes the five main priorities: truthful release evidence, frontend/backend API alignment, a server-driven UI, end-to-end I2 support and independent verification.&#x20;

Pasted text.txt



## 1. The development strategy

## Page 1 — Project LLM Workspace

Start here

Live workflow list, create-workflow action, loading/error/empty states and backend connection.

Page 2 — Workflow details and engineering contract

Target discovery, source revision, requirements, contract review and workflow identity.

Page 3 — Candidate intake and comparison

Upload/submit candidate, manifest validation, file comparison and revision feedback.

Page 4 — Approvals and placement

Human approval, permission checks, candidate binding and isolated execution.

Page 5 — Verification and evidence

Actual test runs, stage outcomes, logs, browser evidence and blocked reasons.

Page 6 — Final approval and certification

Required gate evaluation, final human decision and certification record.

Runtime integration track — I2

In parallel only after shared interfaces are coordinated: schema, canonical registry, renderer, Composer data path and end-to-end verification.

These are proposed implementation slices, not a claim that six separate pages or all their APIs already exist. We should reuse existing pages and routes where appropriate.

Critical rule: do not start Page 2 until Page 1's API contract and integration tests are accepted. Do not start Page 3 until its dependency on workflow creation and workflow detail is stable. Shared interfaces must be agreed before agents implement against them.

# 2. The multi-agent team and its responsibilities

Use six logical roles. Some may be performed by the same agent, but the integration owner and independent reviewer should remain separate whenever practical.

| Agent                    | Responsibility                                                         | Must not do                                           |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| A — Verification lead    | Baseline, branch/SHA, test commands, evidence and final reconciliation | Accept unverified summaries                           |
| B — Backend/API          | FastAPI routes, models, state rules, authorization and persistence     | Invent a second workflow state machine                |
| C — Frontend/UI          | React page, API client, loading/error states and interactions          | Fabricate workflow data or success states             |
| D — Integration/test     | Contract tests, API integration tests and browser E2E                  | Count `BLOCKED` as a successful release               |
| E — Runtime/I2           | Canonical registry, I2 schema, component, Composer and renderer tests  | Bypass shared runtime or theme/brand rules            |
| F — Independent reviewer | Review diff, evidence, assertions, security and acceptance criteria    | Approve solely from the implementation agent's report |

## Which work runs sequentially and which runs in parallel?

Sequential gates

These must be completed in order.

1. A establishes the repository baseline.
2. B inventories real backend routes and schemas; C inventories existing frontend calls.
3. A reconciles the API contract with B and C.
4. B implements the agreed backend capability.
5. C integrates the page against that capability.
6. D verifies the integrated vertical slice.
7. F independently reviews the evidence.
8. A accepts the slice or returns it for correction.

Parallel work

Allowed when files and contracts are not being changed independently.

- B inventories routes while C inventories frontend calls.
- A reviews existing requirements and documentation while B/C perform their read-only inventory.
- D prepares test scenarios while B/C implement, provided the agreed API contract is frozen.
- E can inspect and plan I2 while Page 1 is developed, but must coordinate shared registry/renderer changes.
- F can prepare review criteria in advance, but final acceptance happens after integration.

An agent can perform multiple roles, but parallel agents must not independently edit the same API contract, state machine, registry or evidence schema. One designated owner resolves changes to each shared interface.

# 3. Page 1: Project LLM Workspace

## 3.1 Define the page's first release

The first page should do only four things:

1. Load the real workflow list from the backend.
2. Show the authoritative workflow ID, state, target and last-updated information that the API actually provides.
3. Start a workflow through a real backend operation.
4. Open a selected workflow's detail page using its server-generated ID.

Do not implement candidate uploads, approval screens, evidence viewers, certification buttons or I2 support as fake controls on Page 1. Those belong to later slices.

### Page 1 acceptance criteria

- The workflow list comes from the actual FastAPI service.
- The Create action creates a real workflow.
- The server, not React or local storage, generates the workflow ID and initial state.
- Refreshing the page restores the same server-side workflows.
- Loading, empty, error and blocked states are represented honestly.
- Unauthorized users cannot access or mutate protected workflows.
- No mock workflow records are used in the integrated production page.
- Focused frontend and backend tests pass.
- The browser test exercises the actual running application and API.
- Raw test outputs and the tested commit SHA are recorded.

## 3.2 Inspect the existing implementation before coding

The uploaded audit identifies these starting points. The agents must confirm that they still exist at the target revision before editing them.

Frontend API client

`apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`

Inventory existing methods, authentication, base URL, request formats and error handling.

Project LLM admin pages

`apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/`

Find the existing workspace route, components, query/state patterns and tests.

FastAPI workflow routes

`services/project-ai/app/api/routes/workflows.py`

Verify the registered route, models, authentication dependencies, workflow state and response format.

Canonical workflow

`services/project-ai/app/orchestration/canonical_workflow.py`

Confirm the authoritative initial state and legal transitions.

These paths come from the supplied audit; they are not independently verified against the current checkout in this response.&#x20;

Pasted text.txt



Start with a read-only baseline from the repository root:

```
git branch --show-current
git log -1 --format="%H%n%s"
git status --short
git diff --check

git ls-files "apps/skillhubcore-admin/src/lib/project-llm/*"
git ls-files "services/project-ai/app/api/routes/*"
```

Save the output before making any changes. If the working tree contains user changes, preserve them. Do not reset or clean it to create a convenient baseline.

# 4. Agree on the API contract before implementation

The frontend must not guess the backend route or payload. The backend agent should first inspect the actual registered FastAPI routes and Pydantic models. The frontend agent should inventory every existing client call and compare it with those definitions.

For Page 1, the contract needs two operations:

- List workflows.
- Create a workflow.

Workflow detail retrieval can be included if the existing backend already exposes it and Page 1 needs it for navigation. Do not invent endpoints just to match a proposed design.

## Example contract — illustrative, not the verified current API

The final contract may resemble the following, but the route names, fields and status codes must be reconciled with the repository.

GET

Workflow collection

Returns workflows visible to the authenticated user.

Response fields may include `id`, `state`, `target`, `created_at` and `updated_at`.

POST

Create workflow

Accepts the required target and request metadata.

Returns the persisted workflow, including its server-generated ID and canonical initial state.

The contract also needs to define authentication, role checks, validation failures, unavailable resources, invalid state transitions and how error responses are represented. The real registered API—not this example—is authoritative.

## 4.1 Backend code pattern

If the existing route already provides these capabilities, reuse and test it rather than creating another route. If a capability is missing, implement it using the existing service and persistence layers.

A simplified FastAPI pattern is:

```
from fastapi import APIRouter, Depends, HTTPException, statusrouter = APIRouter(prefix="/workflows", tags=["workflows"])@router.get("")async def list_workflows(    current_user=Depends(require_authenticated_user),    service=Depends(get_workflow_service),):    return await service.list_visible_to(current_user)@router.post("", status_code=status.HTTP_201_CREATED)async def create_workflow(    request: CreateWorkflowRequest,    current_user=Depends(require_authenticated_user),    service=Depends(get_workflow_service),):    if not await service.can_create(current_user, request):        raise HTTPException(            status_code=status.HTTP_403_FORBIDDEN,            detail="Not permitted to create this workflow",        )    workflow = await service.create(        request=request,        actor=current_user,    )    return workflow
```

This is a structural example, not drop-in code. Names such as `require_authenticated_user`, `get_workflow_service`, `CreateWorkflowRequest`, `list_visible_to` and `can_create` must be mapped to the actual codebase. Do not add parallel service abstractions if equivalent canonical services already exist.

Backend requirements:

- The initial state comes from the canonical workflow rules.
- The ID is generated and persisted by the backend.
- Authentication and authorization are enforced on every protected operation.
- Request validation is explicit.
- Persistence completes before the API reports successful creation.
- A failed write does not return a fabricated successful workflow.
- The route's OpenAPI schema and tests agree with the real behavior.

## 4.2 Frontend API client pattern

Keep API calls in the existing `projectLlmClient.ts` rather than embedding raw `fetch()` calls throughout the page.

```
export interface WorkflowSummary {
  id: string;
  state: string;
  target?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkflowRequest {
  target: string;
}

export const projectLlmClient = {
  async listWorkflows(): Promise<WorkflowSummary[]> {
    // Use the existing authenticated API transport.
    // Map the actual response envelope defined by FastAPI.
    return existingTransport.get(/* verified route */);
  },

  async createWorkflow(
    input: CreateWorkflowRequest,
  ): Promise<WorkflowSummary> {
    // Use the actual request schema and route.
    return existingTransport.post(/* verified route */, input);
  },
};
```

This snippet deliberately leaves the transport calls as placeholders: the current route and response envelope have not been verified here. The agent must replace them with the real implementation, not commit the placeholders.

Do not:

- Create a workflow ID in the browser.
- Treat `localStorage` as the workflow database.
- Return an empty list when a request failed, thereby disguising the failure as a valid empty state.
- Translate an unknown server state to `CERTIFIED`.
- Silently retry a non-idempotent creation request in a way that can create duplicate workflows.

## 4.3 React page pattern

The page should derive its displayed data from API responses. The following illustrates the required behavior; integrate it into the existing route and state/query conventions.

```
"use client";

import { useEffect, useState } from "react";
import { projectLlmClient } from
  "@/lib/project-llm/api/projectLlmClient";

export function ProjectLlmWorkspace() {
  const [workflows, setWorkflows] = useState<
    Awaited<ReturnType<typeof projectLlmClient.listWorkflows>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const result = await projectLlmClient.listWorkflows();
      setWorkflows(result);
    } catch {
      setError("Could not load workflows. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);

    try {
      await projectLlmClient.createWorkflow({
        target: "selected-by-user",
      });

      await refresh();
    } catch {
      setError("Workflow creation failed. No success was recorded.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p>Loading workflows…</p>;

  return (
    <main>
      <h1>Project LLM Workspace</h1>

      {error && <p role="alert">{error}</p>}

      <button disabled={creating} onClick={handleCreate}>
        {creating ? "Creating…" : "Create workflow"}
      </button>

      {workflows.length === 0 ? (
        <p>No workflows found.</p>
      ) : (
        <ul>
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <strong>{workflow.id}</strong>
              <span>{workflow.state}</span>
              <button
                onClick={() =>
                  window.location.assign(
                    `/admin/tools/project-llm/${workflow.id}`,
                  )
                }
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

Again, this is a minimal behavior example, not a final page. The implementation agent must confirm the route structure, authentication transport, target-selection UX, actual response model and existing UI component conventions before using it.

For a production-quality page, also handle request cancellation or stale responses, API error details, keyboard accessibility, role-specific actions, and a real target-selection form. The workflow state should be displayed from the server exactly as returned, with an explicit unknown-state fallback rather than a false success state.

# 5. How each agent should work on Page 1

The page should be developed through controlled handoffs rather than six agents all coding at once.

## A

Step A — Verification lead: baseline

Sequential · first

Record the exact commit, branch, working-tree state, existing documentation, current tests and known failures. Identify the canonical docs that will be updated. Do not change implementation code yet.

Exit: the team has a trustworthy baseline and knows which failures existed before its changes.

## B+C

Step B — Backend and frontend inventory

Parallel · read-only

Backend agent inventories routes, request/response models, authorization and workflow persistence. Frontend agent inventories the existing page, API client, authentication transport and local/static data.

Exit: both agents submit an operation-by-operation comparison; neither invents a new API contract.

## A+B+C

Step C — Freeze the Page 1 contract

Sequential gate

Agree on the real list/create operations, authentication, payloads, error handling and workflow states. Update the existing canonical API documentation or schema.

Exit: the contract is verified against registered routes and models and accepted by all three owners.

## B+C

Step D — Implement the vertical slice

Parallel · shared contract frozen

Backend agent implements or repairs the required operations and tests. Frontend agent integrates the client and page against that contract. D can write contract tests and browser scenarios in parallel without editing the implementation files.

Exit: each side passes its focused tests, then the integrated API/UI path is exercised.

## D

Step E — Integration and browser verification

Sequential · after integration

Start the actual application and backend, create a workflow through the UI, verify the server response, refresh the browser, and verify the workflow still exists with the same ID and state. Exercise an API error and an authorization failure.

Exit: raw results prove the integrated behavior, or the unresolved problem is reported as blocked.

## F

Step F — Independent review

Sequential · final gate

Review the diff, assertions, raw outputs, authorization and evidence records. Rerun the critical tests on the exact revision being reviewed.

Exit: accept Page 1, or return specific defects to the relevant agent. Only then start Page 2.

## 5.1 Define ownership of shared files

Before agents start editing, maintain a short ownership table in the existing task/implementation documentation.

| Shared resource                            | Owner                                                          |
| ------------------------------------------ | -------------------------------------------------------------- |
| Workflow route and request/response models | Backend/API agent                                              |
| Canonical workflow states and transitions  | Existing workflow owner; changes reviewed by integration owner |
| `projectLlmClient.ts`                      | Frontend agent                                                 |
| Page 1 route/components                    | Frontend agent                                                 |
| API contract/schema                        | Backend agent authors; integration owner approves              |
| Test evidence format                       | Verification lead                                              |
| Release acceptance criteria                | Verification lead + independent reviewer                       |

If an agent discovers that a shared contract must change, it should propose the change and its compatibility implications first. Other agents should not continue coding against an obsolete contract.

# 6. Testing and evidence: record every real result

You specifically want to upload the work to GitHub so that a later reviewer can inspect the changes and understand what actually happened. The best way to accomplish that is to make the evidence reproducible, revision-specific and easy to navigate.

Do not depend on an agent's final paragraph as the only record.

## 6.1 Use a consistent evidence record

For every test run, record these fields:

| Field           | Required value                                             |
| --------------- | ---------------------------------------------------------- |
| `run_id`        | Unique verification-run ID                                 |
| `commit_sha`    | Exact code revision tested                                 |
| `branch`        | Branch name                                                |
| `started_at`    | Timestamp with timezone                                    |
| `command`       | Exact command executed                                     |
| `exit_code`     | Actual process exit code                                   |
| `outcome`       | `PASS`, `FAIL`, `BLOCKED` or `SKIPPED`                     |
| `summary`       | Passed, failed, skipped and blocked counts where available |
| `raw_output`    | Path to complete output                                    |
| `environment`   | Relevant runtime versions and safe configuration metadata  |
| `review_status` | Pending or independently reviewed                          |

A test run should never inherit a PASS from a previous commit. If code changes after testing, the previous run remains historical evidence; it does not certify the new revision.

## 6.2 Keep evidence in the existing repository structure

First search for the existing canonical verification report and evidence directory. The supplied audit references `.agents/tasks/integration-preflight/` and existing Project LLM evidence, so extend the appropriate existing locations if they are still canonical.

A possible layout, only if no suitable existing structure exists, is:

```
.agents/
  tasks/
    project-llm/
      <existing-canonical-task-or-report>.md
  evidence/
    project-llm/
      page-1-workspace/
        <run-id>/
          manifest.json
          backend-tests.log
          frontend-tests.log
          contract-tests.log
          browser-e2e.log
          browser-artifacts/
```

Do not create another summary Markdown file merely because Page 1 is a new task. Update the canonical task/report and place raw outputs under the existing evidence convention.

Also avoid committing secrets, `.env` files, session cookies, access tokens, personal learner data or unredacted database connection strings. Raw logs should be checked for sensitive values before publication.

## 6.3 Example evidence manifest

This is a proposed format, not the result of a real test run.

```
{
  "run_id": "page1-workspace-<unique-id>",
  "requirement": "project-llm-workspace",
  "commit_sha": "<exact-tested-commit-sha>",
  "branch": "<tested-branch>",
  "outcome": "BLOCKED",
  "started_at": "<ISO-8601 timestamp>",
  "stages": [
    {
      "name": "backend-tests",
      "command": "<actual command>",
      "exit_code": null,
      "outcome": "NOT_RUN",
      "raw_output": "backend-tests.log"
    },
    {
      "name": "frontend-tests",
      "command": "<actual command>",
      "exit_code": null,
      "outcome": "NOT_RUN",
      "raw_output": "frontend-tests.log"
    },
    {
      "name": "browser-e2e",
      "command": "<actual command>",
      "exit_code": null,
      "outcome": "NOT_RUN",
      "raw_output": "browser-e2e.log"
    }
  ],
  "review": {
    "status": "PENDING"
  }
}
```

The values `BLOCKED`, `NOT_RUN` and `null` here are deliberate placeholders for an example manifest. An actual run must replace them with the outcomes and exit codes that were really observed.

A JSON schema or typed validation model should reject invalid outcome values, missing required fields and a claimed PASS with missing mandatory evidence.

## 6.4 Capture real output automatically in PowerShell

Because your working environment is Windows PowerShell, use a small verification helper that writes console output to a log and records the real exit code. Adapt the location to your existing evidence structure.

Save this as a local verification helper or add it to the existing approved test tooling after review:

```
function Invoke-LoggedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(Mandatory = $true)]
        [string]$EvidenceDirectory
    )

    New-Item -ItemType Directory -Force `
        -Path $EvidenceDirectory | Out-Null

    $logPath = Join-Path $EvidenceDirectory "$Name.log"
    $startedAt = (Get-Date).ToString("o")

    # Preserve the exact command in the log.
    "STARTED_AT=$startedAt" | Set-Content $logPath
    "COMMAND=$Command" | Add-Content $logPath

    # Execute the specified command and retain its output.
    & powershell.exe -NoProfile -Command $Command 2>&1 |
        Tee-Object -FilePath $logPath -Append

    $exitCode = $LASTEXITCODE
    $finishedAt = (Get-Date).ToString("o")

    @(
        "FINISHED_AT=$finishedAt"
        "EXIT_CODE=$exitCode"
    ) | Add-Content $logPath

    [pscustomobject]@{
        Name       = $Name
        Command    = $Command
        StartedAt  = $startedAt
        FinishedAt = $finishedAt
        ExitCode   = $exitCode
        Outcome    = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
        LogPath    = $logPath
    }
}
```

Example usage after confirming the actual commands:

```
$evidence = ".agents/evidence/project-llm/page-1-workspace"

$results = @()

$results += Invoke-LoggedCommand `
    -Name "backend-focused" `
    -Command "<verified backend test command>" `
    -EvidenceDirectory $evidence

$results += Invoke-LoggedCommand `
    -Name "frontend-focused" `
    -Command "<verified frontend test command>" `
    -EvidenceDirectory $evidence

$results | ConvertTo-Json -Depth 5 |
    Set-Content (Join-Path $evidence "command-results.json")
```

Important limitations: this is a basic command logger, not a complete release-verification framework. The placeholder commands must be replaced with the real repository commands. Commands that use nested PowerShell quoting, native process pipelines or multiple shell invocations should be tested to ensure their exit codes are captured correctly. It also does not itself prove browser verification, count tests, establish database isolation or bind evidence to a commit. Those controls must be implemented separately.

For the final evidence manifest, record the commit SHA and hash the finalized raw logs. Never use a script's exit code alone to certify the entire release.

## 6.5 Required tests for Page 1

| Test layer           | Scenarios                                                               | Pass condition                                                             |
| -------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Backend unit         | Workflow creation and state rules                                       | Canonical initial state and correct persistence behavior                   |
| Backend API          | List/create, invalid payload, unauthenticated and unauthorized requests | Actual response schemas and status codes match the agreed contract         |
| Frontend unit        | List success, loading, empty list, request failure                      | UI represents the actual result and never fabricates success               |
| Frontend interaction | Create workflow, refresh list, open workflow                            | Server-returned ID and state are used                                      |
| Contract/integration | Frontend client against the real API contract                           | Routes, payloads and response parsing match                                |
| Browser E2E          | Create workflow, refresh, verify ID/state, exercise error path          | Real application and API are used; browser evidence is retained            |
| Security             | Access with insufficient permissions                                    | Backend rejects the operation even if a client calls the endpoint directly |

Run focused tests first. Do not begin by rerunning every repository test, changing unrelated tests or weakening assertions to obtain green output.

Before any write-capable integration tests, verify the effective `DATABASE_URL_TUTORIAL` target is an approved isolated test environment. Do not use `tutorial_prod` for test writes. A rollback, environment variable name or test report is not proof of isolation.&#x20;

Pasted text.txt



## 6.6 Release gate logic

For the eventual golden E2E, a successful release-verification result must require every mandatory stage to pass and the evidence to match the tested revision.

Conceptually:

```
def evaluate_release(stages, required_stages, tested_sha):    if not tested_sha:        return "BLOCKED"    by_name = {stage.name: stage for stage in stages}    for name in required_stages:        stage = by_name.get(name)        if stage is None:            return "BLOCKED"        if stage.outcome == "BLOCKED":            return "BLOCKED"        if stage.outcome != "PASS":            return "FAIL"        if stage.commit_sha != tested_sha:            return "BLOCKED"        if not stage.has_required_evidence:            return "BLOCKED"    return "PASS"
```

This is an illustrative gate algorithm. The actual implementation must use the project's canonical evidence models, required-stage policy and workflow state machine. It must also handle duplicate stage records, invalid outcomes and stale evidence explicitly. A missing required stage must never be treated as passing.

The key distinction is that `BLOCKED` can be a valid workflow result, but it is not a passing release-verification result.

# 7. Page 1 handoff: what every agent must return

Require the same completion report from each agent. The report should be added to the existing canonical task/evidence documentation rather than being scattered across new Markdown files.

### Agent completion record

Use this as a handoff checklist for each agent. Completing this form does not independently verify the claims.

Agent role

Verification lead

Backend/API

Frontend/UI

Integration/E2E

Runtime/I2

Independent reviewer

Implementation status

COMPLETE

PARTIAL

BLOCKED

NOT STARTED

Exact tested commit SHA

Files changed and why

Exact test commands executed

Results and exit codes

Raw evidence location

Unresolved blockers and dependencies

&#x20;Copy handoff report

The integration owner must reconcile these reports with the actual source changes and raw logs. An agent's `COMPLETE` status is a claim to review, not an automatic approval.

# 8. Common implementation directive for all Project AI agents

Give every agent the same governing rules, followed by its specific task. This is the instruction I recommend using for Page 1.

# Project LLM — Page-by-Page Implementation Directive

## Objective

Implement Project LLM one GUI page at a time, with each page integrated against the real frontend, API, backend, persistence and authorization layers before moving to the next page.

The first target is the Project LLM Workspace page: real workflow listing, real workflow creation, server-authoritative state and honest loading/error/empty states.

## Mandatory rules

1. Inspect the current repository, canonical requirements, existing routes, models, components, tests and evidence before editing.
2. Record the baseline branch, full commit SHA, working-tree state and pre-existing test failures.
3. Update existing canonical documentation. Do not create duplicate Markdown files or competing API specifications.
4. Backend routes, models and the canonical workflow define the API and state contract. Frontend code must conform to them.
5. The backend is authoritative for workflow IDs, states, authorization, approvals, verification and certification.
6. Never substitute mock data, local storage, fabricated progress or a successful fallback for missing backend data.
7. Never weaken a meaningful assertion simply to obtain a passing test.
8. Preserve human approvals, snapshot binding, repository authorization and required certification gates.
9. Never run write-capable integration tests against production data. Verify the effective database target first.
10. Do not add GitHub Actions, Docker, a new database or unrelated infrastructure without separate approval.
11. Do not push, merge, reset, rewrite history or discard user changes without explicit authorization.
12. Do not expose credentials, tokens, cookies or sensitive learner data in logs, reports or commits.
13. Treat `BLOCKED`, `FAIL`, `SKIPPED` and `PASS` as distinct outcomes. Missing required evidence must never become a release PASS.
14. Record the exact commit SHA, commands, exit codes, raw outputs and unresolved blockers for every verification run.

## Page 1 scope

- Inventory the existing frontend page and API client.
- Inventory the real FastAPI routes, request/response models and authentication.
- Agree on one verified API contract.
- Implement or repair the workflow-list and workflow-create operations only where needed.
- Integrate the page with real API responses.
- Implement loading, empty, error and permission-denied states.
- Test workflow creation, refresh persistence, server-generated IDs and error behavior.
- Run the actual application and a browser-backed test.
- Update the existing canonical task and evidence records.

Do not implement candidate upload, approval screens, certification controls or I2 as fake Page 1 features.

## Coordination rules

- Verification lead owns baseline and evidence reconciliation.
- Backend agent owns backend route/model implementation.
- Frontend agent owns the API client and Page 1 UI.
- Integration agent owns contract/integration/E2E verification.
- Runtime agent may inspect and plan I2, but must coordinate shared registry and renderer changes.
- Independent reviewer verifies the final source and evidence.

Agents may work in parallel on isolated tasks. Shared contracts must be agreed before implementation depends on them. Final integration and independent acceptance occur sequentially.

## Completion report

Report status as COMPLETE, PARTIAL, BLOCKED or NOT STARTED. Include files changed, commands actually executed, results and exit codes, raw evidence paths, tested commit SHA, documentation updated and unresolved risks.

Do not mark Page 1 complete until the real application uses the real API and the required tests and independent review support the claim. Do not start Page 2 until Page 1 has passed its acceptance gate.

# 9. How the work will be reviewed after it reaches GitHub

Once the changes and evidence are uploaded to the repository, the review should proceed in this order:

1. Verify the revision. Check the commit SHA, branch ancestry, changed files and whether the evidence refers to the same revision.
2. Review the implementation diff. Confirm that the frontend uses real API calls and the backend enforces the intended workflow behavior.
3. Inspect raw test evidence. Check commands, exit codes, test counts and failures—not just the summary report.
4. Reproduce the critical checks. Rerun the relevant backend, frontend and integration tests when the environment permits.
5. Verify the actual UI/API path. Check the browser evidence and confirm that the workflow is persisted and restored by the server.
6. Review safety and documentation. Check authorization, database isolation, secrets, generated artifacts, canonical documentation and unresolved blockers.
7. Record the acceptance decision. Mark the slice COMPLETE only if its defined requirements and evidence are satisfied.

A GitHub commit is useful because it provides a stable source revision and reviewable diff. It does not itself prove that the application works.

I can review the code and evidence when they are available in the repository or uploaded here. I will distinguish what the logs demonstrate from what still requires an independent rerun. No repository changes or pushes have been performed as part of this plan.

## 10. What happens after Page 1?

Use the same vertical-slice process for each page, changing only the page-specific scope.

| Slice      | Main new capability                       | Required proof                                              |
| ---------- | ----------------------------------------- | ----------------------------------------------------------- |
| Page 1     | Workspace and workflow creation           | Real list/create API and refresh persistence                |
| Page 2     | Workflow details and engineering contract | Target/source binding and canonical contract                |
| Page 3     | Candidate intake and comparison           | Real validation, comparison and failure paths               |
| Page 4     | Approval and placement                    | Server-enforced authorization and isolated execution        |
| Page 5     | Verification and evidence                 | Real test runners and revision-bound evidence               |
| Page 6     | Final approval/certification              | Mandatory gate enforcement and persisted decision           |
| Runtime/I2 | Introduction I2                           | Registry discovery, Composer data, renderer and runtime E2E |

I2 can be developed alongside early pages only where it does not conflict with shared interfaces. Its support status must remain truthful until the complete runtime path passes verification. UBRC identity, ILS, RSSB, LSNB and the theme/brand constraints remain part of the runtime acceptance criteria. UBA remains on hold and must not become a dependency of these slices.

## Recommended immediate action

Start with Page 1 — Project LLM Workspace:

- Agent A records the baseline.
- Agents B and C inspect the backend and frontend in parallel.
- Agent A coordinates the verified API contract.
- Agents B and C implement against that contract.
- Agent D verifies the actual integration.
- Agent F independently reviews the evidence.
- Move to Page 2 only after Page 1 is accepted.

This approach produces one working, reviewable capability at a time instead of a large collection of partially connected screens. It also creates the revision-specific test history needed to understand, reproduce and verify the implementation from GitHub.