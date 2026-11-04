# W1–W3 consolidated implementation handoff

Baseline `df81a5c0` on `remediation/w1-2-batch-05-targeted`; working tree was clean at the start of this assignment. Independent Sol review and acceptance remain required. No push, live browser, physical database or deployment was performed. BROWSER-01 and RC-ID-01 remain IN_PROGRESS.

| Task | Disposition and remaining work |
| --- | --- |
| FND01 | PARTIAL: `W1_W3_Terra_Foundation_Register.md` records a source-backed initial slice; full crosswalk enumeration remains outstanding. |
| FND02 | PARTIAL: affected UI controls were run; the full ILS/repository/BFF and retained Sol probe selections remain to be reproduced under this assignment. Historical export tenant failures remain unresolved. |
| FND03 | NOT COMPLETE: signed-subject, projection, private-store, export provenance, admin classification and publication policy need one reviewed decision table and Sol disposition. |
| FND04 | BLOCKED on FND03 tenant/provenance policy; foreign-tenant equal-ID export probes remain failing historically. No speculative runtime correction. |
| FND05 | BLOCKED on FND03 private owner/store authority; four evidence lanes remain separately qualified in Batch 08 handoff. |
| FND06 | BLOCKED on FND03 admin resource classification; accepted previous containment remains in place. |
| FND07 | IMPLEMENTED_UNVERIFIED for J-R1/J-R2 only, commit `995e1f35`, manifest `W1_W3_FND07_Lifecycle_Slice_Manifest.md`; broader continuously mounted auth-owner/cache requirements remain open. |
| FND08 | NOT COMPLETE: real Project LLM actor ingress and persistence need inventory and controls. |
| FND09 | NOT COMPLETE: depends on FND08 and selected approval authority. |
| FND10 | NOT COMPLETE: physical-store and browser scenario prerequisites remain to be consolidated; actual execution NOT EXECUTED. |
| FND11 | NOT COMPLETE: consumer inventory, equal-email ambiguity controls and uniqueness decision remain; migration separate. |
| FND12 | PARTIAL: register identifies report and SkillUp fallback sources, not exhaustive W2 coverage. |
| FND13 | NOT COMPLETE: active SkillUp data callers and truthful replacement require inventory. |
| FND14 | IMPLEMENTED_UNVERIFIED for shared result-report DATA-02 slice only, commit `2d865a14`, manifest `W1_W3_FND14_DATA02_Slice_Manifest.md`; full assessment/result surface coverage remains open. |
| FND15 | NOT COMPLETE: actual SHC operational and governance consumers require evidence. |
| FND16 | NOT COMPLETE: persistence-dependent form/action inventory and controls remain. |
| FND17 | NOT COMPLETE: depends on FND12–FND16 and complete finding coverage. |
| FND18 | NOT COMPLETE: identity contract work depends on W1 authority decisions. |
| FND19 | NOT COMPLETE: taxonomy ingress/egress drift and controls require inventory. |
| FND20 | NOT COMPLETE: assessment contract drift and historical compatibility require inventory. |
| FND21 | NOT COMPLETE: tutorial contract consolidation depends on W1 owner authority and reviewed membership. |
| FND22 | NOT COMPLETE: Project LLM contract consolidation depends on actor and approval authority. |
| FND23 | NOT COMPLETE: analytics contracts require event-specific domain ownership and linked controls. |
| FND24 | NOT COMPLETE: domain-specific caller controls depend on FND18–FND23. |
| FND25 | PARTIAL: mounted report truth and lifecycle adverse controls run; remaining domain invariants and infrastructure-sensitive controls open. |
| FND26 | PARTIAL: affected UI and learner-app typechecks and whitespace checks pass; other package lint/build gates not executed. |
| FND27 | PARTIAL: the two manifests constrain affected callers and scope; per-group compatibility and principle evidence remains. |
| FND28 | NOT COMPLETE: independent re-audit depends on complete finding reconciliation and Sol review. |
| FND29 | NOT COMPLETE: W4 dependency matrix and Sol exceptions remain. No W4 readiness is asserted. |
| FND30 | PARTIAL: this handoff records all task and group dispositions; outstanding deliverables above remain. |

Groups G1 and G3 have narrowly scoped IMPLEMENTED_UNVERIFIED slices and remain IN_PROGRESS. G2 and G4–G9 are NOT COMPLETE; no group is accepted or closed. Existing Batch 08 T/J and historical records remain authoritative for their own scopes; this handoff does not replace them.

## Verification and limitations

FND07: prior Sol lifecycle baseline reproduced one pass and two failures. After `995e1f35`, the lifecycle selection passed six tests, and six combined UI files passed 66 tests; UI typecheck passed. Controls use mounted React/jsdom and isolated transport, not a live browser or authenticated owner transition. Hidden visibility, null/enabled session cutover, cleanup, delayed settlement and StrictMode replay are covered in that bounded selection.

FND14: from repository root with DATABASE/REDIS/UPSTASH/NEON/QSTASH environment keys removed, `node --input-type=module -e "import { startVitest } from 'vitest/node'; import react from '@vitejs/plugin-react'; const v = await startVitest('test', ['src/share-branding/__tests__/exam-summary-truth.test.tsx'], { run: true, config: false, environment: 'jsdom', globals: true }, { plugins: [react()] }); if (!v) process.exit(1); await v.close();"` exited 0: one file, four tests passed. It mounts the shared component with intercepted fetch, exercising zero, missing score, retrieval failure and persisted values; it does not establish live API or browser behavior. `pnpm exec tsc --noEmit` in each of `apps/skillup-web` and `apps/realtutorialhub-web` exited 0. `git diff --check` exited 0 for the slice. Other lint, builds and physical services NOT EXECUTED.

The report slice removes fabricated fallback metrics, distinguishes absent values from measured zero, displays fetch errors and prevents obsolete responses from overwriting current state. Server authority and assessment scoring are unchanged. FND07 starts cutover timing paused when the document is hidden and invalidates deferred visit work on cleanup; it does not establish backend ownership or change BFF forwarding. These two implementations require independent review for correctness and compatibility; acceptance is not claimed.

## Subsequent independent source investigation

`53ff53b9` adds a 91-row working index of the existing crosswalk and active SkillUp truth/caller tracing. It is not an exhaustive verified finding-to-source register. `07ed7f10` traces Project AI generic transition actor input from SHC through the proxy to the Python service, and identifies the assignment's missing authorized backend root. `5cb8fe1f` records the people email constraint, scoped SHC lookup, partial projection writes and a tentative migration recommendation. `81ca85af` records shared question type normalization and aliases; subsequent source inspection finds the admin single and bulk create routes already use enum-bearing `questionSchema`/`bulkQuestionSchema`, so a malformed-write claim requires testing the actual route rather than assuming the shared normalizer is directly exposed. These are read-only evidence, not implemented fixes or completed task acceptance. No additional tests ran for these inventories.
