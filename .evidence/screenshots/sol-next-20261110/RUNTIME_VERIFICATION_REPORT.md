# SHC Admin — Follow-up Headless Chromium Verification

Completed 11 November 2026 (Asia/Kolkata). This evidence directory was started on 10 November; files ending `verified-20261111` and the three JSON result files are the final follow-up evidence.

Source: local main `5c43cee7d2afe85aeca69ba73b92bd601f65264b`.
Mode: actual headless Chromium through Playwright against local HTTPS services. No application source, canonical acceptance ledger or deployment configuration was edited. No migrations or SQL were executed in this follow-up. No question, tutorial or billing records were written. Login/session operations and browser-local certificate-preview state were exercised normally.

## Decision

**PARTIAL: bounded UI checks passed; feature integration failures prevent complete task-list acceptance.**
These results extend the earlier real Composer/learner campaign in `../sol-uat-20261110-https/RUNTIME_VERIFICATION_REPORT.md`. They do not replace that campaign's progress API failure, cleanup evidence or URL-contract findings.

## Direct results

| Task area | Executed check | Result | Acceptance boundary |
|---|---|---|---|
| Dashboard truthfulness (16) | HTTP 200, rendered SYSTEM BASELINE PREVIEW and seed provenance | PASS | Labelled baseline presentation; no live metrics qualification |
| Users (17) | HTTP 200; user management data currently unavailable | PASS | Truthful unavailable state, not working user-management CRUD |
| Subscriptions (18) | HTTP 200; subscription data currently unavailable | PASS | Truthful unavailable state, not billing implementation |
| Certificate tooling (19) | Generator/preview 200; RTH sample; switch to SUIA using form and open preview | PASS | Both previews visibly SAMPLE — NOT ISSUED and verification unavailable; zero observed mutation requests during brand switch. Issuance/signing/eligibility and downloads not tested |
| Question Bank (21) | Fresh UI login 200; identity API 200, current super_admin; Questions list request 401 Unauthorized | FAIL | Actual integration failure under a fresh authorized session |
| Bulk-delete confirmation | Attempted read-only selection path through Question Bank | BLOCKED | No rows loaded because list API rejected session. No delete request submitted, no question modified |
| Question Factory/Review (22) | Factory 200; review 200 and No Questions Staged | PASS, bounded | Mount/empty-state only; generation, ingestion, duplicate detection, save and idempotency not qualified |
| Project LLM (23–25) | Dashboard 200, specification review 200, workflow details 200 | PASS, bounded | Truthful unavailable evidence and select-workflow states. No real approval, durable workflow or certification claimed |
| Marketing (20/SHCA-F08) | Page 200, no uncaught page exception; five actual requests returned 500 | FAIL for integration | React Query provider no longer crashes; that does not qualify marketing functionality |
| Protected page admission | Four anonymous GETs plus Composer HEAD/RSC/prefetch | PASS, bounded | All seven returned 307 to login with Cache-Control private, no-store; browser ended on login |
| UI regression (38) | Ten named page paths visited with pageerror listeners | PASS for observed mounts | No uncaught page errors observed during those visits. Not a full build, lint, unit-test or all-route regression qualification |
| PostgreSQL locks/concurrency/rollback (31–33) | Not run in this follow-up | NOT VERIFIED | Cannot be certified from screenshots or HTTP mounts |
| Tenant-only delivery (34/37) | Not run in this follow-up | NOT VERIFIED | Earlier campaign qualified shared delivery, not tenant-only publication exclusion |
| Docker lifecycle (39) | Not run | NOT EXECUTED | Remote Neon use does not demonstrate container build/restart/recovery |
| Final traceability (40) | JSON results, screenshots, this report and hashes saved | COMPLETE AS EVIDENCE OUTPUT | No canonical acceptance status promoted |

## New reproducible failures

### 1. Marketing: five failing HTTP endpoints

All returned **HTTP 500** while the Marketing page itself returned 200:

- `/api/marketing/bootstrap/realtutorialhub`
- `/api/marketing/bootstrap/skillupitacademy`
- `/api/marketing/control-plane/realtutorialhub`
- `/api/marketing/control-plane/skillupitacademy`
- `/api/marketing/collector/observability`

The rendered page showed errors rather than the former missing-provider crash. Final screenshot: `marketing-error-state-verified-20261111.png`. Exact response statuses are in `results-verified-20261111-3.json`. Backend cause is not established by this browser run; do not invent a configuration or database diagnosis.

### 2. Questions: authorized administrator cannot load list

Reproduced after a fresh login, not inferred from an old or expired browser session:

1. Actual SHC login POST: 200.
2. Actual `/api/admin/auth/me`: 200, current role `super_admin`.
3. Real Questions-tab request `/api/admin/questions`: **401**, error `Unauthorized`.

The first attempt subsequently returned the browser to login. During that attempt the UI showed no intelligence assets while requests were being rejected; this is not evidence that the database contains zero questions. The fresh reproduction captured the 401 while still on `/questions`.

Screenshot: `question-bank-response-verified-20261111.png`. The exact sanitized reproduction is in JSON result file 3. The failing hop inside the BFF/upstream chain remains to be traced. Preserve existing SHC permissions; do not bypass authentication or broaden roles to hide this failure.

### 3. Pre-hydration login fallback

An early continuation attempt clicked the rendered login form before React hydration completed. The form fell back to native GET and placed test credentials in the URL. Subsequent accepted login evidence explicitly waited for hydration/network readiness and observed a POST 200. Credential query strings were excluded from saved JSON, this report and screenshot filenames.

This is both an early test-action timing error and an unsafe native-form fallback: the current login form has onSubmit but no explicit method. Do not reproduce the credential-bearing GET or publish raw local server logs/history. A bounded implementation correction should prevent credentials from entering URL query strings when JavaScript has not attached. No such source correction was made during this verification.

## Carried-forward blocker

The earlier tutorial campaign reproduced `/api/tutorial/progress` HTTP 500 on both learner brands and independently confirmed PostgreSQL SQLSTATE 42703 for missing `tutorial_progress.tenant_id`. This follow-up did not change or retest that database issue. The earlier synthetic tutorial and telemetry records were fully cleaned up, as recorded in that campaign's cleanup verification.

## Evidence and limitations

- `results-verified-20261111-1.json`: dashboard, Users, Subscriptions, Project LLM specification/workflow and empty Question Review.
- `results-verified-20261111-2.json`: certificate generator/preview, Question Factory and Project LLM dashboard.
- `results-verified-20261111-3.json`: SUIA preview brand switch/no mutation requests, all five Marketing responses, fresh-login Questions reproduction, and seven anonymous admission probes.
- Screenshots with the final dated suffix support the JSON observations. Earlier screenshots in this directory are retained for chronology; screenshots alone are not acceptance evidence for backend writes or permissions.
- Chromium reported version 157.0.8103.39. Certificate previews used the application's built-in fictional sample, not an actual issued student credential.
- Local frontend processes were found restarted on HTTP and the previous temporary certificate absent. HTTPS was restored with a new local self-signed certificate, limited to the brand localhost names, without changing system trust. Its SHA256 fingerprint is `c27c9f6b80e2f05f569e443964c06c24d1c08bdcdd509c71435088f76716ec59`; private key is outside Git in Local AppData. Browser contexts ignored local certificate trust errors. This is development TLS, not public TLS/deployment acceptance.
- One transient auth/me 503 was observed during the earlier certificate-preview visit on 10 November and recovered. No service-recovery or availability SLO is inferred from that observation.
- Test contexts were closed after evidence capture. No deliberate business-data mutations occurred in this follow-up; login/session activity was not erased.
- Routine unit tests/build/typecheck and accepted R6 cryptographic probes were not repeated. No reported developer test totals are claimed as independently rerun here.
- Existing user-modified documents, Playwright report and prior screenshots remain preserved. Ledger SHA256 remains `7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e`.

## Next bounded work

Trace and correct the Questions 401 and Marketing 500 integrations using their real upstream paths; correct the pre-hydration login fallback; review the separate tutorial-progress schema mismatch before any authorized migration. Then repeat only the failing probes and the blocked bulk-confirmation test. Real PostgreSQL concurrency/rollback and tenant-only publication tests remain separately unverified. Do not call all 30 tasks accepted, change the canonical ledger, or substitute screenshot counts for those missing tests.

No code changes, commit, push, migration or deployment was performed by this follow-up campaign.
