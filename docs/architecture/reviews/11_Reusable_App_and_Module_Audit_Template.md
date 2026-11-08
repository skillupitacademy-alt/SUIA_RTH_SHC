# Reusable App / Future SHC Module Architecture Acceptance Template (under PSEG-001)

**Template status:** A reusable *form*, NOT an evaluation of a current application. Do not add these template rows to the already-established 62-row SHC Admin ledger.

## 1. Identity and scope

- App/module/service name and `MODULE_ID` / owner / consumers / current SHA / actual deployed SHA (if known).
- Feature category: SHC-admin UI / SUIA learner UI / RTH learner UI / brand admin / marketing / SHC service / BFF / AI workflow / database / infra.
- User stories, tutor-led versus online/AI variation, critical data and threat surface.

## 2. Page/component & service trace (repeat for each user journey)

| Journey ID | Page + nested components | Client contract / BFF route | Backend/domain owner | Repository, data writer, tables | Brand/identity/RBAC | Test and result | Verdict |
|---|---|---|---|---|---|---|---|
| APP-001 | TBD | TBD | TBD | TBD | TBD | NOT RUN | PENDING |

## 3. Universal PSEG gates

Evaluate **every** `PSEG-U01` through `PSEG-U14`; mark inapplicable only with rationale. Map applicable profile `PSEG-C01` through `PSEG-C10`. Add application `APP-*` or service `SVC-*` acceptance cases without weakening hard gates.

## 4. Mandatory evidence row schema

`requirement_id, app_or_service, owner, source_path_lines, sha, observation, test_name, executed_command, execution_date, result_or_NOT_RUN, status_PASS_FAIL_PENDING_NA, severity, dependency, proposed_action, reviewer, exception_and_expiry`

## 5. Service-specific requirements

For an educational domain: business state machine, canonical owner/writer, brand policy, typed request/response, object-level access, transactions/idempotency, notification/retry, schema/migration, content/PII privacy, failure recovery, unit/contract/integration/negative security tests, SUIA/RTH parity and local Docker release evidence.

## 6. Completion

- Audit complete only when all applicable rows have evidence or explicit `PENDING` reason.
- Architecture accepted only when mandatory gates verified `PASS`, no hard blocker, and owner approval recorded.
- If future refactor: gain separate owner approval; migrate callers; test both brands; retire duplicate code only with separate G5 approval.
