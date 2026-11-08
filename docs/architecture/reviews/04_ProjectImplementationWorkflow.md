# Project Implementation & Existing-Service Audit Workflow — Draft v1.0

**Operating constraints:** The project is in development; there are currently no student end users. Deployment is performed locally using Docker to a Hostinger VPS. No mandatory paid GitHub CI/CD is required. Keep deployment portable to other providers as growth/cost warrants.

## Phase A — Baseline current architecture before changes

1. **Freeze evidence:** Identify the exact Git branch, commit SHA, currently running Hostinger image/revision and differences between them; do not assume GitHub HEAD equals deployment.
2. **Inventory:** List all deployable apps, services, APIs, shared packages, database connections, event producers/consumers and current Docker/edge routing.
3. **Map requested business capabilities:** enquiry, admission, batch/schedule, tutorial/study, assessment/exam, mentoring/guidance, doubt solving, placement, experience letter, certification. For each, trace frontend -> BFF/gateway -> authoritative backend/domain -> repository -> database; record the brand-specific policy and current ownership.
4. **Use existing audits as leads, not current truth:** Reconcile each historical issue with subsequent fixes and current source. Do not declare missing code from a partial search.
5. **Assess applicable acceptance criteria:** Inspect full relevant sources and dependencies; run safe local tests where accessible. Record exactly what was tested and what was not.
6. **Classify discrepancy:** release-blocking architecture/security violation; should-fix weakness; acceptable variation; future scaling work; not applicable.
7. **Publish findings:** Per-service compliance matrix with file/line references, commit SHA, required tests, risk and evidence status. Do not modify code during baseline inventory/audit unless separate remediation is approved.

## Phase B — Remediation of existing services

1. Prioritize true shared-service ownership violations, cross-brand/security risks and critical academic-data correctness first.
2. Define minimal corrective change and impacted SHC/SUIA/RTH consumers.
3. Review proposed service/data contracts and any schema migrations.
4. Implement only necessary changes with tests; preserve working code that already complies.
5. Re-run affected and cross-brand acceptance tests; update matrix and compare exact code SHA.
6. Promote only when mandatory local release gates pass; document unresolved non-blocking risks.

## Phase C — New features (only after audit/baseline)

Requirement -> domain ownership & brand variation -> API/event/schema and data design -> threat model -> small implementation plan -> code -> unit/integration/security/E2E tests -> architecture review -> local release gate -> Docker deploy -> smoke test -> evidence and version record.

## Phase D — Local, cost-conscious quality gates

The current repository defines `pnpm lint`, `pnpm lint:all`, `pnpm type-check`, `pnpm typecheck:all`, `pnpm test`, `pnpm build`, `pnpm validate:gateway` and `pnpm validate:rbac`. The root `pnpm ci` script (at the reviewed commit) runs lint, typecheck and build **without tests**; do not use that alone as a release approval gate.

**Illustrative locally executed sequence** (adapt targets/environment per changed app and real test dependencies):

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck:all
pnpm test
pnpm validate:gateway
pnpm validate:rbac
pnpm build
# Use a local, secret-protected env file; validate the exact compose overlay used for deployment.
docker compose --env-file <local-env-file> \
  -f infra/hostinger/compose/docker-compose.local-build.yml config --quiet
```

Run security, database/migration, E2E and cross-brand acceptance tests from the service's actual profile. Execute in an isolated test environment: do not use production student data, destructive migrations or live provider credentials for routine checks. If a named command fails due to test environment configuration, record it as **pending/failing**, not passed.

**Required evidence:** Git SHA, date/time, command exit status, selected test report, deployment configuration version, image digest/tag, migration version, smoke-test output, operator and rollback/reference. Keep secrets out of logs and repositories.

Local pre-commit/pre-push hooks are helpful but bypassable. The release gate is the *reviewed record of the complete local verification run*. Reassess automation when multiple contributors, actual students, payments, or operational risk make manual checking insufficient.

## Phase E — Portable deployment and migration readiness

- Container images use OCI conventions and reproducible builds; avoid host-specific assumptions in application code.
- Deployment-specific Compose manifests/overlays live separately from domain logic; env vars and secrets have explicit typed validation.
- Externalized persistent volumes/databases/object storage have tested backup and restore/transfer processes.
- Document routing/DNS/TLS, Cloudflare or other edge behavior, network policy, DB auth, worker/queue operations, cron, notifications and observability.
- Run a second-environment dry run (local compose or another VM) using the same images and portable configuration contracts; verify major SHC/SUIA/RTH journeys.
- Plan migration as an infrastructure and data migration with unavoidable provider-specific adjustments; never claim a provider switch is zero effort or requires no downtime.

## Required acceptance outputs per service

- `SERVICE_ID` and name, current source paths, authoritative owner, consumers, tables/data owner, brand policy, current behavior and proof.
- Mandatory standard/requirement ID, status, severity, recommended change (or preserve), exact regression test, QA evidence and sign-off.
- No service is labeled compliant based only on existence of files/directories, legacy reports, or deployment status.
