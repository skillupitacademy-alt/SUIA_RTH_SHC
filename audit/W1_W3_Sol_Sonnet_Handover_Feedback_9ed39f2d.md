# Sol feedback on the Terra to Sonnet continuation

Reviewed 2026-11-05 at committed HEAD 9ed39f2d, with the visible FND16 working edits
reviewed as drafts. The owner has selected Claude Sonnet 4.5 to continue the remaining
work. That handover is authorized. The existing consolidated FND01-FND30 assignment,
all nine group boundaries, engineering principles and independent Sol acceptance still
govern execution. This feedback prioritizes corrections inside that full assignment.

Overall direction is PARTIAL and needs the corrections below before group acceptance.
Completed slices may proceed to independent review while the implementer continues
other authorized tasks. Group closure and W4 readiness remain outstanding.

## Feedback requiring action

### 1. Correct the FND13 HTTP and completion attribution

The placement-http-truth.test.ts file imports getSkillupPlacement and mocks database/
vector adapters. It never calls the authenticated placement HTTP handler. The nine
combined placement/zero tests pass, but they characterize helper behavior, including
rank/readiness fallback and the known zero-to-one clamp. They cannot establish HTTP
authentication, authorization, response status or production truth completion.

Correct the handoff heading and 4dc2dd20 completion language to reflect helper-layer
evidence. Keep fallback/calibration and public response compatibility as unresolved
requirements. Add actual isolated HTTP caller composition only under its declared
manifest, with owner, foreign tenant, missing profile, error and genuine zero cases.
Passing a descriptive test of an existing fabricated match cannot accept that behavior.

### 2. Trace response contracts before changing form success semantics

The draft FND16 inventory assumes HTTP OK cannot confirm login, signup or enquiry
persistence. That general rule is unsupported. Inspect each real server contract first.
For the enquiry PATCH handler, source awaits db.transaction, performs its follow-up insert,
reads updated detail and returns updated:true/detail with HTTP 200. Client success may
rely on that contract after the server behavior and failure handling are tested.

The uncommitted EnquiryEditForm change weakens the success message to persistence unknown
without such evidence, immediately reloads the page and adds no actual timeout. Its
three passing tests assert wording using bare HTTP responses. The test named timeout
injects a fetch TypeError, which establishes transport failure rather than a timer limit.

Revise FND16 to distinguish committed server success, accepted asynchronous work, explicit
rejection and unknown transport outcome according to each endpoint. Inspect response data
where required. Do not add automatic auth retries or alter accepted login/signup flows
from a generic acknowledgement assumption. Restore or replace the draft success semantics
only through source-backed tests. Preserve uncertainty where the transport outcome is
actually unknown.

### 3. Keep the SkillUp-admin runtime scope explicit

The current consolidated assignment permits SkillUp-admin admission/email consumer
inspection and isolated tests. It does not give blanket production editing authority
throughout that app. The draft EnquiryEditForm runtime edit is a different CRM path.
Supply its exact root-cause evidence, manifest and proposed response contract for Sol
disposition before treating it as authorized implementation. Independent in-scope FND16
marketing work may continue. The owner-approved model handover changes the implementer,
with all thirty tasks and existing scope rules continuing to apply.

### 4. Reconcile already completed work before further fixes

Terra's 1e4fde2a had already added StrictMode replay visit handling and 347ebacd had
already keyed the report inner component by examId before handover baseline a239ca39.
Sonnet b5a4e05d changes visit scheduling again, and c16ad550 adds loadedExamId state
inside the component already remounted by its exam key.

The current selected tests pass. The additional report state duplicates the key's
lifecycle and its comment inaccurately says it resets before the asynchronous effect.
It actually runs within the effect. Reconcile the existing fix, retain one readable
identity-reset mechanism and prove retry/cancellation behavior. For the provider, run
the combined suite and deferred transition controls before claiming the changed scheduling
is necessary or completely accepted. Do not redo a submitted correction solely because
the handover narrative still lists its earlier failure.

### 5. Make the evidence portable and accurately qualified

Three referenced files do not exist in the current workspace or tracked tree.

- audit/Claude_Sonnet45_W1_W3_Detailed_Implementation_Handover_a239ca39.md
- audit/W1_W3_FND15_Certificate_Verification_Authority_Manifest.md
- audit/W1_W3_FND15_Project_LLM_Governance_Truth_Manifest.md

Add the actual required pre-edit scope records or correct the references. Do not imply
that a later record existed before a change. The existing consolidated assignment and
Sol review are the available governing documents. Commit intended evidence explicitly
when ignore patterns hide it.

Some certificate controls mock SQL operators and merely assert an operator was called.
For example, the soft-delete case injects an empty result and checks isNull was invoked.
This characterizes query construction and mapper behavior, with no real deleted-row
filtering or physical certificate authority established. Keep those limits in findings.

Review-range git diff --check a239ca39..9ed39f2d fails with trailing whitespace in the
placement helper and integration-certification test files. Correct the final branch-range
check before reporting whitespace clean. A clean working diff alone misses committed
warnings. Current working tree also contains active uncommitted app/tests/configuration
files, so its state must be recorded when submitting the next review checkpoint.

## Independently executed checks

Each interpreted runner removed live DB/cache/queue bindings, used NODE_ENV=test and
installed the existing offline network guard before importing app code. Mounted tests
used config:false, the React plugin and exact app aliases where required. No live
application or physical database was exercised during this review.

| Selection | Result |
| --- | --- |
| Lifecycle file | 8 passed, exit 0 |
| Shared report and Sol report boundary | 10 passed across 2 files, exit 0 |
| Placement helper and zero characterization | 9 passed across 2 files, exit 0 |
| Draft FND16 enquiry form wording tests | 3 passed, exit 0 |

These are separate potentially overlapping selections. Passing the draft wording tests
does not establish the correctness of their assumed server contract. This is a focused
handover check, with broader retained security failures and full group acceptance still
covered by the master register and review workflow.

An additional combined six-file provider run with the package config and absolute offline
guard did not complete or emit a final test summary during the review window. Sol stopped
only that identified review runner and its worker process tree. Its interrupted exit is
not a test result. Reproduce that wider selection with a bounded runner timeout and
diagnose any outstanding timers or deferred transport before claiming a complete provider
regression pass. The eight-test lifecycle result above completed independently.

## Continuation direction

Continue the complete FND01-FND30 assignment. Prioritize confirmed defects and actual
contract consumers, then submit evidence per group. Preserve failing security assertions,
tenant/subject authority and the offline boundary. Record exact dependencies and keep
independent work moving while a policy decision awaits review. Treat source inspection,
mocked adapter tests, actual HTTP composition and physical runtime as their recorded
evidence layers. All nine groups remain open until Sol accepts their declared scope.

Sol added this feedback document only. Existing code and active working edits were
preserved for their implementer. No whole-codebase acceptance is granted by this check.
