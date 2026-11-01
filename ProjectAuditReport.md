Yes. I can access your GitHub repository through the connected GitHub integration. I’ll conduct the audit phase by phase, post each phase’s findings here, and keep the findings separate until you ask me to consolidate them.

I’ll review actual repository files—not assume that a package, test, or infrastructure feature is working merely because its name or script exists. I’ll distinguish:

- Verified finding: directly supported by the repository evidence inspected.
- Potential risk: a concern suggested by the code or configuration that needs further validation.
- Not yet verified: requires runtime, deployment, cloud configuration, or test evidence.

I’ll also avoid making code changes during this review.

# Phase 1 — Repository foundation and engineering controls

Initial scope: root workspace configuration, package scripts, build orchestration, and the project’s baseline engineering controls.

## Phase 1 review — Findings

I inspected the root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`, and `vitest.config.ts` on the repository’s `main` branch.

| ID    | File                                                                                                                               | Finding                                                                                                                                             | Severity         | Assessment                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | [`package.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/package.json?utm_source=chatgpt.com)               | The repository has scripts for build, lint, type-check, tests, load tests, auth audits, gateway validation, RBAC validation, and deployment checks. | Positive         | A useful baseline exists. A script’s presence does not prove it passes or is run in CI.                                                     |
| P1-02 | [`package.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/package.json?utm_source=chatgpt.com)               | The `ci` script runs lint, type-check, and build, but does not explicitly run the test suite.                                                       | High             | The root CI command can succeed without running tests. Confirm whether a separate CI workflow runs tests.                                   |
| P1-03 | [`package.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/package.json?utm_source=chatgpt.com)               | The `prepare` script says Husky setup is temporarily disabled.                                                                                      | Medium           | Local Git hooks may not be installed by the repository’s normal setup. CI must be the authoritative quality gate.                           |
| P1-04 | [`package.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/package.json?utm_source=chatgpt.com)               | Several scripts use `npm run` or `npx` even though the project declares pnpm as its package manager.                                                | Low              | This can create package-manager consistency issues. Prefer pnpm commands where practical.                                                   |
| P1-05 | [`pnpm-workspace.yaml`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/pnpm-workspace.yaml?utm_source=chatgpt.com) | `apps/*` is listed alongside explicit app patterns that it already covers.                                                                          | Low              | Redundant workspace declarations increase configuration noise. Not a demonstrated runtime defect.                                           |
| P1-06 | [`turbo.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/turbo.json?utm_source=chatgpt.com)                   | Turbo defines build, lint, dev, test, and type-check tasks. The test task depends on `^build`.                                                      | Medium           | Confirm that this dependency is intentional and that tests are not unnecessarily coupled to building every dependency.                      |
| P1-07 | [`tsconfig.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/tsconfig.json?utm_source=chatgpt.com)             | TypeScript strict mode is enabled, but `noUnusedLocals` and `noUnusedParameters` are disabled.                                                      | Low              | Strict mode is a positive baseline. These options can be evaluated as additional hygiene checks.                                            |
| P1-08 | [`tsconfig.json`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/tsconfig.json?utm_source=chatgpt.com)             | Root path aliases include several application-specific and overlapping mappings, including `@/*`.                                                   | Medium           | This can make imports ambiguous and encourage cross-app coupling. Review alias ownership and consistency across app-level configs.          |
| P1-09 | [`vitest.config.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/vitest.config.ts?utm_source=chatgpt.com)       | Root Vitest setup references `apps/api-server/src/test/setup.ts` and defines aliases for a subset of packages.                                      | Medium           | Verify this is still the intended central test setup and that package-specific tests use consistent configuration.                          |
| P1-10 | Root documentation / CI                                                                                                            | `README.md` and the two conventional `.github/workflows/ci.yml` / `.yaml` paths were not found through the checked paths.                           | Not yet verified | This does not prove documentation or CI is absent; files may use other names or locations. Need inspect repository tree/workflow inventory. |

### Phase 1 conclusion

The repository has a meaningful engineering-tooling foundation, but the root configuration alone does not prove production readiness.

The highest-priority item from this initial pass is to verify the actual CI workflow and ensure that tests, type checks, linting, build, security checks, and deployment validation are consistently enforced—not merely available as scripts.

### Phase 1 status

| Review area                     | Status           |
| ------------------------------- | ---------------- |
| Root package scripts            | Reviewed         |
| Workspace configuration         | Reviewed         |
| Turbo task configuration        | Reviewed         |
| TypeScript root configuration   | Reviewed         |
| Root Vitest configuration       | Reviewed         |
| CI workflow inventory           | Not yet verified |
| App/package-level configuration | Not yet reviewed |
| Runtime behavior                | Not tested       |
| Deployment configuration        | Not reviewed     |

I’ll keep this as Phase 1’s initial review, not the final consolidated audit. The next review should inspect the CI and deployment controls, then proceed to application and package boundaries.

## Phase 1 — CI and repository governance: deeper inspection

I found an important detail in the repository: the GitHub Actions workflows are stored under `.github/workflows.disabled/`, rather than the standard active `.github/workflows/` directory.

That means the repository contains workflow definitions, but GitHub Actions will not automatically discover them as workflows in that location. I’m inspecting those definitions before deciding whether this is simply a repository organization issue or a substantive deployment/quality-control risk.

This is now a concrete repository finding, not an inference from missing conventional filenames.### Findings from the disabled Quality workflow

Reviewed: [`quality.yml`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/.github/workflows.disabled/quality.yml?utm_source=chatgpt.com)

| ID    | Finding                                                                                                 | Severity     | Evidence and implication                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-11 | The Quality workflow is stored in a non-standard `.github/workflows.disabled/` directory.               | Critical     | It is not an active GitHub Actions workflow from that path. The repository’s quality checks may therefore not run automatically on push or pull request through this file.             |
| P1-12 | The workflow’s test job runs tests only for `@quiz/api-server` and `@quiz/api-gateway`.                 | High         | UI apps, other services, and shared packages are not explicitly tested in this job. They may be covered elsewhere, but that is not established by this workflow.                       |
| P1-13 | The E2E smoke command ends with `\\|\\| true`.                                                          | High         | A failing E2E smoke test is converted into a successful job. This makes the check informational rather than a release gate.                                                            |
| P1-14 | The dependency audit uses `pnpm audit --audit-level=high \\|\\| true`.                                  | High         | High-severity dependency findings cannot fail the job. The following step explicitly describes the audit as informational.                                                             |
| P1-15 | The bundle-check job has `continue-on-error: true`.                                                     | Medium       | Bundle analysis failure cannot block the workflow. Also, `MAX_SIZE_KB=500` is declared but the script only checks whether the report directory exists; it does not enforce the budget. |
| P1-16 | The secret scan runs only on pull requests and uses `--only-verified`.                                  | Medium       | It may miss unverified secret patterns and does not scan every push through this workflow. Consider broader scanning and push protection policies.                                     |
| P1-17 | The `quality-success` job does not depend on the `secret-scan` job.                                     | High         | The summary job can complete without waiting for secret scanning. The secret scan is not a required part of the stated quality-success dependency chain.                               |
| P1-18 | The workflow uses `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, and TruffleHog `@main`. | Medium       | Action versions should be reviewed and pinned to immutable commit SHAs for stronger supply-chain control, especially third-party actions.                                              |
| P1-19 | Placeholder database and Redis values are configured at workflow scope.                                 | Low / Verify | These values are clearly placeholders. Check whether any tests depend on real services and whether setup is adequate for those integration tests.                                      |

Principal-architect interpretation: the quality workflow contains useful checks, but several of its checks are deliberately non-blocking, and the workflow appears disabled by its directory location. That is not equivalent to a functioning release-quality gate.

### Findings from the Cloud Run deployment workflow

Reviewed: [`deploy-cloudrun.yml`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/.github/workflows.disabled/deploy-cloudrun.yml?utm_source=chatgpt.com)

\| ID | Finding | Severity | Evidence and implication |\
\|---|---|---|---|\
\| P1-20 | The deployment workflow is also in `.github/workflows.disabled/`. | Critical | The file is not automatically activated as a GitHub Actions deployment workflow from that location. The deployed services may be managed through another mechanism; that must be verified. |\
\| P1-21 | The workflow sets `REGION: asia-southeast1`. | High / Verify | The configuration targets Singapore. Your intended primary user base is India, and the project context has also referenced Mumbai (`asia-south1`). Confirm the actual deployed region and make the region choice explicit based on latency, data location, and service availability. |\
\| P1-22 | Several Cloud Run services use `--concurrency 1000`. | High | This permits a high number of concurrent requests per instance. It is not evidence that the application can safely process that concurrency. Tune per service through load testing and CPU/memory/request-duration measurements. |\
\| P1-23 | Several services have fixed `--max-instances` values of 5 or 10. | High / Capacity | Autoscaling is bounded by these caps. They may be appropriate for the current stage, but the workflow does not demonstrate that the caps meet a future peak workload. |\
\| P1-24 | Multiple services are deployed with `--allow-unauthenticated`. | High / Verify | Cloud Run’s platform-level access is public. This may be intentional for gateway-routed or public web services, but private service-to-service endpoints need a separate authorization boundary. Confirm that sensitive APIs cannot be reached without application-level authentication and authorization. |\
\| P1-25 | Docker build commands pass `INTERNAL_GATEWAY_SECRET` as a build argument for some images. | High / Verify | Secrets should not be passed as Docker build arguments unless proven safe. Build arguments can be exposed through build metadata, logs, or image layers depending on Dockerfile usage. Prefer runtime Secret Manager injection; inspect the Dockerfiles to determine whether the value is actually embedded. |\
\| P1-26 | The workflow deploys both immutable SHA tags and mutable `latest` tags. | Medium | Deploying the SHA tag is good for traceability. Mutable `latest` can be confusing for rollback and provenance. Prefer SHA/digest-based deployment and use `latest` only as a convenience tag. |\
\| P1-27 | The `plan` job maps changed paths to brand/service deployment groups. | Medium / Verify | The mapping is useful, but it needs a path-by-path dependency audit. A shared package change must deploy every dependent service; incomplete mapping can leave deployed services using incompatible package versions. |\
\| P1-28 | The workflow uses `|| true` for some environment cleanup commands. | Medium / Verify | Cleanup failures are suppressed. That can be intentional for idempotency, but the command should verify the resulting service configuration so an unsuccessful cleanup does not silently persist. |\
\| P1-29 | Post-deployment checks mostly verify selected HTTP status codes or health endpoints. | Medium | Basic smoke checks are useful, but they do not establish that brand routing, authentication, authorization, database connectivity, or core learner journeys work after deployment. |\
\| P1-30 | The workflow has no explicit progressive rollout, traffic split, or automated rollback logic in the inspected deployment steps. | High / Verify | Cloud Run may still provide revision and traffic controls operationally, but this workflow does not demonstrate a guarded rollout or rollback strategy. |

Capacity note: `--max-instances 10` and `--concurrency 1000` should not be read as “this service supports 10,000 users.” They are deployment settings, not validated user-capacity results. Request mix, request duration, memory use, database connections, and downstream limits determine actual capacity.

### Findings from the Gateway deployment workflow

Reviewed: [`deploy-gateway.yml`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/.github/workflows.disabled/deploy-gateway.yml?utm_source=chatgpt.com)

| ID    | Finding                                                                                                                          | Severity        | Evidence and implication                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-31 | Gateway deployment workflow is stored in the disabled workflow directory.                                                        | Critical        | This file is not automatically activated as a GitHub Actions workflow from its current location.                                                                                 |
| P1-32 | The path filter refers to `.github/workflows/deploy-gateway.yml`, but the inspected file is under `.github/workflows.disabled/`. | Medium          | Even if moved to the active directory, the current path filter would need to be aligned with the actual workflow path.                                                           |
| P1-33 | The workflow uses `asia-southeast1` for upstream Cloud Run discovery.                                                            | High / Verify   | Confirm that this matches the actual deployed region for all listed services.                                                                                                    |
| P1-34 | Some gateway upstreams are resolved dynamically, while others come from GitHub secrets or remain initialized as empty strings.   | High / Verify   | Validate that every required route has a non-empty, correct upstream URL at deployment time.                                                                                     |
| P1-35 | `PAYMENT_SERVICE_URL` and `CRM_SERVICE_URL` are passed into Wrangler but are not dynamically resolved in the workflow.           | Medium / Verify | This may be intentional if those URLs are configured as secrets. Their presence and correctness need to be checked against the gateway routing table and deployed configuration. |
| P1-36 | `EXAM_SERVICE_URL` and `NOTIFICATION_URL` are both assigned the `quiz-api-server` URL.                                           | Medium / Verify | Confirm that this shared upstream is intentional and that the gateway routes to the correct API paths.                                                                           |
| P1-37 | The workflow invokes `node scripts/validate-gateway.mjs` without `--live`.                                                       | Medium          | The workflow invocation performs static validation, not the live upstream and gateway-auth probes supported by the script.                                                       |
| P1-38 | Upstream URLs are printed in the workflow log.                                                                                   | Low             | URLs are generally not credentials, but logs should not include sensitive query strings or tokens if any upstream configuration ever contains them.                              |

Reviewed supporting files:

- [`scripts/validate-gateway.mjs`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/scripts/validate-gateway.mjs?utm_source=chatgpt.com)
- [`services/api-gateway/wrangler.toml`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/wrangler.toml?utm_source=chatgpt.com)

The validation script has separate static and live modes. The live mode can probe upstreams and gateway authentication, but the inspected deployment workflow does not invoke that mode. That means the existence of this validator is not proof that live upstream connectivity is checked during deployment.

## Phase 1 — Consolidated interim result

| Audit area                         | Status   | Key concern                                                                                       |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| Root workspace and scripts         | Reviewed | Quality scripts exist, but the actual enforcement path needs verification                         |
| Turbo and TypeScript configuration | Reviewed | Alias and task-boundary consistency needs further review                                          |
| Vitest configuration               | Reviewed | Root test setup and test coverage scope need verification                                         |
| Quality workflow                   | Reviewed | Workflow is under `.github/workflows.disabled/`; some checks are non-blocking                     |
| Cloud Run deployment workflow      | Reviewed | Disabled workflow, region/capacity settings, and rollout protections require verification         |
| Gateway deployment workflow        | Reviewed | Disabled workflow, upstream binding completeness, and live validation require verification        |
| CODEOWNERS                         | Reviewed | Ownership rules exist; actual enforcement depends on repository settings                          |
| Dependabot                         | Reviewed | Dependency update automation is configured in the file; active execution still needs verification |
| PR template                        | Reviewed | Useful checklist exists, but it is not a substitute for automated required checks                 |

### Principal Architect recommendation

Before relying on automatic production deployments, establish which deployment mechanism is actually active today. The repository contains deployment definitions, but the reviewed definitions are in a disabled directory. I will not assume these files represent the live production deployment process without corroborating evidence.

## Next audit phase

I’ll now move into the API Gateway source code, starting with:

1. `services/api-gateway/src/index.ts`
2. `services/api-gateway/src/routes/routing-table.ts`
3. `services/api-gateway/src/rbac-gateway.ts`
4. Gateway middleware and library files
5. Gateway tests

That phase will examine the actual request path: hostname/brand resolution → route selection → authentication → authorization → upstream forwarding → error handling, with findings tied to the exact source files and code sections.

# Phase 2 — API Gateway source-code audit

I have now inspected the gateway’s request entry point, routing table, authentication middleware, proxy implementation, brand resolution, CORS, rate-limit middleware, request-ID handling, trace/debug middleware, health snapshot, and the gateway tests in the GitHub `main` branch.

This review is based on source inspection. I have not executed the gateway or its tests in this session, so runtime behavior and deployed configuration remain unverified.

Repository links:

- [Gateway entry point](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/src/index.ts?utm_source=chatgpt.com)
- [Routing table](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/src/routes/routing-table.ts?utm_source=chatgpt.com)
- [Authentication middleware](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/src/middleware/auth.ts?utm_source=chatgpt.com)
- [Proxy implementation](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/src/lib/proxy.ts?utm_source=chatgpt.com)
- [Trusted brand resolution](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/src/lib/request-brand.ts?utm_source=chatgpt.com)
- [Gateway tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/api-gateway/src/__tests__/gateway.test.ts?utm_source=chatgpt.com)

## 2.1 Critical and high-priority findings

| ID    | File / code area                         | Finding                                                                                       | Severity      | Why it matters                                                                                                                                                                                                         |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GW-01 | `middleware/trace-debug.ts`              | Incoming cookie and Authorization values are logged in truncated form.                        | Critical      | Truncation is not a safe way to handle credentials. A cookie or bearer token prefix can still expose sensitive material in logs. Debug logging should not record credential values at all.                             |
| GW-02 | `index.ts`                               | Gateway route, brand, auth, and upstream diagnostic logs are emitted during request handling. | High          | Per-request debug logging increases log volume and cost, and can expose hostnames, routes, identity context, and operational details. Production logging should be structured, minimal, and level-controlled.          |
| GW-03 | `middleware/rate-limit.ts`               | The middleware currently calls `next()` without enforcing any limit.                          | High          | The gateway itself does not apply rate limits. The code comment says controls are delegated to Cloudflare edge and service-level middleware, but those protections must be verified independently.                     |
| GW-04 | `middleware/auth.ts`                     | `decodeURIComponent()` in cookie parsing runs before the token-verification `try/catch`.      | High          | A malformed percent-encoded cookie may throw before the auth handler returns a controlled 401. The outer gateway error handler may return 500 instead. This needs a defensive parser and a test for malformed cookies. |
| GW-05 | `index.ts`                               | The proxy exception handler returns `details` containing the upstream error message.          | High          | Upstream error text may contain implementation details. Return a generic client error and retain sanitized diagnostics only in controlled logs.                                                                        |
| GW-06 | `lib/proxy.ts`                           | The gateway forwards the internal secret to the upstream as `X-Internal-Secret`.              | High / Verify | This is a valid trust-boundary pattern only if the upstream verifies it securely and direct access is appropriately restricted. The actual Cloud Run exposure and API-server validation must be reviewed.              |
| GW-07 | `middleware/auth.ts`                     | A JWT with no `brand` claim is accepted, provided token type and identity claims pass.        | High / Verify | The gateway only rejects a brand mismatch when the token brand exists. With shared identity and multiple brands, missing brand claims should be explicitly governed rather than implicitly accepted.                   |
| GW-08 | `index.ts`                               | Missing roles are logged but do not stop the request at the gateway.                          | High / Verify | The code comments delegate denial to API-server RBAC. That can be safe only if every protected upstream route independently enforces authorization and cannot be bypassed.                                             |
| GW-09 | `index.ts` + `rbac-gateway.ts`           | The gateway RBAC helper is not called by the request path shown in `index.ts`.                | High / Verify | The separate helper appears to provide gateway RBAC, but the main entry point does not use it. The actual authorization layer is therefore the API server plus the limited admin check in the auth middleware.         |
| GW-10 | `lib/validation.ts` + `/internal/health` | Internal health returns all configured service URLs and a route-to-upstream map.              | High / Verify | This endpoint may expose internal topology if publicly reachable. It should be access-controlled or reduced to non-sensitive status information.                                                                       |

### GW-01 — Credential material in logs

In `trace-debug.ts`, the code captures:

```
cookie: c.req.header('cookie')?.slice(0, 100),
authorization: c.req.header('authorization')?.slice(0, 50),
```

It then logs prefixes for auth-related paths. The code is attempting to avoid logging full tokens, but a prefix is still a credential fragment.

Recommendation: log only booleans and safe metadata, such as `hasCookie`, `hasAuthorization`, `tokenSource`, and a correlation ID. Do not log any cookie or Authorization value, even partially.

### GW-04 — Malformed cookie parsing

The helper in `auth.ts` uses:

```
return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
```

This helper is called before the verification `try/catch` in `authenticateRequest()`.

Recommendation: make cookie parsing non-throwing. If decoding fails, treat the cookie as invalid and return a controlled authentication failure. Add a regression test for malformed percent-encoding.

### GW-07 — Missing brand claim

The auth middleware checks:

```
if (tokenBrand !== undefined && tokenBrand !== resolvedBrand) {
  // reject
}
```

This rejects a token that asserts the wrong brand, but does not reject a token that has no brand claim.

This is not proof of a cross-brand authorization bypass—the API server may perform a stronger membership check. However, for the shared identity / separate brand-data model, the gateway should not rely on an implicit missing-claim policy.

Recommendation: decide and document the token contract. If all newly issued access tokens must be brand-scoped, reject missing brand claims for brand-protected requests, with an explicit migration policy for legacy tokens.

## 2.2 Routing-table review

The routing table is a central configuration file and is therefore a security-sensitive part of the gateway.

| ID    | File / code area          | Finding                                                                                                                                    | Severity        | Assessment                                                                                                                                                                                             |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GW-11 | `routes/routing-table.ts` | Many API routes are marked `public: true`, including `/telemetry`, `/webhooks`, `/enquiries`, and `/jobs`.                                 | High / Verify   | Public access may be correct for selected endpoints, but each route needs an explicit threat model. For example, webhooks require signature verification, and public telemetry needs abuse protection. |
| GW-12 | `routes/routing-table.ts` | The `public` property is not used by the shown `index.ts` authorization flow.                                                              | Medium          | The effective policy is determined by `auth: true` versus the absence of it. The `public` field can mislead reviewers unless it is validated or used consistently.                                     |
| GW-13 | `routes/routing-table.ts` | The routing table maps `/factory` and `/system` to `requireRole: 'admin'`, but many other protected routes rely on upstream authorization. | High / Verify   | Confirm the API server checks roles and permissions for all sensitive routes, not just the gateway’s explicit admin routes.                                                                            |
| GW-14 | `routes/routing-table.ts` | `/telemetry` is public and routes to the exam API server.                                                                                  | High / Verify   | Public telemetry can become a high-volume write path. Verify schema validation, payload limits, rate limits, and asynchronous ingestion behavior.                                                      |
| GW-15 | `routes/routing-table.ts` | Host-specific catch-all routes forward broad traffic to frontend services.                                                                 | Medium / Verify | This is expected for frontend routing, but ensure unknown API paths cannot be mistaken for frontend routes and that the frontend does not expose sensitive fallback behavior.                          |
| GW-16 | `routes/routing-table.ts` | `resolveGatewayRoute()` normalizes `/api/` by stripping the prefix, then selects the longest matching prefix.                              | Positive        | Longest-prefix routing is a sensible basis. It needs regression tests for overlapping prefixes, host-specific overrides, `/api` edge cases, and trailing slashes.                                      |
| GW-17 | `routes/routing-table.ts` | Route configuration is represented as a mutable array and resolved by filtering/sorting per request.                                       | Low             | The table is small enough that this is unlikely to be a current bottleneck. An immutable precompiled route structure may be considered if route count grows materially.                                |

### Route policy recommendation

The routing table should be treated as an explicit policy manifest, not just a URL map. Each entry should state:

- Required authentication: public, user, admin, service-to-service, or webhook signature.
- Required permission or role, if applicable.
- Brand scope.
- Rate-limit policy.
- Payload-size and timeout policy.
- Upstream service and path rewrite.
- Whether the endpoint can be accessed directly or only through the gateway.

A validation test should fail if a sensitive route is added without a declared policy.

## 2.3 Authentication review

| ID    | File / code area     | Finding                                                                                                  | Severity          | Assessment                                                                                                                                                                           |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GW-18 | `middleware/auth.ts` | Admin portal identity is inferred from route metadata or `x-portal-identity`.                            | Medium / Verify   | Route metadata is a stronger signal than a caller-controlled header. Ensure a caller cannot turn a user route into an admin route simply by supplying the portal header.             |
| GW-19 | `middleware/auth.ts` | Admin routes use `admin_accessToken`; user routes use `accessToken`; Authorization bearer is a fallback. | Positive          | Clear token-source separation is useful. Verify cookie parsing, token audience/type, issuer, expiration, and signing-key rotation behavior.                                          |
| GW-20 | `middleware/auth.ts` | Admin authorization checks `admin` or `super_admin` role.                                                | Positive / Verify | The basic check is present. Verify role claims are issued only by trusted identity code and that backend authorization remains authoritative.                                        |
| GW-21 | `middleware/auth.ts` | JWT secrets are passed into `TokenService` for verification.                                             | Verify            | The exact verification requirements are delegated to `@quiz/auth`. That package must be inspected for algorithm restrictions, issuer/audience enforcement, expiry, and key rotation. |
| GW-22 | `middleware/auth.ts` | The catch block logs the token-verification error message.                                               | Medium            | Avoid logging sensitive parser or token details. Use a bounded error category and correlation ID.                                                                                    |
| GW-23 | `middleware/auth.ts` | Role normalization accepts arbitrary strings and lowercases them.                                        | Medium / Verify   | This is acceptable if upstream authorization uses a strict allowlist. A typed gateway role union alone does not validate an untrusted JWT claim at runtime.                          |

### Portal identity point

The gateway correctly uses route metadata for admin routes such as `/admin`. However, `x-portal-identity` is still a request header. The API server must not treat that header as proof that the user is an administrator; it should rely on verified identity and authorization context.

## 2.4 Proxy review

| ID    | File / code area | Finding                                                                                                                                 | Severity          | Assessment                                                                                                                                                                                                                                 |
| ----- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GW-24 | `lib/proxy.ts`   | Proxy forwards most incoming headers and then overwrites selected gateway-controlled headers.                                           | High / Verify     | Define an explicit header allowlist or a carefully reviewed denylist. Client-supplied identity headers must never be trusted by the upstream unless overwritten by the gateway.                                                            |
| GW-25 | `lib/proxy.ts`   | Gateway deletes `Host`, `CF-Connecting-IP`, and `X-Forwarded-For`, but does not delete all possible client-supplied forwarding headers. | High / Verify     | Headers such as `Forwarded`, `X-Real-IP`, or other proxy headers may influence downstream behavior if trusted. Establish a canonical forwarding-header policy.                                                                             |
| GW-26 | `lib/proxy.ts`   | `X-Original-Host` is derived from the request `Origin` header when present.                                                             | High / Verify     | `Origin` is caller-controlled and is not necessarily the actual original host. It may represent a different origin or be absent. The downstream trust model must not treat this value as verified merely because the gateway forwarded it. |
| GW-27 | `lib/proxy.ts`   | `X-Forwarded-Host` is set to the gateway request URL hostname.                                                                          | Positive / Verify | This is better than forwarding a raw client value, but the actual hostname must be the intended public host and must be interpreted consistently downstream.                                                                               |
| GW-28 | `lib/proxy.ts`   | The gateway forwards cookies to the upstream.                                                                                           | High / Verify     | Necessary for cookie-authenticated BFF flows, but cookies should be forwarded only to intended upstreams and protected by appropriate transport and service access controls.                                                               |
| GW-29 | `lib/proxy.ts`   | The proxy buffers non-GET/HEAD request bodies using `arrayBuffer()`.                                                                    | Medium / Capacity | Buffering consumes memory proportional to request body size. Enforce body-size limits and evaluate streaming behavior for larger uploads.                                                                                                  |
| GW-30 | `lib/proxy.ts`   | No explicit proxy timeout is configured in the shown fetch call.                                                                        | High / Capacity   | A slow upstream can hold resources and delay responses. Establish bounded request timeouts and cancellation behavior appropriate to each route.                                                                                            |
| GW-31 | `lib/proxy.ts`   | Proxy uses `redirect: 'manual'`.                                                                                                        | Positive / Verify | This prevents automatic redirect following at the gateway. Confirm redirect responses are handled correctly by clients and do not leak internal upstream URLs.                                                                             |
| GW-32 | `lib/proxy.ts`   | Correlation ID is accepted from the incoming request if present.                                                                        | Medium            | A caller-supplied ID should be length- and character-validated before use in logs and downstream headers.                                                                                                                                  |

### GW-26 — Host provenance

The proxy uses the incoming `Origin` header to set `X-Original-Host`:

```
const originHostname = tryExtractHostname(headers.get('origin'));
const cfWorkerHostname = url.hostname;
const originalHostname = originHostname ?? cfWorkerHostname;
```

`Origin` identifies the request’s origin, not necessarily the public hostname that received the request. It can also be absent or differ in legitimate cross-origin flows.

Recommendation: derive the original host from a trusted edge/gateway request property or a trusted internal request contract. Do not treat `Origin` as a verified host assertion. Downstream brand resolution should accept forwarded host headers only from an authenticated gateway path.

## 2.5 CORS, request IDs, health checks, and tests

| ID    | File / code area            | Finding                                                                                                                                   | Severity        | Assessment                                                                                                                                               |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GW-33 | `middleware/cors.ts`        | CORS uses a fixed allowed-origin list and enables credentials.                                                                            | Positive        | Explicit origins are preferable to wildcard origins when credentials are enabled. Keep the list synchronized with actual brand origins.                  |
| GW-34 | `middleware/cors.ts`        | `X-Gateway-Secret` is listed as an allowed browser request header.                                                                        | High / Verify   | A gateway secret should not be a browser credential. Confirm no frontend code is expected to send it. Remove it from browser CORS policy if unnecessary. |
| GW-35 | `middleware/cors.ts`        | `X-Internal-Secret` is not in the shown allowed-header list.                                                                              | Medium / Verify | This is appropriate if the secret is strictly server-to-server. Browser calls should not need it.                                                        |
| GW-36 | `middleware/request-id.ts`  | Client-provided `X-Request-ID` is accepted without validation.                                                                            | Medium          | A malformed or extremely long request ID can pollute logs and correlation data. Validate its format and length; generate a fresh ID if invalid.          |
| GW-37 | `middleware/rate-limit.ts`  | No gateway-level rate limiting is active in the middleware.                                                                               | High            | Rate-limit protection is not provided by this code. The Cloudflare and upstream enforcement must be separately verified.                                 |
| GW-38 | `lib/validation.ts`         | The health snapshot exposes route and service configuration, including upstream URLs.                                                     | High / Verify   | Restrict access or return only sanitized service status.                                                                                                 |
| GW-39 | `index.ts`                  | `/healthz` returns a static `ok` response.                                                                                                | Medium          | This is suitable as a liveness check, but it does not establish upstream readiness. Keep liveness and readiness semantics distinct.                      |
| GW-40 | `__tests__/gateway.test.ts` | Gateway tests cover routing, auth token sources, CORS, and header propagation.                                                            | Positive        | A useful base of tests exists.                                                                                                                           |
| GW-41 | `__tests__/gateway.test.ts` | The tests explicitly expect protected requests to proceed without gateway rate limiting.                                                  | High            | This locks in the no-op rate-limit behavior. It should be revised when a concrete gateway or edge rate-limit contract is established.                    |
| GW-42 | Gateway tests               | The inspected tests do not demonstrate malformed-cookie, untrusted forwarding-header, secret-log redaction, timeout, or large-body cases. | Medium / Verify | Add targeted regression tests for these boundary conditions.                                                                                             |

### Test coverage gaps to add

| Test case                                                 | Expected behavior                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Malformed percent-encoded auth cookie                     | Controlled 401; no uncaught exception or 500                           |
| Client supplies `X-User-ID` or `X-User-Roles`             | Gateway overwrites or strips client identity claims                    |
| Client supplies `X-Original-Host` without internal secret | It is not trusted for brand selection                                  |
| Internal request supplies mismatched brand assertion      | 403                                                                    |
| JWT has no brand claim                                    | Explicitly defined policy; preferably rejected for brand-scoped routes |
| JWT has no roles                                          | Protected route denied by authoritative authorization layer            |
| Oversized request body                                    | Rejected before unbounded buffering                                    |
| Slow upstream                                             | Gateway returns bounded timeout response                               |
| Rate-limit threshold exceeded                             | 429 with defined retry behavior                                        |
| `/internal/health` from untrusted client                  | Access denied or sanitized response                                    |
| Invalid request ID                                        | Replaced with safe generated ID                                        |
| Unknown API path on brand frontend host                   | Does not reach a sensitive or unintended upstream                      |

## 2.6 Positive findings

The gateway has several useful foundations that should be retained:

| Area             | Positive observation                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Route resolution | Host-specific routes receive precedence over generic routes, and longer prefixes are preferred |
| Brand assertion  | `X-Brand` is not used as an unauthenticated tenant selector in the trusted brand resolver      |
| Brand mismatch   | Tokens that explicitly assert a different brand are rejected                                   |
| Admin auth       | Admin routes require an admin-capable token and the expected token type                        |
| Internal secret  | The gateway injects a server-to-server secret into upstream requests                           |
| Correlation      | Request IDs are propagated to upstream services                                                |
| CORS             | The configured CORS origins are explicit rather than wildcard                                  |
| Tests            | Existing tests cover important routing, token-source, CORS, and header-forwarding behavior     |

These are meaningful foundations. The goal is to strengthen their contracts and remove ambiguous or unsafe behavior, not rewrite the gateway without reason.

## 2.7 Recommended remediation order

| Priority | Work item                                                       | Reason                                                      |
| -------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| P0       | Remove all token/cookie fragments from logs                     | Credential confidentiality                                  |
| P0       | Verify direct upstream access and internal-secret enforcement   | Ensure the gateway is a real trust boundary                 |
| P0       | Define strict brand-claim policy                                | Prevent ambiguity in a shared-identity, multi-brand system  |
| P1       | Make cookie parsing non-throwing                                | Reliable authentication failure behavior                    |
| P1       | Validate/replace request IDs and sanitize proxy error responses | Safer logs and client responses                             |
| P1       | Define and verify rate limiting for public and sensitive routes | Abuse protection and resource control                       |
| P1       | Establish safe host and forwarding-header provenance            | Prevent spoofed downstream host/brand context               |
| P1       | Restrict or sanitize internal health endpoint                   | Reduce infrastructure disclosure                            |
| P2       | Formalize route policy metadata                                 | Consistent auth, authorization, and rate-limit requirements |
| P2       | Add boundary-focused regression tests                           | Prevent future regressions                                  |
| P2       | Tune body buffering and upstream timeouts                       | Capacity and reliability                                    |

## Phase 2 status

| Audit area                           | Status           |
| ------------------------------------ | ---------------- |
| Gateway entry point                  | Source reviewed  |
| Routing table                        | Source reviewed  |
| Authentication middleware            | Source reviewed  |
| Proxy implementation                 | Source reviewed  |
| Brand resolution and assertion       | Source reviewed  |
| CORS                                 | Source reviewed  |
| Rate limiting                        | Source reviewed  |
| Request ID and trace middleware      | Source reviewed  |
| Health snapshot                      | Source reviewed  |
| Gateway test file                    | Source reviewed  |
| Test execution                       | Not performed    |
| Cloudflare deployed rules            | Not verified     |
| Cloud Run direct-access restrictions | Not verified     |
| API-server authorization             | Not yet reviewed |

Phase 2 conclusion: the gateway’s routing and authentication foundations are useful, but the code currently leaves important security and scale guarantees to downstream services or external Cloudflare configuration. Before claiming that RTH and SUIA are protected against cross-brand access, abuse, or high traffic, those dependencies must be verified.

I’ll preserve these findings as Phase 2 for the eventual consolidated review. The next phase should inspect the API server’s authentication and authorization path—especially how it validates `X-Internal-Secret`, derives brand context, checks membership and roles, and accesses `people_prod`, `rth_prod`, and `skillup_prod`.

# Phase 3 — API server authentication and authorization review

I am continuing from the gateway into the API server’s trust boundary. I inspected the following source files from `main`:

- [`gateway-auth.middleware.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/middleware/gateway-auth.middleware.ts?utm_source=chatgpt.com)
- [`internal-auth.middleware.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/middleware/internal-auth.middleware.ts?utm_source=chatgpt.com)
- [`auth-context.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/lib/auth-context.ts?utm_source=chatgpt.com)
- [`request-brand.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/lib/request-brand.ts?utm_source=chatgpt.com)
- [`proxy.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/proxy.ts?utm_source=chatgpt.com)
- [`rbac.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/rbac.service.ts?utm_source=chatgpt.com)
- [`token.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/token.service.ts?utm_source=chatgpt.com)

I also inspected the login route because it is a public authentication entry point. These are source-level findings; I have not run exploit tests or verified the live Cloud Run network configuration.

## 3.1 Highest-priority findings

| ID     | Source                        | Finding                                                                                                                                         | Severity               |
| ------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| API-01 | `internal-auth.middleware.ts` | Internal-secret previews and raw role-header values are written to logs.                                                                        | Critical               |
| API-02 | `gateway-auth.middleware.ts`  | Invalid secret logs include the received and expected secret prefixes.                                                                          | Critical               |
| API-03 | `internal-auth.middleware.ts` | “Gateway mode” accepts `X-User-ID` and `X-Brand` without validating an internal secret or JWT in this function.                                 | Critical / Conditional |
| API-04 | `auth-context.ts`             | A gateway/internal context with non-empty roles is returned as trusted identity context without verifying brand membership in this function.    | High / Conditional     |
| API-05 | `request-brand.ts`            | Brand resolution uses `X-Brand` or `X-Platform`; it does not itself establish that those headers came from a trusted gateway.                   | High / Conditional     |
| API-06 | `proxy.ts`                    | Several route families are exempted from the proxy’s JWT validation.                                                                            | High / Verify          |
| API-07 | `rbac.service.ts`             | Admin check falls back to token claims when the user lookup fails or the user is absent.                                                        | High                   |
| API-08 | `auth-context.ts`             | JWT fallback defaults a missing/invalid brand to `realtutorialhub`.                                                                             | High                   |
| API-09 | `auth-context.ts`             | If trusted gateway/internal roles normalize to an empty array, it falls through to JWT authentication rather than returning an explicit denial. | Medium / Verify        |
| API-10 | `proxy.ts`                    | Authentication exception messages are returned to clients.                                                                                      | Medium                 |

The conditional findings depend on whether the relevant routes use these helpers and whether the API server can be reached outside the gateway. I am keeping those conditions explicit rather than claiming a confirmed remote exploit.

### API-01 — Internal auth logs disclose sensitive context

In `internal-auth.middleware.ts`, the code logs the raw role header:

```
rolesHeaderValue: userRoles,
```

It also logs a preview of the expected secret:

```
secretPreview: process.env.INTERNAL_API_SECRET !== undefined
  ? `${process.env.INTERNAL_API_SECRET.substring(0, 20)}...`
  : 'NONE'
```

And in the mismatch path, it logs prefixes of both received and expected secrets.

Architectural concern: the internal secret is a service credential. It must never be logged, even partially. Raw roles are also authorization input and can contain user-specific or unexpected values.

Recommendation: remove secret previews and raw role values from logs. Use only safe booleans, an authentication mode, a bounded reason code, and correlation ID.

### API-02 — Gateway secret diagnostics disclose credential prefixes

`gateway-auth.middleware.ts` logs the first ten characters of the received and expected secrets when authentication fails.

This is a separate logging issue from API-01. The remediation should cover both middleware files, plus any deployment/runtime logs that capture them.

Recommendation: log `secretConfigured`, `headerPresent`, and `secretMatched` as booleans only. Never emit any part of the secret.

### API-03 — Header-only gateway mode is a trust-boundary risk

`validateRequest()` in `internal-auth.middleware.ts` has a gateway-mode branch that accepts:

```
const gatewayUserId = req.headers.get('x-user-id');
const gatewayBrand = req.headers.get('x-brand');

if (gatewayUserId !== null && gatewayBrand !== null) {
  // returns gateway AuthContext
}
```

This branch does not check `X-Internal-Secret`, verify a JWT, or validate a cryptographic assertion in the function itself. It treats the identity and brand headers as sufficient.

That may be intentional if a trusted gateway is the only possible caller. But it becomes dangerous if the API server can be reached directly or if a route bypasses the gateway’s identity validation. A client could potentially supply its own `X-User-ID`, `X-Brand`, and role headers.

Required verification:

1. Confirm whether this gateway-mode branch is used by sensitive route handlers.
2. Confirm whether Cloud Run ingress and IAM prevent untrusted direct access.
3. Confirm whether the API server’s `proxy.ts` authenticates the request before the route handler.
4. Confirm that no public or exempt route trusts these headers without a validated gateway secret.

Recommendation: choose one consistent rule: either every gateway-derived identity context must be backed by a valid internal secret, or the API server must cryptographically verify the caller’s identity assertion. Header presence alone should not establish identity.

### API-04 — Trusted context is returned without brand-membership validation

`getAuthContext()` in `auth-context.ts` returns a gateway/internal context after role normalization. It does not itself check whether the user belongs to the resolved brand.

For this platform, global identity and brand-specific data are separate. Authentication should establish who the person is; authorization must then establish that the person is entitled to access the requested brand and resource.

Recommendation: ensure the service layer or a mandatory authorization layer checks the user’s brand membership before querying brand-specific data. The identity header `X-User-ID` must not be treated as proof of membership in `rth_prod` or `skillup_prod`.

This is a review gap until the database access and brand-binding code are inspected—not yet a confirmed cross-brand data leak.

### API-05 — Brand resolution accepts explicit headers without provenance checks

`resolveRequestBrandFromHeaders()` in `request-brand.ts` checks `X-Brand` and then `X-Platform`.

It validates that the value is one of the supported brand names, but it does not establish the trustworthiness of the header source.

This is a valid parsing helper, but it should not be the complete security boundary. A supported brand string is not the same as an authorized brand selection.

Recommendation: separate the operations:

- Parse the requested brand.
- Establish trusted request provenance.
- Verify user membership in that brand.
- Bind all brand-scoped data access to the verified brand context.

### API-06 — Proxy auth exemptions require careful route-by-route review

The API server `proxy.ts` marks several route groups as gateway-exempt, including tutorial, workflow, search, telemetry, and security-report paths.

The proxy also applies CSRF protection selectively, with exemptions for auth routes, workflows, and security reports.

These exceptions may be intentional, but the proxy’s exemption is not itself proof that the handler is safe. Each exempt route needs its own authentication, authorization, validation, and abuse-control review.

Recommendation: maintain a route policy manifest and tests that assert the effective security policy for every exempt route. We should not rely on broad route-prefix exemptions without verifying the handlers behind them.

## 3.2 Admin authorization and brand fallback

### API-07 — Admin check can fall back to token claims after a DB failure

In [`rbac.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/rbac.service.ts?utm_source=chatgpt.com), `_verifyAdmin()` first checks the brand-specific user record. If the user is absent, it returns the token-derived admin result. If the database query throws, it also falls back to token roles.

This is a security-versus-availability decision. For ordinary user-facing availability, fallback may be acceptable in some cases. For admin access, it means the database cannot revoke or block an administrator if the lookup is failing.

The code comment says admin actions always hit the DB to check whether the user is blocked, but the fallback means that check is not guaranteed to succeed.

Recommendation: fail closed for privileged actions when the authoritative blocked-user or role check cannot be completed. If token-based fallback is needed for availability, define a narrow, explicitly approved policy and do not let it bypass blocked-user status.

### API-08 — Missing JWT brand defaults to RTH

In `auth-context.ts`, JWT fallback does this:

```
brand: (payload.brand as RequestBrand) || 'realtutorialhub'
```

The token payload’s brand is cast to `RequestBrand`, but a TypeScript cast does not validate the value at runtime. The fallback also silently assigns RTH when the claim is missing.

Recommendation: reject an absent or unsupported brand claim for brand-scoped routes. Legacy-token handling should be explicit, time-limited, and covered by tests. Avoid silently selecting RTH as the default tenant.

### API-09 — Empty roles do not produce an immediate denial

`getAuthContext()` canonicalizes the gateway/internal roles. If the result is empty, it logs an error and falls through to JWT authentication.

This may be intended as a compatibility fallback, but the security meaning is ambiguous: a request presented as gateway-authenticated has no valid roles, yet the handler continues trying another authentication mechanism.

Recommendation: decide whether missing roles means “invalid gateway identity” or “continue to JWT fallback.” Make the behavior explicit and test both valid and invalid role cases. Do not allow a caller to combine an untrusted identity header with a different token context in a way that creates mixed identities.

### API-10 — Authentication exception text reaches the client

In `proxy.ts`, the catch block returns an error message derived from the exception:

```
const errorMessage = _error instanceof Error
  ? _error.message
  : 'Authentication failed';
```

This may disclose details from token parsing or verification libraries.

Recommendation: return a stable external error such as `Invalid or expired token`, while logging a sanitized internal error category and correlation ID. Do not send stack traces or implementation-specific verification messages to clients.

## 3.3 Login route and request-brand observations

The login handler at [`app/api/auth/login/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/login/route.ts?utm_source=chatgpt.com) has some good controls: it validates the payload with `loginSchema`, applies a route-level rate limit of five requests per minute, and uses a shared cookie helper.

There are still concerns:

| ID     | Finding                                                         | Severity       | Detail                                                                                                                                                                                                |
| ------ | --------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-11 | Login diagnostics log the email address and device identifiers. | High / Privacy | The login route logs email, IP, user agent, device ID/name, host, and origin. These values should be minimized and governed by retention/access controls.                                             |
| API-12 | Login error logs include a short stack trace.                   | Medium         | The handler logs the first few stack lines. Prefer a sanitized error category and correlation ID in production logs.                                                                                  |
| API-13 | Login brand is resolved from request input and headers.         | Verify         | This is acceptable as a requested login context only if `AuthService.login()` verifies credentials and account eligibility against that brand. The handler alone does not establish brand membership. |
| API-14 | Health routes are exempted from gateway-secret validation.      | Low / Verify   | A liveness endpoint can be public. Ensure health endpoints expose only minimal operational status and do not return internal service configuration.                                                   |

The login route’s rate limit is a positive control, but we must verify the limiter is distributed and effective across instances; a per-process in-memory limiter would not provide a reliable global limit.

## 3.4 Phase 3 — Interim conclusion

The API server contains multiple authentication paths: internal-secret, gateway-header, and JWT fallback. That flexibility can support a gateway/BFF architecture, but the trust boundaries must be unambiguous.

The highest-priority architecture concern is this:

> A request’s `X-User-ID`, `X-Brand`, and `X-User-Roles` headers must not become authoritative identity simply because they are present.

The API server must establish that those headers came from a trusted gateway or authenticated service, and then enforce brand membership and resource-level authorization.

### Immediate remediation shortlist

1. Remove all secret previews, raw role-header values, and credential fragments from logs.
2. Confirm the API server cannot be reached directly by untrusted clients—or make every identity-header trust path validate a secret or signed assertion.
3. Reject missing/unsupported brand claims instead of defaulting to RTH.
4. Fail closed for admin access when authoritative blocked-user/role checks fail.
5. Audit every route exempted from `proxy.ts` JWT/CSRF enforcement.
6. Review `AuthService.login()` and the brand database binding logic before concluding the login brand flow is safe.
7. Add regression tests for forged identity headers, direct-origin access, missing brand, missing roles, and DB failure during admin checks.

## Next file group

The next part of this phase should follow the actual authorization path into the brand-specific data layer:

- `apps/api-server/src/modules/auth/brand-db.ts`
- the relevant user-membership and role repositories
- the route-level `getAuthContext()` callers
- the database access helpers that select `rth_prod` versus `skillup_prod`

That is where we can determine whether the current identity context is consistently bound to the correct brand database, rather than stopping at middleware-level conclusions.

## Phase 3 — Authentication and authorization review (continued)

I’m continuing from the API-server auth layer, following the actual brand-specific database selection and admin authorization paths. This is a source-code review of the repository’s current `main` branch; it is not yet proof of deployed behavior or a live penetration test.

### First architectural finding: brand selection is a security boundary

The repository has separate auth table bindings for the default/SkillHubCore database, RealTutorialHub, and SkillUp. The key question is not just whether a request has a `brand` value—it is whether every authentication, role, and data lookup uses the correct brand context and rejects mismatches.

I found several concrete points worth tracing through the remaining repository files:

- `getAuthBrandContext()` defaults to `realtutorialhub` when no brand is supplied.
- `skillhubcore` selects the default auth database, with a code comment identifying it as the unified auth database.
- Admin login selects the brand context before looking up the user and role assignments.
- Admin portal audience and brand are separate concepts in the code. The audience check needs to be paired with a reliable brand and role check, not treated as a substitute for either.

These are not all confirmed vulnerabilities by themselves; I’m tracing their call sites and data contracts before assigning final severity.

### Findings from this file group

I’ve now traced the brand-bound repository pattern into `UserRepository`, the RBAC helper, admin login, and both user/admin `/me` handlers.

| ID     | Severity                                                          | Finding                                                                                                                                                                                                       | Why it matters                                                                                                                                                                                                                                                      |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-15 | High — confirmed code defect; exploitability depends on call path | `UserRepository.findByEmail()` uses `db.query.users` on the injected DB instance, but the query predicate references the imported default `users` table.                                                      | A repository constructed with brand-specific DB/tables can still use the default schema’s query API. This breaks the intended brand-bound repository contract and risks incorrect lookups or runtime errors.                                                        |
| API-16 | High — confirmed fail-open behavior                               | `_verifyAdmin()` returns token-derived admin status when the user is absent from the brand DB, and also falls back to token roles if the DB query throws.                                                     | A signed admin token can continue to authorize an admin action when current database state cannot confirm the user or role. This weakens blocked-user enforcement and makes DB outages an authorization bypass condition.                                           |
| API-17 | High — confirmed session-check fail-open                          | `/api/auth/me` catches refresh-token/session validation errors and continues with the normal user flow.                                                                                                       | The code explicitly treats a session revocation check failure as non-fatal. A DB/session-validation outage can therefore allow a request to proceed based on the access token alone.                                                                                |
| API-18 | High — confirmed incomplete admin authorization                   | `requireAdminRouteAccess()` skips `_verifyAdmin()` for the `infra` audience after token verification.                                                                                                         | This may be intentional for infrastructure-wide access, but the code shown does not itself establish that the caller has an infrastructure role. The admin token verifier’s audience enforcement and infra issuance rules must be verified before this is accepted. |
| API-19 | Medium — confirmed data-contract concern                          | `canonicalizeRoles()` converts `user` or `student` to `student`, but otherwise preserves role strings without deduplication or allow-list validation.                                                         | Downstream consumers need a consistent role contract. This function normalizes some roles but does not enforce a complete canonical role set.                                                                                                                       |
| API-20 | Medium — confirmed sensitive diagnostic logging                   | `UserRepository` logs user IDs, email, profile/role query activity, DB metadata, and extensive debug traces. `/api/auth/me` logs user email and state, token/session details, and error stacks in some paths. | Logs may become a secondary store of personal and account-related data. Diagnostic logs should be minimized and redacted, especially in production.                                                                                                                 |
| API-21 | Medium — confirmed profile/role lookup degradation                | `hydrateUserDetails()` catches profile and role query failures and continues with `null` profile or empty roles.                                                                                              | This can conceal schema or DB failures as apparently valid incomplete user data. For security-sensitive decisions, distinguish “no roles” from “role query failed.”                                                                                                 |
| API-22 | Medium — confirmed missing transaction boundary in the shown flow | `AdminAuthService.login()` synchronizes a shadow identity, updates the shadow ID, grants platform access, creates tokens, and persists the refresh token in separate operations.                              | A partial failure can leave identity/access state and session state inconsistent. Whether the bridge methods are internally transactional or idempotent remains to be checked.                                                                                      |

#### Code-level details that matter

- [`brand-db.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/brand-db.ts?utm_source=chatgpt.com) supports brand-bound DB/table contexts, but `getAuthBrandContext()` defaults to RealTutorialHub. The callers must therefore reject missing or invalid brand values on brand-scoped requests rather than relying on the default.
- [`user.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/user.repository.ts?utm_source=chatgpt.com) has a strong production DB-instance check in its constructor, but that check only verifies the presence of `select`; it does not prove that query operations use the injected brand’s tables consistently.
- [`rbac.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/rbac.service.ts?utm_source=chatgpt.com) contains the explicit token-claim fallback after a missing user or DB error. For admin authorization, the safer policy is to fail closed when the current account state cannot be established.
- [`auth/me/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/me/route.ts?utm_source=chatgpt.com) correctly resolves the brand from the signed JWT and validates it, which is a positive control. However, its session validation catch then undermines the revocation check by allowing the flow to continue.
- [`admin/auth/login/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/auth/login/route.ts?utm_source=chatgpt.com) accepts brand from the request body or brand headers. This is not automatically unsafe because login credentials are checked against that brand’s DB, but the selected brand must be bound into the resulting token and enforced on subsequent requests.
- [`admin/auth/me/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/auth/me/route.ts?utm_source=chatgpt.com) does perform brand validation and a DB-backed user lookup. Its catch, however, maps broadly to 401, which can obscure internal errors and make operational diagnosis harder.

### Recommended order of remediation

1. Remove token-role fallback from admin RBAC. Missing user, DB failure, or blocked status should deny access; distinguish a database-unavailable response from an authorization denial where appropriate.
2. Make session revocation validation fail closed for routes whose contract requires an active refresh session.
3. Fix repository table binding. Query APIs should be bound to the same brand schema/tables as the injected repository context.
4. Audit infrastructure audience issuance and validation end-to-end before relying on the `infra` bypass.
5. Reduce auth diagnostics to correlation ID, operation, outcome, and non-sensitive reason codes.
6. Add tests for absent user, DB outage, blocked account, revoked session, mismatched brand, and brand-specific repository injection.

I have not changed any files. The next review should inspect the underlying login, refresh, signup, password-recovery, identity-bridge, and platform-access services, because those determine whether the above behaviors can be reached and whether account/role state remains consistent across the identity DB and brand DBs.

## Phase 3.3 — Login, token refresh, signup, and recovery services

The next group shows a repeated pattern: the services do use brand-specific contexts, which is a meaningful positive control, but several security-sensitive operations have failure paths or state transitions that deserve correction.

The most important new observation is that refresh-token rotation is not atomic in the reviewed service: it updates the old token, revokes it, creates replacement tokens, and stores the new session in separate operations. If a later operation fails, the user may be left with a revoked refresh token and no replacement. I’m checking the repository methods and identity bridge contracts next to determine whether any underlying transaction or compensating behavior changes that assessment.

### Additional findings from the shared identity bridge and token implementation

The shared token service adds several important issues beyond the API-server service layer:

- Fallback signing secrets: `packages/auth/src/token.service.ts` uses literal fallback secrets (`test-access-secret`, `test-refresh-secret`, `test-admin-secret`) when environment variables are absent. This is dangerous if a production deployment can start without required JWT secrets. Production startup should fail closed; test defaults should be isolated to test configuration.
- Refresh-token verification is less strict than access-token verification: `verifyRefreshToken()` verifies signature and optionally audience, but does not enforce the expected `tokenType`, brand, or required identity claims. The refresh service then uses the DB session record and requested brand context, so those checks need to be enforced explicitly before token rotation.
- Admin and infrastructure tokens use separate secret/audience combinations: this is useful separation, but the exact verification path must remain consistent. The admin `/me` route verifies an admin token, then uses its brand claim; the infrastructure audience path must also enforce the infrastructure role and intended scope.
- Identity bridge operations span two databases: `syncUser()` creates or updates the global shadow identity and `platformAccess`, while callers separately update the brand DB’s `shadowUserId`. The shown implementation has no distributed transaction. A failure between these steps can leave an orphaned or partially linked identity.
- The bridge’s existing-user lookup is keyed by external ID + platform, not email: that is the right direction for avoiding email-only identity linking, but uniqueness constraints and concurrent calls must ensure two simultaneous syncs cannot create duplicate shadow users for the same external identity.
- Password reset does not revoke sessions in the shown service: `resetPassword()` updates the password and deletes the reset token, but does not revoke active refresh tokens or invoke the global logout service. Existing sessions may remain usable after a password reset unless another layer handles revocation.
- Role canonicalization has inconsistent behavior: `normalize-roles.ts` allow-lists `student`, `admin`, `super_admin`, and `faculty`, while the RBAC service’s own `canonicalizeRoles()` collapses the entire role list to `student` if it contains either `user` or `student`. Mixed-role arrays such as `student + admin` could therefore lose the admin role in that RBAC path. This deserves a regression test and one canonical role-normalization policy.

Source files reviewed in this group:

- [`packages/auth/src/token.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/auth/src/token.service.ts?utm_source=chatgpt.com)
- [`packages/auth/src/rbac/rbac.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/auth/src/rbac/rbac.service.ts?utm_source=chatgpt.com)
- [`packages/auth/src/rbac/normalize-roles.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/auth/src/rbac/normalize-roles.ts?utm_source=chatgpt.com)
- [`packages/identity-bridge/src/UserIdentityBridgeService.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/identity-bridge/src/UserIdentityBridgeService.ts?utm_source=chatgpt.com)

### Current assessment

This pass has uncovered several high-priority source-level risks in authentication and identity handling. The key remediation themes are:

1. Fail closed when admin identity or role state cannot be verified.
2. Enforce session revocation checks rather than allowing failures to degrade into access.
3. Require production JWT secrets and validate refresh-token claims consistently.
4. Make refresh rotation atomic, or implement explicit recovery/compensation.
5. Make identity-bridge synchronization idempotent and resilient to partial cross-database failure.
6. Revoke active sessions after password reset.
7. Consolidate role normalization and add tests for mixed-role arrays.

I have not modified the repository or run its tests. These are findings from source inspection; severity and exploitability still depend on route wiring, database constraints, and deployed ingress configuration.

Next review: I’ll continue through the identity bridge’s schema/constraints and the auth route handlers for refresh, logout, password reset, and session management, checking whether these services are invoked with the required brand, audience, and authorization guards.

## Phase 3.4 — Auth routes, session management, and identity schema

I reviewed the auth route group and its supporting session repositories/schema. This continues the source-level review of `main`; I have not changed files or executed a live security test.

### New findings

| ID     | Severity                                                                    | Finding                                                                                                                                                                                                                                           | Evidence / impact                                                                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-23 | Critical / High — route-level authorization gap                             | `POST /api/auth/resend-verification` accepts a `userId` from the request body and does not authenticate the caller.                                                                                                                               | If `AuthService.resendVerification()` does not impose additional controls, a caller can request verification emails for arbitrary user IDs. Rate limiting exists, but it does not replace ownership or abuse controls.                                               |
| API-24 | High — session ownership not enforced in repository call                    | `DELETE /api/auth/sessions/[sessionId]` passes both `userId` and `sessionId` to `GlobalLogoutService.revokeSession()`, but that service calls `TokenRepository.revokeById(sessionId)`. The repository update filters only by session ID.          | The handler’s authenticated user ID is not part of the actual revoke predicate. A guessed or obtained session ID belonging to another user could be revoked. This is primarily a cross-user denial-of-session risk; bind the update to both session ID and owner ID. |
| API-25 | High — revocation route can report success for nonexistent/foreign sessions | `revokeById()` does not return or check affected rows; `GlobalLogoutService.revokeSession()` always returns success.                                                                                                                              | The endpoint cannot distinguish “revoked this user’s session” from “no matching session” or “session belongs to someone else.” It should perform an owner-scoped update and verify the result.                                                                       |
| API-26 | High — brand context is not consistently derived from the verified token    | In the session-management routes, brand is sometimes inferred from hostname while the JWT’s brand is separately validated. The `/sessions` DELETE route can resolve `skillhubcore`, then casts the resulting brand into a two-brand RBAC context. | This creates a confusing mixed-brand path. Session operations should use one validated canonical brand value and explicitly define whether SkillHubCore is a valid scope for these endpoints.                                                                        |
| API-27 | High — mixed or missing token claims can affect session operations          | The session routes use `verifyAccessToken()` and take `payload.userId`, but do not consistently require a user token type or a particular audience before querying sessions.                                                                      | A valid token of a different scope could be accepted if the verification method’s default behavior allows it. Each route should require the intended token scope explicitly.                                                                                         |
| API-28 | High — global logout has a user-ID ambiguity                                | `/api/auth/logout-all` uses `user.id` from the shared `AuthMiddleware`, while the other session routes use `payload.userId` and comments call it the original user ID.                                                                            | If `user.id` is a shadow ID in one path and the original brand user ID in another, global revocation may target different session rows. The identity contract must be consistent and tested across brands.                                                           |
| API-29 | High — `revokeOtherSessions()` does not preserve the current session safely | The repository first revokes all active sessions for the user, then un-revokes the row matching the current token hash. The first update has no exclusion predicate.                                                                              | This is a multi-step operation that can leave the current session revoked if the second operation fails. The method also has a comment acknowledging its simplified predicate. Use one atomic update with a “not current token” condition.                           |
| API-30 | Medium — session list ordering is ambiguous                                 | `getUserSessions()` orders by `lastUsedAt` ascending, but the service assumes index 0 is the most recently used session when no device ID is provided.                                                                                            | The UI can mark the oldest session as current. Sort descending or determine the current session from a verified session identifier, not a heuristic.                                                                                                                 |
| API-31 | Medium — password reset route returns raw error details                     | `reset-password` catches errors and passes the error object to `ApiResponse.error(..., 400)`.                                                                                                                                                     | Internal exceptions may become client-visible and all failures are represented as bad requests. Return a generic response and log a sanitized reason with correlation ID.                                                                                            |
| API-32 | Medium — auth route logging includes sensitive account/device metadata      | Login logs email, IP, user agent, device ID/name, host/origin, and partial stack traces. Logout logs hostname and detailed error messages.                                                                                                        | Minimize and redact auth logs. Device IDs and user identifiers should not be logged in full unless strictly necessary and access-controlled.                                                                                                                         |
| API-33 | Medium — profile-integrity debug endpoint exposes personal data             | `/api/auth/debug/profile-integrity` returns email, profile name, and account/profile timestamps after token verification, but does not show an explicit admin-only authorization check.                                                           | If deployed, an ordinary authenticated user may be able to call this diagnostic route. Remove it from production or restrict it to an explicit administrative permission and return only necessary fields.                                                           |
| API-34 | Medium — brand binding is bypassable by a configuration fallback            | `/api/auth/profile` selects `brandContext.db` only when `shouldUseBrandBinding()` is true; otherwise it uses the imported default `db`.                                                                                                           | The code has a conditional that can route a brand-specific profile request to a shared/default DB. Confirm the flag is mandatory in production or eliminate the fallback for brand-scoped data.                                                                      |

### Important positive controls

- The session routes do call `validateBrandOrThrow()` before operating on session data.
- The refresh route selects refresh cookies based on portal identity and uses the resolved request brand when calling the refresh service.
- The password-reset and forgot-password endpoints use rate-limit middleware and return a generic success response for the forgot-password flow, reducing account enumeration.
- `packages/db-people/src/schema/users.ts` has a unique index on `(externalId, platform)` for non-null external IDs, which helps protect identity bridge synchronization from duplicate global shadow identities.
- `platform_access` has a unique `(userId, platform)` index. However, its uniqueness includes soft-deleted records, so a deleted access row can still prevent a later re-grant unless the implementation handles that intentionally.

### Remediation priorities from this group

1. Make session revocation owner-scoped in the SQL predicate: `sessionId + userId`.
2. Require authentication and ownership/admin authorization for verification resend.
3. Enforce explicit token scope and canonical brand on every session endpoint.
4. Standardize whether session records are keyed by original user ID or shadow user ID.
5. Make session revocation and rotation atomic; check affected-row counts.
6. Restrict or remove debug endpoints from production.
7. Review production flags that select brand DB versus default DB; brand data should not silently fall back to another database.
8. Reduce auth-related logs and sanitize client error responses.

### Files reviewed in this pass

- [`refresh/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/refresh/route.ts?utm_source=chatgpt.com)
- [`logout/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/logout/route.ts?utm_source=chatgpt.com)
- [`logout-all/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/logout-all/route.ts?utm_source=chatgpt.com)
- [`sessions/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/sessions/route.ts?utm_source=chatgpt.com)
- [`sessions/[sessionId]/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/sessions/%5BsessionId%5D/route.ts?utm_source=chatgpt.com)
- [`reset-password/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/reset-password/route.ts?utm_source=chatgpt.com)
- [`forgot-password/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/forgot-password/route.ts?utm_source=chatgpt.com)
- [`signup/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/signup/route.ts?utm_source=chatgpt.com)
- [`login/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/login/route.ts?utm_source=chatgpt.com)
- [`verify-email/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/verify-email/route.ts?utm_source=chatgpt.com)
- [`resend-verification/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/resend-verification/route.ts?utm_source=chatgpt.com)
- [`profile/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/profile/route.ts?utm_source=chatgpt.com)
- [`heartbeat/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/heartbeat/route.ts?utm_source=chatgpt.com)
- [`global-logout.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/global-logout.service.ts?utm_source=chatgpt.com)
- [`token.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/token.repository.ts?utm_source=chatgpt.com)
- [`users.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-people/src/schema/users.ts?utm_source=chatgpt.com)
- [`platform-access.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-people/src/schema/platform-access.ts?utm_source=chatgpt.com)
- [`token-families.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-people/src/schema/token-families.ts?utm_source=chatgpt.com)
- [`sso-sessions.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-people/src/schema/sso-sessions.ts?utm_source=chatgpt.com)

I have not modified the repository. The next pass should continue with the database schema and migrations for the brand auth tables, refresh-token storage, reset/verification tokens, and identity-bridge constraints, then cross-check the findings against the relevant tests.

## Phase 3.5 — Brand database schemas and migrations

This pass checks the schema definitions and migration history against the auth/session behavior already reviewed. The important architectural distinction is that the brand databases own their local user/session records, while `people_prod` owns global identity and platform access. Those records need explicit mapping and lifecycle rules; matching column names alone do not guarantee the identities or sessions are interchangeable.

### Schema-level findings

| ID    | Severity | Finding                                                                                                                                                                                   | Why it matters                                                                                                                                                                                                                                                    |
| ----- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-01 | High     | Both RTH and SkillUp define `users.shadowUserId` as a nullable UUID without a unique constraint or foreign key to the global identity table.                                              | The schema does not prevent multiple local users from mapping to the same global identity, nor does it enforce that the referenced identity exists. A unique index and explicit integrity strategy should be considered.                                          |
| DB-02 | High     | The `user_profiles.userId` relationship is not unique in the current RTH/SkillUp Drizzle schema, even though the people DB migration creates a unique index for its profile relationship. | The `upsertOnboardingProfile()` code checks then inserts. Without a database uniqueness constraint, concurrent requests can create duplicate profiles.                                                                                                            |
| DB-03 | High     | Brand DB refresh tokens store the refresh token value in a `token` column with a unique constraint; the repository calls it a hash, but the schema does not enforce hashing.              | The persistence contract must be explicit. If raw bearer refresh tokens are stored, a DB read compromise exposes reusable credentials. If values are hashes, ensure the issuance path hashes consistently and never logs raw tokens.                              |
| DB-04 | High     | RTH and SkillUp refresh-token tables have no explicit token-family/reuse-detection linkage in the shown schema.                                                                           | The repository supports revocation, but the schema shown does not establish a rotation family or a way to mark a family compromised after reuse. The separate `people_prod.refresh_token_families` table does not automatically provide brand-session protection. |
| DB-05 | Medium   | Brand refresh-token rows have indexes for user/device/IP but no shown composite index for the common active-session query `(userId, revoked, expiresAt)`.                                 | Session listing and revocation checks may become less efficient as token history grows. This is a performance concern, not an authorization bypass by itself.                                                                                                     |
| DB-06 | Medium   | `platform_access` has a unique index on `(userId, platform)` that includes soft-deleted rows.                                                                                             | A deleted access grant may block a later re-grant unless the code revives the existing row or the uniqueness model is changed.                                                                                                                                    |
| DB-07 | Medium   | `people_prod.users` has a unique email constraint, while the `idx_users_email_platform` index is non-unique and partial on non-deleted rows.                                              | The global email uniqueness rule is stronger than platform-specific uniqueness. That may be intentional for a single global identity, but it must align with signup and account-linking policy across brands.                                                     |
| DB-08 | Medium   | `people_prod.users.platform` supports `realtutorialhub`, `skillup`, and `both`, but `externalBrand` is free-form text in the schema.                                                      | Runtime bridge validation is important; the database itself does not constrain `externalBrand` to the supported brand values.                                                                                                                                     |
| DB-09 | Medium   | The RTH and SkillUp schemas are near-duplicates, including auth/session tables.                                                                                                           | This creates migration drift risk: a security fix or constraint can be applied to one brand but missed in the other. The two migrations should be compared and tested as a paired change.                                                                         |

### Migration-history observation

The RTH and SkillUp device-tracking migrations use `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, which makes those specific additions more tolerant of repeated application. However, the repository contains multiple migrations with the same numeric prefix (`0001`) in each brand package. That may be valid under the migration runner’s naming/ordering scheme, but it should be confirmed against the actual Drizzle migration journal and deployed history; filenames alone do not establish whether production applied them in the intended order.

The people DB migration creates the global identity and platform-access structures, but the brand schemas shown do not establish referential integrity from `shadowUserId` into `people_prod`. Because these are separate databases, ordinary cross-database foreign keys are generally unavailable; the bridge must therefore own reconciliation, and the app must not treat a nullable mapping as proof of a valid identity.

## Phase 3.6 — Identity bridge behavior and auth test coverage

I compared the identity bridge implementation with its tests and the relevant repository tests. The tests provide useful baseline coverage, but they mostly prove the happy path and a small set of validation branches. They do not currently establish several important security and consistency guarantees.

### Additional findings

| ID     | Severity | Finding                                                                                                                                                                                                  | Evidence / impact                                                                                                                                                                                                                                                          |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDB-01 | High     | `syncUser()` performs global-user creation and platform-access insertion as separate database operations.                                                                                                | If the first insert succeeds and the access grant fails, the shadow user exists without its platform access. There is no transaction or repair step in this method.                                                                                                        |
| IDB-02 | High     | `syncUser()` uses a read-then-insert sequence.                                                                                                                                                           | Concurrent sync calls for the same external identity can both observe no row. The unique index on `(externalId, platform)` should stop duplicate rows, but one caller can fail rather than receive the existing shadow identity. Handle uniqueness conflicts idempotently. |
| IDB-03 | High     | The bridge checks `externalBrand === platform`, but the allowed values include `skillhubcore` while the global `platform` enum and migration history shown support only `realtutorialhub` and `skillup`. | A typed value can pass the bridge’s equality check but still fail at the database boundary. The supported platform contract needs to be consistent across TypeScript, Drizzle enums, and migrations.                                                                       |
| IDB-04 | High     | `grantPlatformAccess()` checks for an existing grant without filtering `deletedAt`.                                                                                                                      | A soft-deleted grant is treated as “already granted,” so the method returns without restoring access. This is a potential account reactivation/access restoration defect.                                                                                                  |
| IDB-05 | Medium   | The bridge updates the shadow user’s email whenever an existing external identity is synchronized.                                                                                                       | This assumes the brand database’s email is authoritative and current. If email changes are not verified upstream, a synchronization can overwrite the global account email. The trust source and verification rule should be explicit.                                     |
| IDB-06 | Medium   | `updateShadowUserId()` updates the brand user by ID and does not check the affected-row count.                                                                                                           | A stale or incorrect brand user ID can result in no link being established while the method completes without a meaningful success check.                                                                                                                                  |
| IDB-07 | Medium   | The bridge logs `externalId`, `shadowUserId`, and brand/platform identifiers.                                                                                                                            | These are sensitive identity-linking identifiers. Logging should be minimized, access-controlled, and consistently redacted where full values are not operationally required.                                                                                              |

### What the tests actually assert

- `bridge.service.test.ts` covers: creating a shadow user, reusing an existing shadow user, rejecting mismatched `externalBrand`/`platform`, and returning an ID or `null` from `getShadowUserId()`.
- It does not cover: a platform-access insert failure after user creation, concurrent duplicate sync, unique-constraint conflict recovery, soft-deleted access regrant, invalid platform values at runtime, or stale brand-user linkage.
- `token.repository.test.ts` checks that repository methods are called and resolve. It does not assert the actual query predicates for owner-scoped revocation, atomic “revoke all except current,” or row-count handling.
- `auth.refresh.edge.test.ts` checks invalid-token and missing-hash failure cases, but does not demonstrate concurrent refresh replay, failure between revocation and replacement-token persistence, or a compromised-family response.
- `session.service.test.ts` checks that create/revoke/cleanup methods call the DB. It does not assert that the correct user/session ownership conditions are applied.
- The tests are source evidence of test intent, not evidence that the current repository test suite was executed in this review.

The key concern is not simply missing tests: several uncovered cases correspond to implementation paths where operations are split across calls or do not scope the database predicate tightly enough. Those need design fixes and then regression tests.

## Phase 3.7 — Migration consistency and deployment safety

The full brand migration sequence reveals a more concrete issue than the duplicate numeric prefixes alone.

### DB-10 — Duplicate onboarding column migrations

Severity: High — migration-order dependent

Both RTH and SkillUp have two migration files that add the same onboarding columns to `users`:

- RTH: `0001_unusual_dexter_bennett.sql` and `0002_add_onboarding_fields.sql`
- SkillUp: `0001_ambiguous_nighthawk.sql` and `0002_add_onboarding_fields.sql`

The first file adds `is_onboarded`, `primary_goal`, `domain`, `sub_domain`, `time_commitment`, and `journey_status`. The second adds those same columns again, without `IF NOT EXISTS`.

If both migrations are applied sequentially to a database that has not already been reconciled, the later migration should fail with a duplicate-column error. I cannot establish from the repository alone whether production migration history has already been manually reconciled or whether these files are skipped by a custom migration process.

Architectural action: Compare the deployed migration journal and actual database schema with the repository’s migration sequence before applying further migrations. Do not blindly rerun or delete migration files.

### DB-11 — Auth-related schema constraints are uneven

Severity: High

The initial RTH and SkillUp migrations create the following:

- Unique user email.
- Unique refresh token value.
- Unique verification token and password-reset token.
- Foreign keys from refresh tokens, sessions, reset tokens, verification tokens, profiles, and user roles to local users.

Those are useful baseline constraints. However, the current schema does not show equivalent constraints for every operation performed by the auth services. In particular, profile uniqueness and the identity bridge’s brand-to-global mapping are not enforced at the brand DB boundary.

### DB-12 — Migration parity must be verified, not assumed

Severity: Medium

The RTH and SkillUp initial schemas are nearly identical, but their defaults differ in places such as `login_attempts.brand`. The migration history also contains separate filenames and sequences.

This means parity is not guaranteed by architecture. A security fix to refresh-token storage, user mapping, profile constraints, or auth-related indexes should be checked against both brands’ migration histories and resulting schemas.

### Migration review conclusion

I would classify the duplicate onboarding migration as a deployment blocker until the migration journal and deployed schemas are reconciled. It is not enough to note that the TypeScript schema currently declares those fields: the migration history is what determines whether a fresh or partially migrated database can reach that schema safely.

The next review pass should inspect the auth route test cases and migration metadata more closely, then consolidate the confirmed findings into a prioritized remediation register. I have not modified the repository or applied any migration.

## Phase 3.8 — Migration journal correction and auth regression-test audit

I checked the actual Drizzle migration journals, rather than relying only on the SQL filenames. This changes the interpretation of the duplicate onboarding migrations from the prior pass.

### Important correction: duplicate onboarding migrations

The RTH and SkillUp migration journals currently list:

- Initial schema migration (`0000`)
- Onboarding migration (`0001`)

They do not list `0002_add_onboarding_fields.sql` or `0003_add_expert_to_adaptive_level.sql`.

So I cannot say the duplicate `0002` migration is part of the tracked Drizzle migration sequence. The more precise concern is:

- The tracked `0001` migration already adds the onboarding fields to `users`.
- The untracked `0002_add_onboarding_fields.sql` repeats those `users` additions and additionally adds onboarding fields to `user_profiles`.
- If someone applies `0002` manually after the journal-tracked `0001`, its repeated `users` additions can fail.
- The `user_profiles` additions in `0002` are not represented by the current journal entries shown.

Revised risk: migration drift / unsafe manual migration, not an established failure in the tracked Drizzle sequence. Production state still requires comparison against the deployed migration journal and schema.### RBAC and session repository: direct source confirmation

The source confirms two especially important defects previously flagged.

#### API-35 — `revokeOtherSessions()` does not exclude the current session in its first update

Severity: High

In `TokenRepository.revokeOtherSessions(userId, currentTokenHash)`:

1. The first update selects active refresh tokens for the user.
2. The intended `token != currentTokenHash` condition is only a comment; it is not included in the query.
3. A second update sets the current token’s `revoked` value back to `false`, filtered only by token hash.

This is not atomic. If the second update fails, the current session remains revoked. The second update also does not check user ID, expiration, or prior ownership in its predicate.

Recommendation: implement the “revoke every active token except current” predicate in a single database operation and scope it to the authenticated user.

#### API-36 — RBAC canonicalization can discard elevated roles

Severity: Critical if the mixed-role array is trusted as authorization input

The `canonicalizeRoles()` helper in `packages/auth/src/rbac/rbac.service.ts` does this:

```
if (roles.includes('user' as Role) || roles.includes('student' as any)) {
  return ['student' as Role];
}
```

Consequently, an input such as `['student', 'admin']` is reduced to `['student']`. The same applies to `['student', 'faculty']` and `['user', 'super_admin']`.

This is a privilege-loss defect rather than a privilege escalation: a legitimate multi-role user can be denied permissions they should have. It is still serious because it makes authorization behavior depend on role-array composition and can produce inconsistent results across services.

The separate `normalizeRoles()` helper preserves allowed roles, but the RBAC service does not use it. The project therefore has multiple normalization policies.

Recommendation: establish one canonical role normalizer and use it consistently at token parsing, gateway headers, auth context, and permission evaluation. Add actual mixed-role tests.

#### API-37 — RBAC tests labelled “multi-role” do not test multi-role behavior

Severity: High — regression coverage gap

The tests in `packages/auth/src/rbac/__tests__/rbac.service.test.ts` repeatedly label cases “multi-role,” but the fixture is only:

```
const roles = ['student'] as const;
```

The ownership RBAC tests also have a “multi-role” case using only `['student']`.

These tests do not detect the mixed-role canonicalization behavior above. A proper regression matrix should include:

- `['student', 'admin']`
- `['student', 'faculty']`
- `['user', 'super_admin']`
- `['admin', 'faculty']`
- unknown role combined with a valid elevated role
- empty roles and invalid-only roles

The test names currently overstate what their fixtures prove.

### API-38 — Refresh rotation has a concurrency race

Severity: High

`TokenRefreshService.refresh()` performs these operations separately:

1. Find the existing refresh token.
2. Update `lastUsedAt`.
3. Revoke the old token.
4. Verify the old token’s JWT.
5. Generate replacement tokens.
6. Persist the replacement refresh token.

Two concurrent refresh requests can both find the old token active before either revokes it. Both can then proceed to issue replacement credentials. There is no atomic “revoke only if still active” condition with affected-row verification.

Recommendation: use a transaction or compare-and-swap update, require exactly one successful revocation, and treat a second attempt as replay. Consider family-level revocation for detected reuse.

### API-39 — Revoked-token reuse is not clearly detected as a distinct security event

Severity: High — replay detection gap

`TokenRepository.findByHash()` filters for `revoked = false`. As a result, when `TokenRefreshService.refresh()` checks for a missing session before checking `existingSession.revoked`, a previously revoked token is returned as not found. The later explicit revoked-token branch cannot identify it.

The current code rejects the token, which is good, but it does not establish a reliable distinction between:

- unknown token,
- revoked token replay,
- previously rotated token replay.

This matters if the desired response is to revoke a token family or raise a high-confidence replay alert.

### API-40 — Replacement access tokens are created with empty email and roles

Severity: High — correctness and authorization consistency

The refresh flow calls `generateAccessToken()` with:

```
email: '',
roles: [],
```

The nearby comments say these values will be populated from the user record “if needed,” but this function does not load the record or populate them.

This means the refreshed access token can have a different authorization/profile claim set from the original access token. Depending on downstream checks, this can cause permission loss or inconsistent behavior between login and refresh.

Recommendation: load the canonical current user and role state before minting a replacement access token. Do not blindly copy stale roles from an old token either; use the authoritative current role source.

### API-41 — Password reset does not revoke active sessions in the reviewed service

Severity: High

`PasswordRecoveryService.resetPassword()`:

1. Validates the reset token.
2. Hashes the new password.
3. Updates the user password.
4. Deletes the reset token.
5. Audits completion.

It does not call `revokeAll()`, `revokeRefreshTokens()`, or a global logout service in the reviewed implementation.

A password reset should normally invalidate active refresh sessions, particularly when reset may be the result of account recovery after suspected compromise. The route or another caller could potentially do this elsewhere, but that was not established by this service’s code.

### API-42 — Cookie configuration permits cross-site credential sending

Severity: Medium / configuration-dependent

`buildAuthCookie()` sets:

- `httpOnly: true`
- `secure: true`
- `sameSite: 'none'`
- `path: '/'`

`HttpOnly` and `Secure` are positive protections. However, `SameSite=None` allows the browser to send the cookie in cross-site contexts. That can be necessary for a cross-domain application architecture, but it increases the importance of CSRF defenses, strict CORS origin validation, and route-level CSRF enforcement.

The cookie security tests check hostname/domain spoofing well, but they do not establish that all state-changing routes are protected against cross-site requests.

### API-43 — Cookie-domain configuration can be overridden without validation at creation time

Severity: Medium

`getCookieDomain()` returns the environment-provided cookie domain or a fallback. `validateCookieDomain()` separately validates a hostname against the resolved brand, but `buildAuthCookie()` itself does not call that validation function.

This means cookie creation and hostname validation are separate operations. The codebase needs to prove that every cookie-creation path validates the request hostname and that production environment values are checked at startup. The fallback domain values are not inherently unsafe, but a bad override could set cookies for an unintended domain.

### API-44 — Login lockout counter is read-modify-write, not atomic

Severity: Medium

`SecurityService.trackLoginAttempt()` reads an existing attempt count, calculates `existing.attempts + 1`, and updates the row. Concurrent failed logins can race and overwrite each other’s increments.

The service has progressive lockout thresholds, but this sequence does not guarantee the attempt count is exact under concurrency. It also keys attempts by user ID, IP, and brand; the application should separately ensure an IP-level control exists to reduce abuse across many account names.

### API-45 — Performance logging in password operations is unnecessary auth telemetry

Severity: Low / privacy and operational hygiene

`PasswordService.hash()` and `compare()` log bcrypt operation duration and salt rounds. These logs do not include the password or hash, which is positive. However, routine per-authentication performance logs can become noisy and expose usage patterns. Prefer sampled metrics or structured performance telemetry with controlled retention.

## Review checkpoint

The latest source checks reinforce these top remediation priorities:

1. Fix role canonicalization so a student role cannot erase elevated roles from a mixed-role array.
2. Fix session ownership predicates and atomic revocation, including `revokeOtherSessions()`.
3. Make refresh rotation atomic and recover correctly from replay/concurrent refresh.
4. Populate refreshed access-token claims from authoritative current identity/role data.
5. Revoke active sessions after password reset.
6. Make the identity bridge transactional or explicitly idempotent with recovery paths.
7. Reconcile migration journals with actual deployed schema, especially the untracked onboarding migration.
8. Add genuine mixed-role and adversarial session tests; current test names claim coverage that their fixtures do not provide.

I have continued the review against the repository’s source and tests, not performed live penetration testing or modified any code. The next useful step is a focused review of auth middleware call paths and protected route handlers to determine where these service-level defects are actually reachable, and where another guard may already mitigate them.

## Phase 4 — Route-handler review: session and account recovery paths

I’m now tracing the previously identified service-level issues through the actual HTTP handlers. This is important: a service defect is a confirmed exploitable route issue only if the handler exposes the path and no additional control mitigates it.

### ROUTE-01 — Refresh route silently maps `skillhubcore` to RTH cookies

Severity: High / cross-brand correctness risk

In `/api/auth/refresh`, the request brand is resolved, then this mapping is applied:

```
const cookieBrand: CookieBrand =
  requestBrand === 'skillup' ? 'skillup' : 'realtutorialhub';
```

Every brand other than `skillup` becomes `realtutorialhub`, including `skillhubcore`. The service receives the original `requestBrand`, but the cookies are then written using the coerced brand.

The route also handles infra tokens separately, so this concern is specifically the brand-scoped user/admin cookie path.

Recommendation: use an explicit exhaustive mapping. Reject unsupported brands rather than silently converting them. If SkillHubCore auth is intended to be separate, give it a deliberate cookie/session policy.

### ROUTE-02 — Logout derives brand using substring matching

Severity: Medium

The logout handler determines brand with:

```
requestHostname.includes('skillup')
```

This is not the canonical brand resolver used elsewhere. Hostname substring checks are fragile and can misclassify unexpected hostnames. The handler also only models `skillup` and `realtutorialhub` in this expression, while the project supports a `skillhubcore` brand.

Recommendation: use the canonical hostname-to-brand resolver and reject unresolved or unsupported brands for token revocation. Cookie clearing should still be attempted safely.

### ROUTE-03 — Logout-all has two implementations with different user identity assumptions

Severity: High / requires identity-model verification

`/api/auth/logout-all` uses `AuthMiddleware.requireValidSession()` and passes `user.id` to the session service. `/api/auth/sessions` uses the verified token’s `payload.userId` and passes it to `GlobalLogoutService`.

The code comments identify `payload.userId` as the original ID in one route, while the project also has shadow/original identity fields. The two paths should be checked against the actual refresh-token `userId` persistence convention. If the IDs differ, logout-all can revoke a different or incomplete set of sessions.

Recommendation: establish one canonical session-owner ID in the verified auth context and use it consistently across every logout/session endpoint.

### ROUTE-04 — Session list/revoke endpoints use roles directly from the JWT

Severity: High / authorization freshness concern

The session endpoints verify the access token and then normalize the token’s roles locally:

```
(Array.isArray(payload.roles) ? payload.roles : [])
  .map(r => r.toLowerCase().trim())
  .filter(...)
```

This route-local normalization does not use the shared `normalizeRoles()` helper. It also does not reload current roles or account state from the authoritative brand database before authorizing session operations.

If role removal, account suspension, or admin demotion is expected to take effect immediately, a still-valid JWT can preserve stale role claims until expiration unless a separate revocation/session check runs.

Recommendation: define the freshness guarantee explicitly. For high-impact operations, use current authoritative role/account status or a revocation/version mechanism. Avoid each route implementing its own role parser.

### ROUTE-05 — `/api/auth/me` explicitly fails open when session validation errors

Severity: High — confirmed in this handler

The `/api/auth/me` route verifies the access token and attempts to check the refresh-token session. But the session check is wrapped in:

```
} catch (tokenCheckError) {
  console.error('[ME_DEBUG] Token revocation check failed:', tokenCheckError);
  // Continue with normal flow if token check fails (graceful degradation)
}
```

This is more than a hypothetical service concern: a database/repository error in this revocation check does not deny the request. The handler continues to load the user and can return authenticated user state.

Recommendation: if session revocation is a security control, database/session-check failure must fail closed for this route. If availability requirements demand graceful degradation, explicitly define a short-lived fallback policy and alert on its use rather than silently bypassing revocation.

### ROUTE-06 — `/api/auth/me` fallback accepts any active refresh session for the user

Severity: High — session binding weakness

When the refresh cookie is missing, the route checks whether the user has any active refresh tokens:

```
const activeTokens = await brandTokenRepo.getUserSessions(sessionUserId);
if (activeTokens.length === 0) {
  return ...401;
}
```

This does not bind the presented access token to the refresh session that issued it. An access token whose associated refresh session was revoked could potentially remain accepted if another active refresh session exists for that same user.

Recommendation: either require the matching refresh token for session-bound `/me` access, or use an explicit access-token session identifier (`sid`) and validate that exact session. Avoid substituting “some active session for this user” for “this token’s session is active.”

### ROUTE-07 — `/api/auth/me` performs useful account-state checks, but after a bypassable session check

Severity: High — combined control gap

The route does load the user from a brand-specific repository and rejects a blocked account. That is a valuable defense. However, because the session-validation failure path continues, the user lookup and blocked-account check do not repair the lost revocation guarantee.

The handler also logs user ID, email, account-block status, role summaries, token/session identifiers, and diagnostic DB context at multiple points. Some are debug logs, but the source does not show a production-only guard around all of them.

Recommendation: keep the brand-scoped account-state checks, make session validation fail closed, and remove or tightly gate verbose identity/session diagnostics in production.

## Phase 5 — Middleware and admin-auth trust boundary

### MW-01 — `validateRequest()` can accept identity headers as trusted context after a shared-secret check

Severity: High, conditional on reachable call paths and secret protection

`internal-auth.middleware.ts` validates `x-internal-secret`, then constructs an auth context from `x-user-id`, `x-brand`, and `x-user-roles`. The secret check is a real control; the concern is that the identity and role headers become authoritative once it passes.

That model is safe only if:

- the secret is high-entropy, protected, and never exposed to untrusted callers;
- every internal caller authenticates the user before forwarding these claims;
- direct API access is actually blocked at the network/ingress layer;
- internal service calls cannot supply arbitrary role claims.

The implementation does not independently validate that the supplied user currently has those roles or belongs to that brand.

Recommendation: treat internal identity headers as signed/trusted assertions only within a tightly controlled service boundary. For sensitive actions, resolve user/brand/roles from authoritative data or use a verifiable short-lived service assertion with audience and issuer constraints.

### MW-02 — `blockDirectAccess()` is not a valid credential verifier by itself

Severity: High if used as the only direct-access gate

The helper allows a request when any of these are present:

- `x-internal-secret`
- `x-user-id`
- a cookie string containing `accessToken=`

It does not validate the internal secret, verify the JWT, or establish that the cookie is valid. This helper is therefore only a presence check; it must never be treated as authentication on its own.

Recommendation: replace the “any credential present” decision with actual validation, or remove the helper if the gateway-auth middleware is the canonical boundary. Verify its call sites before determining reachability.

### MW-03 — `getAuthContext()` has inconsistent role normalization and fallback behavior

Severity: High for authorization consistency

`auth-context.ts` has a separate `canonicalizeRoles()` implementation. If the internal/gateway context has no roles, it logs an error but falls through to JWT authentication rather than rejecting the original context immediately.

This creates two potentially different auth contexts for one request: trusted internal headers can be rejected as incomplete, but then a separate cookie JWT may be used. The behavior may be intentional for some endpoints, but it must be explicit and tested; otherwise it can create confusing identity precedence.

Additionally, this normalizer converts arrays containing `user` or `student` into only `student`, while retaining other roles only when neither appears. That repeats the multi-role privilege-loss issue in a different code path.

Recommendation: centralize identity source precedence and role normalization. If an internal identity assertion is present but malformed, reject it rather than silently switching identities.

### MW-04 — Admin login’s role check is present, but the joined user/role result needs deterministic handling

Severity: Medium

`AdminAuthService.login()` joins users, profiles, user-role links, and roles. It checks the resulting role names and only issues admin credentials if one of `admin`, `super_admin`, or `infrastructure` is present.

That is a positive authorization check. However, it selects `typedUsersWithRoles[0]` as the user row and uses `roleNames[0]` as the primary role. The query has no explicit ordering. Multiple role rows can make the first selected role nondeterministic, potentially changing the displayed primary role or user-profile value. The `isAdmin` decision is based on the full role set, so this is primarily consistency/UI/claim correctness rather than an observed bypass.

Recommendation: load the user record separately or aggregate role rows deterministically; ensure profile joins cannot cause duplicate user rows to affect identity selection.

### MW-05 — Admin login emits potentially sensitive account metadata in audit logs

Severity: Medium / privacy

The admin login service logs the raw email address in lockout, failed-credential, and access-violation audit metadata. This is not a password or token leak, but it increases exposure of account identifiers in audit systems and log exports.

Recommendation: use a stable keyed hash or masked identifier for routine security logs, retaining raw email only where there is a documented operational need and appropriate access/retention controls.

## Phase 6 — Admin authorization and CSRF enforcement

### MW-06 — `_verifyAdmin()` falls back to token claims when the brand user cannot be verified

Severity: High — confirmed fail-open behavior

The admin verifier checks whether the user exists in the brand database and whether the account is blocked. But:

- If the user is not found, it returns `isAdminInToken`.
- If the database query throws, it logs the failure and continues with token-based role evaluation.
- If the token already says admin, it returns `true` before performing the database role lookup.

This undermines the comment that admin actions “Always hit DB” and makes account existence/current role verification non-authoritative during failures.

Recommendation: fail closed when the user cannot be found or current authorization state cannot be verified. For high-impact admin operations, verify the current admin role and blocked status against the brand DB, or use a documented short-lived authorization cache with explicit invalidation.

### MW-07 — CSRF middleware trusts the mere presence of a Bearer header

Severity: High / conditional on route authentication and CORS behavior

In `csrfProtection()`, when the CSRF cookie/header pair does not match, the code checks:

```
if (authHeader !== null && authHeader.startsWith('Bearer ')) {
  return null;
}
```

It does not verify that the Bearer token is valid before skipping CSRF validation. This is not by itself an authentication bypass—the handler may still validate the token—but it means CSRF middleware is not independently enforcing a valid-authenticated-request condition.

Recommendation: do not make CSRF decisions based on header presence alone. Either validate the bearer credential in the middleware or require the CSRF token for cookie-authenticated mutations and let the route’s normal authentication independently validate bearer credentials.

### MW-08 — Auth route group is exempted from the proxy’s CSRF gate

Severity: High / requires route-by-route review

`apps/api-server/src/proxy.ts` defines `isAuthRoute` for `/api/auth`, `/api/admin/auth`, and `/api/shc/auth`. The CSRF protection branch runs only when `!isAuthRoute`.

Therefore, auth endpoints do not receive the proxy-level CSRF check. This can be appropriate for login/signup/verification flows, but it needs explicit per-route protections for cookie-authenticated state-changing operations such as logout, refresh, profile changes, and session revocation.

The route handlers do have other controls in places, but the proxy’s CSRF check does not cover this group.

Recommendation: classify each auth route by authentication method and mutation risk. Apply CSRF protections to cookie-authenticated state changes; exempt only endpoints where the exemption is justified and documented.

## Phase 7 — SkillHubCore admin authentication

### SHC-01 — SHC logout does not revoke credentials

Severity: High — confirmed in the service

`SHCAuthService.login()` issues access and refresh tokens but explicitly does not persist the refresh token. `SHCAuthService.logout()` only writes an audit event; the code comment says token revocation is not implemented and tokens expire naturally.

The logout route returns a success response even when the service fails. Clearing a browser cookie is useful, but it does not invalidate a copied token.

Recommendation: persist SHC sessions in the identity/session store and revoke them on logout. If token revocation is not implemented, the UI and API should not imply that server-side logout invalidates stolen credentials.

### SHC-02 — SHC `/me` reports inactive accounts rather than rejecting them

Severity: High / depends on how `/me` is used downstream

The SHC route verifies the token’s `brand` and `aud`, then calls `SHCAuthService.me()`. The service queries a non-deleted `skillhubcore` user but returns `isActive` without rejecting `false`. The route returns that user payload with `isAdmin: true`.

Login checks `isActive`, but the subsequent `/me` request does not enforce it. Thus, a user deactivated after login may still receive a successful `/me` response while their token remains valid.

Recommendation: make current account status an authorization condition in `/me` and other protected SHC endpoints. Also enforce session/token revocation after deactivation.

### SHC-03 — SHC login returns access and refresh tokens in the JSON response

Severity: Medium / architecture-dependent

Unlike the standard auth routes, `/api/shc/auth/login` returns both tokens in its response body and comments that the SHC admin app proxy will set cookies.

This is not automatically a vulnerability if the proxy is trusted and does not expose the response body to browser JavaScript. But the API response itself is bearer-credential material, so proxy handling, logs, cache behavior, and browser exposure must be verified.

Recommendation: ensure the proxy never logs or caches this response and that tokens are not exposed to client-side JavaScript. Prefer an HttpOnly-cookie session boundary where feasible.

## Review continuation — current checkpoint

I’ve now reviewed the primary auth handlers, auth context, proxy middleware, admin authorization helper, and the SkillHubCore-specific auth flow. I’m keeping the review read-only.

### Additional confirmed finding

AUTH-46 — Login debug logging records sensitive identity and device metadata. Severity: Medium / privacy

The standard login handler and `LoginService` log email, IP, user agent, device ID/name, user IDs, account state, and token-claim summaries. They do not log the raw password or full token in the snippets reviewed, which is good. Still, these logs can be highly identifying and may persist in production log systems.

Relevant source:

- [Login route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/auth/login/route.ts?utm_source=chatgpt.com)
- [Login service](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/login.service.ts?utm_source=chatgpt.com)

Recommendation: retain security-relevant signals, but mask or hash identity fields, avoid routine device/IP detail in general application logs, and ensure token-claim logging is disabled in production.

### What remains for the next pass

The repository has a substantial auth test suite, including dedicated tests for token audiences, refresh flows, CSRF, sessions, gateway auth, and brand validation. I have not executed those tests. The next pass should inspect the route-level and middleware tests against the confirmed issues above—especially:

- `/api/auth/me` session validation failure and session binding;
- role normalization with mixed-role arrays;
- refresh replay and concurrent rotation;
- session revocation owner predicates;
- admin verifier behavior when the brand DB is unavailable;
- SHC logout/deactivation behavior;
- CSRF exemptions and Bearer-header handling.

I’ll continue checking the implementation and its tests rather than treating test filenames or comments as proof that a control works.

## Phase 8 — Test-source review: important security tests that encode the wrong expected behavior

I reviewed the test source files themselves, not just their names. Several tests expose a serious issue: they currently assert that fail-open behavior is acceptable.

### TEST-01 — Admin RBAC test explicitly expects a missing database user to be authorized

Severity: High — test expectation conflicts with fail-closed authorization

In `apps/api-server/src/modules/auth/__tests__/rbac.service.test.ts`, the test named `returns false when user record is missing` mocks an empty user query, but then asserts:

```
expect(ok).toBe(true);
```

That expectation conflicts with the test name and with the intended security property. A token claiming admin should not be sufficient when the user record is absent.

The same test file also asserts `true` when the blocked-check database query throws, for token roles `SUPER_ADMIN` or `admin`.

Recommendation: change these expected outcomes to denial, then add separate cases for database errors, missing users, blocked users, and current-role removal. These are test-source observations; I have not executed the suite.

Source: [RBAC service tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/__tests__/rbac.service.test.ts?utm_source=chatgpt.com)

### TEST-02 — ILS auth test acknowledges that gateway-mode identity headers can be accepted without the internal secret

Severity: High / deployment-boundary dependent

The ILS authentication test includes a comment that the middleware has a gateway-mode fallback accepting identity headers without the internal secret. Its forged-user test only asserts that the response status is `>= 400`; it does not assert that the specific authentication layer rejected the request or that no service was reached.

That is weaker than the test’s introductory claim that forged identity headers are rejected. Other test cases do verify service short-circuiting for invalid secrets, which is useful, but this gateway-mode branch remains insufficiently constrained by the test.

Recommendation: if gateway mode is meant to be trusted, test that it is only reachable through the trusted gateway/ingress path and that the gateway strips caller-supplied identity headers before adding its own. If the API can be reached directly, identity-only fallback should be denied.

Source: [ILS authentication security tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/tutorial/ils/__tests__/authentication.security.test.ts?utm_source=chatgpt.com)

### TEST-03 — Refresh tests cover success and rejection, but not replay/race safety

Severity: High coverage gap

The refresh tests I inspected establish ordinary success, invalid-token rejection, blocked-user rejection, and audience mismatch. The success test verifies that the old token row is revoked. But the reviewed tests do not exercise two concurrent refresh requests using the same token, a replay after rotation, or a failure between revoking the old token and storing the replacement.

Those cases matter because refresh rotation is performed across separate persistence operations. A test that only observes `revokeById()` being called does not establish atomic rotation or replay detection.

Recommendation: add concurrency and partial-failure tests against the actual transaction/locking behavior. The intended invariant should be: one refresh token can produce at most one successful successor, and detected reuse can revoke the affected token family where supported.

Sources:

- [Refresh branch test](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/__tests__/auth.refresh.branch.test.ts?utm_source=chatgpt.com)
- [Refresh edge test](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/__tests__/auth.refresh.edge.test.ts?utm_source=chatgpt.com)
- [Token refresh service coverage](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/__tests__/token-refresh.service.coverage.test.ts?utm_source=chatgpt.com)

### TEST-04 — Token repository tests verify calls, not ownership predicates

Severity: High coverage gap

`token.repository.test.ts` checks that `revokeById()`, `revokeAll()`, and related methods are invoked. The mocks do not inspect the actual `where` expressions for session owner, token ID, revoked state, or brand scope.

This means the test suite can pass even if a revocation query is missing an ownership predicate. That is especially relevant to the session-ID revocation concern found earlier.

Recommendation: assert query predicates or, preferably, add integration tests with two users’ sessions and prove one user cannot revoke the other’s session by ID.

Source: [Token repository tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/__tests__/token.repository.test.ts?utm_source=chatgpt.com)

## Phase 9 — Source review of refresh rotation and session repository

This pass confirms several of the earlier concerns directly in the implementation. The important point is that these are not merely missing tests: the code has specific ordering and query-predicate defects.

### AUTH-47 — Refresh rotation is non-atomic and can strand a valid session

Severity: High

In `TokenRefreshService.refresh()`, the sequence is:

1. Find the old token.
2. Update its `lastUsedAt`.
3. Revoke the old token.
4. Verify the refresh JWT.
5. Generate new access and refresh tokens.
6. Hash and persist the new refresh token.

There is no transaction or atomic compare-and-set spanning these operations.

Two concurrent requests can both find the old token as active before either revokes it. Both can proceed to mint successors. Also, if verification, token generation, or persistence fails after step 3, the old token is already revoked and no replacement may exist.

Recommendation: make rotation an atomic operation. Validate the token, conditionally consume the active token, and create its successor within a transaction or equivalent atomic mechanism. Require the consume operation to affect exactly one row; a second concurrent request must fail.

Source: [TokenRefreshService](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/token-refresh.service.ts?utm_source=chatgpt.com)

### AUTH-48 — `findByHash()` filters revoked sessions out before the service checks revocation

Severity: Medium / replay detection gap

The repository query is:

```
where: and(
  eq(this.refreshTokensTable.token, tokenHash),
  eq(this.refreshTokensTable.revoked, false)
)
```

But `TokenRefreshService.refresh()` subsequently checks:

```
if (existingSession.revoked) {
  // ...
}
```

Because `findByHash()` only returns non-revoked rows, that `existingSession.revoked` branch cannot be reached through this repository method under normal query semantics. A revoked token appears as “not found,” not “revoked.”

That means the service cannot distinguish an unknown token from a known-but-reused token using this lookup, which weakens replay detection and incident response.

Recommendation: separate lookup from validity filtering. Retrieve by token hash, then explicitly evaluate revoked and expiry status. Treat replay of a previously revoked token as a distinct security event.

Source: [TokenRepository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/token.repository.ts?utm_source=chatgpt.com)

### AUTH-49 — `revokeOtherSessions()` revokes the current session too, then un-revokes by hash alone

Severity: High

The first update filters by user and active status, but does not exclude the current token hash. The code comment says the exclusion is simplified, and the SQL comparison is not actually present.

Then the second update sets `revoked: false` using only the token hash:

```
.where(eq(this.refreshTokensTable.token, currentTokenHash))
```

This second update is not scoped to the user and does not check expiry or ownership. A failure between the two updates can also leave the current session revoked.

Recommendation: use one properly scoped update that excludes the current token, or perform a transaction with explicit user + token predicates and verify affected-row counts. Do not “un-revoke” a token using only its hash.

Source: [TokenRepository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/token.repository.ts?utm_source=chatgpt.com)

### AUTH-50 — `revokeById()` is not user-scoped

Severity: High when used by the session-ID endpoint

The repository revokes by:

```
.where(eq(this.refreshTokensTable.id, id))
```

The route accepts a session ID and passes it to this method. The repository itself does not ensure the session belongs to the authenticated user.

This is consistent with the earlier route finding: a user who can submit another user’s session ID may be able to revoke that session. This is an availability/denial-of-service risk against another user’s session, not direct account takeover.

Recommendation: scope revocation by both session ID and authenticated owner ID, and confirm the update affected a row. Return a consistent response for nonexistent and non-owned sessions to avoid exposing session existence.

Source: [TokenRepository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/token.repository.ts?utm_source=chatgpt.com)

### AUTH-51 — IP mismatch is only logged; it does not block refresh

Severity: Medium / policy-dependent

`TokenRefreshService.refresh()` detects a changed IP, logs the event, and explicitly continues. The comment explains that mobile IPs change frequently.

This is not necessarily wrong: IP changes are a weak signal and blocking every change can harm legitimate users. However, the implementation calls this “Session Hijack Detection” while it does not impose a stronger challenge or revoke the session.

Recommendation: treat IP change as a risk signal, not a standalone identity proof. Consider combining it with device/session binding, refresh-token reuse detection, and step-up authentication for suspicious activity. Keep the policy explicit.

Source: [TokenRefreshService](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/token-refresh.service.ts?utm_source=chatgpt.com)

### AUTH-52 — The standalone `SessionService` is not brand-aware

Severity: Medium / verify usage

`SessionService` imports the default `db`, `sessions`, and `refreshTokens` tables and updates refresh tokens by user ID alone. It does not accept a brand-specific DB context, despite the multi-brand model.

If this service is used by brand-scoped logout or account operations, it may operate on the default database instead of the relevant brand database. The source reviewed here establishes the implementation, but I have not yet traced every call site to establish production reachability.

Recommendation: either make this service explicitly global-identity scoped or inject the correct brand DB/table context. Avoid ambiguous default-database behavior for multi-brand sessions.

Source: [SessionService](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/session.service.ts?utm_source=chatgpt.com)

## Current audit checkpoint

The review has now covered the auth request path, auth middleware, standard and SHC login/logout, role checks, refresh/session repositories, and selected test files.

The most consequential confirmed issues in this pass are:

1. Non-atomic refresh rotation — concurrent refreshes and partial failure can leave multiple successors or strand a session.
2. Broken “revoke other sessions” implementation — current session is included in the first update and restored by a hash-only update.
3. Session revocation missing owner scope — session-ID revocation can affect another user’s session if the route is reachable with an arbitrary ID.
4. Fail-open admin RBAC — test source explicitly expects authorization when the user is missing or the DB check fails.
5. SHC logout does not revoke tokens — SHC credentials expire naturally, and `/me` does not reject inactive users.

I have not executed tests, queried production databases, or verified deployed gateway/ingress configuration. The findings above are based on the repository source at `main`; reachability and deployment-level mitigations still need to be verified.

The next useful review slice is the remaining protected API route families—especially tutorial, workflow, telemetry, and security-report endpoints—checking each handler’s actual authentication, brand isolation, ownership predicates, and input validation against the middleware exemptions.

I’m continuing the source audit in the protected API route families, checking the handler itself—not assuming that gateway or middleware coverage automatically makes a route safe.

### Review slice: legacy tutorial content and progress

TUT-01 — High, conditional on route reachability: legacy handlers treat `X-User-ID` and `X-Brand` as identity.\
In `apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts` and `apps/api-server/src/app/api/tutorial/progress/route.ts`, `extractUserId()` reads `x-user-id` directly, while `extractBrand()` defaults an absent or unrecognized brand to `realtutorialhub`. These handlers do not locally call `validateRequest()` or verify a JWT. If a request can reach them without a trusted gateway-authenticated context, a caller could choose the user identity and potentially read or write another learner’s progress. The brand fallback also risks silently assigning a request to the RTH tenant. Remediation: use a verified auth context, reject missing/invalid brand instead of defaulting, and enforce ownership in the repository/service. I’ll trace route reachability and service predicates before treating the exploit path as confirmed.

TUT-02 — Medium: legacy content response is marked public-cacheable despite carrying user progress.\
The deprecated content handler returns `result.data` after passing `userId` into `TutorialService.getContent()`, then sets `Cache-Control: public, max-age=3600`. If that response contains user-specific progress or other personalized fields, a shared cache could serve one learner’s response to another. Remediation: use `private, no-store` for personalized responses, or separate/cache only the public content payload. The file is explicitly deprecated, so the safest course is to remove it after verifying no clients still depend on it.

TUT-03 — Medium: progress GET does not validate the `subtopicId` format at the route boundary.\
The POST schema requires a UUID, but GET only checks that the query parameter is present before calling `getProgress(userId, subtopicId)`. Whether this becomes an injection or data-access issue depends on repository query construction; at minimum, the endpoint has inconsistent input validation. Apply the same UUID validation and return `400` for invalid input.

The ILS `block-visit` handler is better structured: it calls `validateRequest(...requireInternalSecret: true)` before trusting the user/brand context and validates the body with a schema. I’m checking its sibling handlers and service-level ownership/tenant predicates next.

### ILS route-family review

The ILS handlers reviewed so far consistently require the internal secret and build the service identity from the validated context. The `complete-node` handler also does not accept client-supplied `requiredBlocks`; the service resolves canonical completion requirements. Those are sound boundary choices in the inspected route code.

ILS-01 — High, if gateway-mode requests can reach ILS without a trusted ingress: test coverage does not prove the forged-identity boundary.\
`authentication.security.test.ts` has a “Forged User ID” test whose assertion is only `response.status >= 400`; the test comment explicitly acknowledges gateway-mode fallback behavior. That status could result from downstream validation rather than authentication rejecting the forged identity. The stronger missing assertion is: forged headers are rejected by the auth boundary and the service is never invoked. The other tests that assert `401` and zero service instances are useful, but they do not replace a route/ingress test proving the gateway strips caller-supplied identity headers and that direct API access is blocked.

ILS-02 — Medium: session attribution is partly client-controlled.\
Several handlers take `x-session-id` directly, while `visit`/`block-visit` also accept `sessionId` in the body. The schema validates its shape, not that it belongs to the authenticated user or matches the current auth session. This is primarily a telemetry integrity and attribution concern based on the code inspected—not evidence of account takeover. Prefer deriving the auth session ID server-side; if a distinct learning-session ID is intentional, define it separately and enforce its allowed format and ownership semantics.

ILS-03 — Medium: completion and telemetry event inputs are structurally validated, but require canonical-resource checks in the service.\
The schemas validate UUIDs, text lengths, and time limits, but `blockId`, `blockVersion`, `sectionId`, and `navigationNodeId` are supplied by the client. The service’s hierarchy/content validation is therefore essential. I’m checking those service and repository predicates before concluding whether mismatched block identity or cross-brand records can be written.

I also noticed that the internal-auth middleware logs raw role-header values and secret previews/comparison prefixes. That is a previously identified sensitive-log issue, and it applies to these ILS calls too. I’m not counting it as a new finding here.

### Faculty tutorial API review

FAC-01 — High, conditional on gateway header provenance: faculty authorization starts from `X-Shadow-User-ID`.\
`apps/api-server/src/lib/request-auth.ts` returns the `x-shadow-user-id` header as the effective user ID; `resolveFacultyAccess()` then looks up that ID and checks the user role and active faculty row. The DB-side faculty/role check is valuable, but the helper itself does not verify a token or internal secret. Its safety depends on the gateway reliably authenticating the caller, stripping any incoming `X-Shadow-User-ID`, and injecting the verified value. I need to confirm that ingress/header contract before marking this as an exploitable bypass.

FAC-02 — High, conditional: student-facing faculty data is scoped to the faculty’s active batch roster, but brand partitioning is not visible in the inspected queries.\
`getFacultyStudentIds()` joins active enrollments to batches by `facultyId`; review queues, help requests, live-session updates, and project decisions then filter by those student IDs. This is a good ownership pattern for faculty-to-student access. However, the reviewed tables/queries do not show a brand predicate. In a shared database serving both RTH and SkillUp, the brand boundary must be guaranteed by the data model or added to these queries; otherwise faculty assignments and learner records could cross brand partitions.

FAC-03 — Medium: faculty assignment listing is not scoped to the faculty’s students or a faculty-owned assignment set.\
`loadFacultyAssignments()` selects the latest 50 non-deleted `tutorialAssignments` without a brand, faculty, or batch filter. This may be intentional if assignments are globally shared curriculum, but the route presents it as a faculty assignment view. Confirm the product/data ownership model; if assignments are tenant- or faculty-specific, the query needs that scope.

The faculty mutation handlers I inspected call a shared helper and constrain target student IDs to the faculty’s active batch roster before updating a help request, project submission, or live-session request. I’m continuing into the remaining API families and shared authorization helpers rather than inferring broader coverage from these routes alone.

### Legacy tutorial interaction APIs

These handlers use a separate, older pattern from the newer ILS endpoints. Their shared `getAuthenticatedUserId()` helper reads `X-User-ID` directly; it does not itself verify authentication. So these routes share the same conditional identity-header trust issue as the legacy progress endpoints.

INT-01 — High: quiz and practice correctness is client-determined.\
In both `tutorial/interactions/quiz/route.ts` and `tutorial/interactions/practice/route.ts`, the handler accepts `selectedAnswer` and `correctAnswer` from the request body, then computes:

```
const isCorrect = selectedAnswer === correctAnswer;
```

That means a caller can submit matching values and obtain a “correct” result without the server resolving the answer from trusted question data. If these stored results influence grades, mastery, progression, or reporting, this is an assessment-integrity flaw. Fix: accept only the selected answer and question identity; resolve the correct answer server-side, and validate that the question belongs to the requested section/subtopic.

INT-02 — High, conditional on identity-header provenance: interaction records are user-scoped only by the supplied header.\
The POST and GET handlers use the `X-User-ID` returned by the helper to insert and query code, visual, quiz, practice, and completion records. Without trusted gateway injection/stripping, this can become cross-user record creation or access. Confirm the gateway boundary; ideally these handlers should consume the same verified auth context as ILS.

INT-03 — Medium: section lookup is not visibly brand-scoped.\
`getTutorialSection(sectionId)` queries by section ID alone, and the interaction handlers then persist records against that section. The section ID may be globally unique, but the reviewed code does not establish tenant ownership. For a multi-brand deployment, validate the section’s brand against authenticated brand context before recording or returning interactions.

I’m also checking the assessment-report endpoints, because their authorization and data scoping determine whether client-controlled quiz results can affect higher-value records.

### Report and export authorization review

REPORT-01 — Critical: `/api/reports` has a hard-coded internal-key fallback.\
In `apps/api-server/src/app/api/reports/route.ts`, the internal secret is resolved as:

```
const internalSecret = process.env.INTERNAL_API_KEY ?? 'secret';
```

If `INTERNAL_API_KEY` is absent, the literal value becomes the accepted internal key. A caller who supplies `X-Internal-Key: secret` and a report ID enters the internal bypass path; that path looks up the exam owner and fetches the report without user-token authentication. This is a confirmed source-level fail-open, conditional only on the environment variable being unset. Fix immediately: remove the fallback, fail closed when the secret is missing, and preferably replace the shared-key bypass with a narrowly scoped service identity. Verify production configuration, but do not rely on configuration alone to justify a hard-coded fallback.

REPORT-02 — Positive control: report download checks ownership for user-token requests.\
`/api/reports/download` verifies the exam owner against the authenticated user before retrieving the stored artifact. Its internal-key fallback also requires a configured key rather than defaulting to a literal. This is a meaningful protection in the inspected code, though the service-key trust boundary still needs ingress and key-management review.

REPORT-03 — Medium: report-status artifact recovery has a broad state-repair side effect.\
`/api/report-status` can promote a report record to `ready` after finding a stored artifact, or mark a stale report `failed`. The handler does perform owner checks in the user path and checks storage existence before returning a ready URL. The concern is operational integrity: this is a read/poll endpoint that mutates shared report state. Consider separating reconciliation into a controlled worker, or make the state repair an explicit, concurrency-safe service operation.

I’m keeping the scope precise: the report download path’s ownership check is visible; I have not verified storage ACLs, signed-URL lifetime, or deployed environment values.

### Report-generation and operational endpoints: additional confirmed fail-open patterns

The same hard-coded internal-key fallback appears in another sensitive path:

REPORT-04 — Critical: `/api/generate-report` also accepts the literal fallback key.\
`apps/api-server/src/app/api/generate-report/route.ts` uses `process.env.INTERNAL_API_KEY ?? "secret"` for its internal bypass. When the environment variable is missing, `X-Internal-Key: secret` can enter the bypass branch. The handler does check the exam’s owner against the resolved `userId`, but the bypass resolves that `userId` from the exam itself—so it does not provide an independent caller identity. This can permit unauthenticated report generation for arbitrary known attempt IDs and consume compute/storage. Remove the fallback and fail closed.

OPS-01 — Critical: production cleanup cron has a literal-secret fallback.\
In `apps/api-server/src/app/api/cron/cleanup-reports/route.ts`, when `INTERNAL_API_KEY` is absent, the code treats `X-Internal-Key: secret` as internal authorization. The production guard rejects only when neither cron nor internal auth passes. That creates a source-level production fail-open if the key is unset. Remove the fallback; require a configured secret and use a constant-time comparison where appropriate.

These are separate routes, but the underlying remediation should be centralized: no privileged endpoint should invent a default credential when configuration is missing. Configuration absence must deny access, not grant a predictable key.

The `queue-report` route is safer in this particular respect: it explicitly returns a configuration error when `INTERNAL_API_KEY` is absent. That pattern should be applied consistently.

### Debug and cron endpoints: exposed diagnostics and another credential fallback

DEBUG-01 — High: `/api/debug/headers` is an unauthenticated header/auth-context disclosure endpoint.\
`apps/api-server/src/app/api/debug/headers/route.ts` calls `getAuthContext()` and returns the resolved user ID, brand, roles, auth source, plus every request header whose name begins with `x-`. There is no route-level authorization check in the file. If this route is reachable in production, it exposes identity and internal header metadata. Remove it from production or protect it with explicit admin authorization and strict header redaction.

DEBUG-02 — High: `/api/debug/login` exposes verbose authentication diagnostics.\
`apps/api-server/src/app/api/debug/login/route.ts` runs the actual `AuthService.login()` path and returns request metadata, email, resolved brand, IP, and on successful login user ID/email/admin status. On failure it returns error name/message and a partial stack. There is no explicit admin guard in the handler. This should not be deployed as a public route; remove it or replace it with non-sensitive, authenticated diagnostics that never return stack traces or identity details.

OPS-02 — Critical: `/api/cron/pdf-health` repeats the predictable internal-key fallback.\
`apps/api-server/src/app/api/cron/pdf-health/route.ts` accepts `X-Internal-Key: secret` when `INTERNAL_API_KEY` is unset, and production authorization is bypassed when `isInternal` is true. The handler then generates a PDF using a completed exam. This is another production fail-open and can be abused for compute consumption and access to diagnostic output. Apply the same fail-closed fix as the report cleanup cron.

I’m treating these as source findings; I have not tested whether the deployed gateway or Cloudflare layer blocks these paths independently.### Export trigger: client-supplied identity reaches a privileged job flow

EXPORT-01 — High: `/api/export/trigger` accepts `userId` from the request body without authenticating the caller.\
`apps/api-server/src/app/api/export/trigger/route.ts` validates only that `examId`, `userId`, and `format` are non-empty/allowed values. It then passes the supplied IDs to `ExportSaga.start()` or the export engine. There is no token verification or exam-owner check in this route.

The export engine fetches raw attempts by `examId` and historical attempts by the supplied `userId`; the saga creates a job under that same supplied user ID. So this is not merely an input-validation omission: the caller can initiate work against another user’s exam identity. The downstream download endpoint does check job/exam ownership, which limits direct retrieval, but it does not fix the unauthenticated job-trigger and resource-consumption boundary.

Fix: authenticate the caller, derive `userId` from the verified token, verify the exam belongs to that user before enqueueing, and validate the brand/platform binding. Do not accept an authoritative user ID from the body.

The inspected export download endpoint does require a user token and checks ownership for both job-based and exam-based downloads. That is a useful downstream control, but the trigger must independently enforce authorization.

### User analytics endpoints

I inspected the user analytics routes for score history, mastery trend, topic performance, difficulty accuracy, time boxplot, and weakness tree.

ANALYTICS-01 — Medium, conditional on the shared exam database and brand policy: analytics routes do not visibly enforce the token’s brand.\
These handlers authenticate a user token and derive `userId` from it, then query analytics through `exams.user_id`. That is a good self-scope pattern. Unlike the report routes reviewed earlier, however, these handlers do not call `validateBrandOrThrow()` or visibly constrain the exam rows to the token’s brand. If a globally shared identity can hold records in both brands, a token scoped to one brand may see combined cross-brand analytics for that same user. Confirm the intended identity/brand data model; if analytics are brand-separated, add a brand-scoped predicate or validate the brand binding at the API boundary.

Positive: the routes do not accept a caller-supplied `userId` for these queries, and their Redis keys include the authenticated user ID plus the analytic type. That reduces the risk of one user’s cached result being returned to another user under the inspected key construction.

I’m continuing with the admin analytics and general learner-facing endpoints, where the main checks are authorization level, user/brand ownership, and whether sensitive result fields are returned.

### Admin analytics endpoints

The inspected admin analytics handlers generally follow a stronger pattern than the legacy learner interaction routes: they verify an admin token, validate brand context, and check `PERMISSIONS.ANALYTICS_VIEW` before querying aggregate data.

ADMIN-ANALYTICS-01 — Medium, conditional on brand-specific reporting requirements: aggregate caches are global while requests are brand-validated.\
Several endpoints use fixed Redis keys such as `analytics:admin:discrimination` and `analytics:admin:item-difficulty`; others use `CACHE_KEYS.ANALYTICS.ADMIN(...)`. The SQL reads materialized views without a brand predicate. This is fine if these are intentionally platform-global aggregates and all authorized analytics viewers may see the same combined dataset. If reports are supposed to be brand-isolated, both the source query and cache key must be brand-scoped; validating the request brand alone does not partition the returned dataset.

No direct authorization bypass was apparent in the admin analytics handlers I inspected. I’m moving next to the broader API routes and will distinguish actual defects from design decisions that need confirmation against the multi-brand data policy.

### Attendance and tutor endpoints

ATTEND-01 — High: attendance write does not verify each submitted student belongs to the faculty’s roster.\
`apps/api-server/src/app/api/attendance/route.ts` authenticates faculty access and passes `batchId`/`sessionId` to `upsertFacultyAttendance()`. The helper validates that the faculty owns the batch and session by obtaining the roster, but then loops through `attendanceRecordsPayload` and upserts each supplied `studentId` without checking it against `roster.roster`.

A faculty member authorized for one batch/session could therefore submit another student’s ID and alter that student’s attendance record for the session. Fix: validate every submitted student ID against the authorized roster before writing, and preferably enforce batch membership in the write query itself. Reject the entire request if any ID is outside the roster.

The tutor help and notes request handlers I inspected derive `userId` from a verified user token rather than accepting it from the body. The notes viewer also checks that the authenticated user has a recommendation for the topic before issuing a signed link. The current notes view/download implementation appears incomplete (`notesPath`/`realPath` are empty/null), so I’m not treating its present behavior as a functioning file-access path.

### General content APIs: one exposed write route and one publication-scope concern

CONTENT-01 — High: `POST /api/domains` creates a domain without visible authentication or authorization.\
In `apps/api-server/src/app/api/domains/route.ts`, the POST handler parses/sanitizes the request and calls `DomainService.createDomain(data)` directly. Unlike the nearby admin content routes, this handler does not verify a token, require an admin permission, or validate a trusted internal caller. If reachable in production, an unauthenticated caller can attempt to create domain records. Fix: require the appropriate admin permission at the route boundary and validate the creation payload against an explicit schema.

CONTENT-02 — Medium/High, depending on question publication policy: public search has no visible published/brand filter.\
`apps/api-server/src/app/api/search/route.ts` searches all matching topics and questions through `dbReadOnly`, but the inspected queries do not filter on publication status or brand. The question query searches both question text and explanation, then returns the question text. If the database contains draft, review, or brand-restricted questions, the public endpoint may expose them. Confirm whether this DB contains only public content; otherwise add publication and brand predicates before returning results.

The public GET endpoints for domains, subjects, topics, and subtopics are read-only in the inspected handlers. I’m treating their lack of authentication as an intentional public-catalog design unless the underlying service/data policy says otherwise.

### Notifications, migration, and worker routes

The notification handlers I inspected consistently derive the user ID from a verified user token and include that ID in both reads and writes. The single-notification `mark-read` query also constrains by both notification ID and owner ID. Those are appropriate self-scope checks.

MIGRATE-01 — High, linked to the previously identified fail-open admin verifier: the migration endpoint depends on `_verifyAdmin()`.\
`apps/api-server/src/app/api/migrate/route.ts` permits an admin-token fallback and calls `_verifyAdmin(_payload)` before running the database migration. The earlier source review found `_verifyAdmin()` can return success from token claims when the user row is missing or the DB check errors. Because this route performs schema migration, that fail-open behavior has a much higher impact here than on a read-only route. The migration endpoint should use a strict, fail-closed authorization path and preferably a dedicated deployment-only mechanism rather than a general admin token.

Positive: the inspected worker endpoints that process jobs or retry hierarchy sync verify the QStash signature before running their job logic. I have not validated the actual QStash key configuration or the deployed route exposure.

### Health/status surface

HEALTH-01 — Medium: public readiness/status endpoints expose dependency diagnostics.\
`/api/status` and `/api/health/ready` return `HealthService.getReadinessReport()`. That report identifies the core, RTH, SkillUp, and people databases, cache, and identity bridge; it includes latency, cache usage details, and raw dependency error messages when checks fail. `/api/status` also returns the runtime environment. This is useful operationally but too detailed for an unrestricted public endpoint. Remediation: keep a minimal public liveness response, and restrict detailed readiness/diagnostic output to trusted monitoring or redact messages and cache internals.

The basic `/api/health` endpoint reports only process/Redis status, while `/api/health/live` returns a minimal liveness report; those are narrower disclosures.

### Signed tutor-note URL security

NOTES-01 — High, conditional on notes delivery being enabled: signed URLs use a predictable fallback secret.\
`apps/api-server/src/modules/tutor/tutor.security.ts` uses `AUTH_SECRET` when configured, but otherwise falls back to the literal `"tutor-notes-secret-key-123"`. The download route validates the HMAC signature and expiry, but with that fallback an attacker could forge a valid topic/expiry signature. The current view/download handlers have empty/null file-path placeholders, so I’m not claiming that a real note file is presently retrievable through this path. Still, the signing design must fail closed: require a strong configured secret at startup, and never use a source-coded signing key.

The HMAC verification does use `timingSafeEqual`, which is a positive implementation detail.

### Client telemetry and rate limiting

TELEM-01 — Medium/High: client telemetry accepts arbitrary metric names and tag objects.\
`/api/telemetry` lets a client choose `metric`, `value`, and `tags`, then passes them to `recordTimer()` or `recordCounter()`. There is no metric-name allowlist or bound on tag cardinality in the handler. If the metrics backend creates a distinct series for each name/tag combination, a caller can generate high-cardinality telemetry and degrade observability or consume resources. Fix: allowlist client metrics, constrain numeric values, and permit only a small set of fixed tag keys/values.

TELEM-02 — Medium, conditional on trusted proxy handling: rate-limit identity uses caller-visible IP headers.\
The shared rate-limit middleware keys by `x-real-ip` or the first value of `x-forwarded-for`. If the edge does not strip caller-supplied values and inject a canonical client IP, a caller can rotate these headers to evade limits. The middleware also invokes the handler without a limit if the cache increment throws. Confirm proxy header normalization and decide whether a Redis failure should fail open, fail closed, or use a bounded local fallback for public abuse-sensitive endpoints.

The telemetry route’s JSON depth/size checks and PII key scrubbing are useful defenses, but they do not replace metric cardinality controls or trustworthy rate-limit identity.

### Shared admin authorization helper — cross-cutting control

I re-opened the actual shared helper because many admin route handlers rely on it.

ADMIN-AUTH-01 — High/Critical: `infra` audience skips the admin-role verifier.\
In `requireAdminRouteAccess()` (`apps/api-server/src/modules/auth/admin-audience.util.ts`), the `_verifyAdmin(payload)` check runs only when the audience is neither `shc-admin` nor `infra`. Therefore, any token that successfully verifies for the `infra` audience is allowed through this helper without a route-level role/permission check. That may be intentional for tightly controlled infrastructure identities, but it is unsafe if an infra token is issued broadly or can reach browser-facing admin routes. Remediation: restrict infra audience to explicitly designated service-only endpoints, or require a specific infra role/permission for each admin route.

ADMIN-AUTH-02 — Critical, already confirmed and now traced to the shared helper: admin access can fail open when the user record is missing or the DB check errors.\
`requireAdminRouteAccess()` delegates ordinary admin checks to `_verifyAdmin()`. That verifier returns token-based admin claims when the user record is absent and also falls back to token roles on DB errors. This means a stale admin claim can remain authoritative precisely when current account/role status cannot be established. The fix belongs in the shared verifier: DB failure or missing account should deny privileged access, and current role/blocked status should be checked before allowing admin operations.

These findings affect the many admin endpoints reviewed earlier; they are not isolated to one handler.

### CSP reporting endpoint

CSP-01 — Medium/High: request-size enforcement relies only on `Content-Length`.\
`/api/security/report` rejects a body only when the parsed `content-length` exceeds 100 KB. If that header is absent or malformed, the handler proceeds to `req.json()` without a stream-level byte limit. Because this is a public reporting endpoint, an attacker could send oversized JSON and consume memory/CPU. Add a bounded streaming read or enforce a platform-level request-body limit; also apply a public endpoint rate limit.

CSP-02 — Medium: full, attacker-controlled CSP reports are written to cloud logs.\
The handler logs the complete report, including `document-uri`, `blocked-uri`, `original-policy`, and optional `script-sample`. Those values may contain sensitive URLs or user-controlled content. Redact/normalize the fields, truncate them, and avoid logging the full report object.

## Principal Architect audit checkpoint

The route-level review has now covered the legacy tutorial APIs, ILS, faculty workflows, assessment interactions, reports/exports, telemetry, admin authorization, health/cron/worker endpoints, and several shared authorization helpers.

### Highest-priority remediation queue

1. Remove hard-coded internal-key fallbacks from `/api/reports`, `/api/generate-report`, `/api/cron/cleanup-reports`, and `/api/cron/pdf-health`. Missing credentials must fail closed.
2. Correct shared admin authorization: fail closed on missing-user/DB errors; constrain `infra` audience access to explicitly authorized service endpoints.
3. Authorize export triggers using the verified user identity and exam ownership; never trust `userId` from the request body.
4. Fix attendance roster enforcement so every submitted student ID is checked against the faculty’s authorized roster before writing.
5. Move quiz/practice answer correctness to the server; clients should submit selected answers, not the canonical correct answer.
6. Protect exposed write/diagnostic routes: `/api/domains` POST and the debug endpoints need removal or explicit authorization.
7. Harden the remaining public-input surfaces: telemetry metric/tag allowlists, canonical rate-limit IP handling, CSP report body limits, and the tutor-note signing secret.

### Review boundaries

This is a source review of the repository’s `main` branch. I have not executed the test suite, queried production databases, inspected live Cloudflare/Cloud Run ingress rules, or verified deployed environment variables. Findings marked conditional depend on those external controls or on the project’s intended brand/data policy.

I’m keeping this as an ongoing audit checkpoint, not a security sign-off. The next pass should continue through the remaining admin route handlers and trace their service/query implementations for current-role checks, brand partitioning, and resource ownership—not just whether each route calls a shared auth helper.

### Admin content-management routes — detailed pass

I’ve reviewed the question, topic, domain, subject, and subtopic route handlers, including GET/POST/PATCH/DELETE and batch operations.

Correction to my previous checkpoint: I previously described `POST /api/domains` as unauthenticated. The route file I have now inspected is `apps/api-server/src/app/api/admin/domains/route.ts`; its POST handler does call `requireAdminRouteAccess()` before creating a domain. I should not have stated the public route was unprotected without verifying that exact route. I’m withdrawing that earlier finding unless the separate `apps/api-server/src/app/api/domains/route.ts` confirms it.

CONTENT-ADMIN-01 — Medium: batch-delete routes accept unbounded, weakly validated ID arrays.\
The topic, subject, and subtopic batch-delete handlers check that `ids` is an array, but do not use the existing ID-array schema or impose a visible maximum count/UUID validation. A privileged admin can submit an extremely large or malformed list, creating avoidable DB load and error behavior. This is primarily robustness/availability risk (admin-only), not a direct privilege escalation. Apply a shared schema with UUID validation, uniqueness, and a maximum batch size.

CONTENT-ADMIN-02 — Medium: topic-to-skill mapping accepts an unvalidated body.\
`apps/api-server/src/app/api/admin/topics/[id]/skills/route.ts` calls `body.skillIds` directly without checking that the body is an object, that `skillIds` is an array, or that the IDs are valid and bounded. The downstream engine must validate these constraints; the route does not. Validate at the boundary and confirm that the topic and skills belong to the same brand/allowed hierarchy.

Positive controls in this slice: the ordinary create/update routes for question/topic/domain/subject/subtopic call `requireAdminRouteAccess()`, use Zod schemas, and apply JSON depth/size checks. I’m continuing to the remaining admin skills, blueprints, publishing, hierarchy, and user-management routes.

### Admin user, job, and hierarchy handlers

ADMIN-USER-01 — High, conditional on brand-specific admin policy: user detail lookup is not brand-scoped in the route.\
`apps/api-server/src/app/api/admin/users/[id]/route.ts` verifies admin access, then queries the shared `@quiz/db` user table by ID and returns profile and role relations. The route does not visibly restrict the target user to the administrator’s brand. If RTH and SkillUp admin identities are meant to manage only their own brand’s users, this endpoint needs a brand-membership check before returning or mutating the record. The same policy needs to be applied in `AdminUserEngine` and its repository, not just the route.

ADMIN-JOB-01 — High/Medium: admin job listing is global, while job detail is owner-scoped.\
`GET /api/admin/jobs` calls `JobsService.listJobs()` without `userId`, which returns all jobs in the backing table; `GET /api/admin/jobs/[id]` does constrain by both job ID and the authenticated admin’s user ID. This difference may be intentional for an admin operations console, but the route does not visibly require a separate operations permission. Confirm that all admins are allowed to inspect every user’s job payload/result/error data. If not, apply a dedicated permission and/or brand scope to listing and detail.

ADMIN-HIERARCHY-01 — Medium: atomic hierarchy seed accepts a raw JSON object and delegates broad upsert behavior.\
`/api/admin/hierarchy/atomic` checks JSON depth/size and sanitizes input, but does not validate the request against a strict schema before calling `HierarchyFactory.seedAtomic()`. The factory can create/update domains, subjects, topics, subtopics, skills, and question rows in one transaction. Because it is admin-only, this is not an anonymous-write finding; it is a high-impact privileged input boundary. Require explicit schemas, bounded nested array counts, UUID validation, and parent-child consistency checks before any writes.

Positive: the job detail service query filters by both `backgroundJobs.id` and `backgroundJobs.userId`; the route’s ownership constraint is not merely cosmetic. The hierarchy sync endpoint also requires a configured internal key or verified admin access, with no literal default key fallback.

### Admin tutor support and trend endpoints

TUTOR-ADMIN-01 — Medium: admin help-request PATCH calls JSON validators but ignores their results.\
In `apps/api-server/src/app/api/admin/tutor/help/list/route.ts`, the PATCH handler invokes `validateJsonSize(raw)` and `validateJsonDepth(raw)` but does not branch on either return value. Oversized or deeply nested JSON is therefore not rejected by those checks. The fields are later narrowed to strings, which limits some downstream risk, but the validation is ineffective as written. Enforce both results and cap the `note` length before inserting it into notification text/metadata.

TUTOR-ADMIN-02 — Medium, conditional on brand boundaries: admin help-request listing and mutation use unscoped shared tables.\
The route’s SQL joins help requests to users/profiles/topics and filters by status only. PATCH updates by request ID alone. This is acceptable only if an admin is intentionally authorized to handle requests across both brands. If admins are brand-bound, add the appropriate tenant predicate to list/count and mutation queries, and verify the request’s brand before creating a notification.

The trend endpoints validate the allowed date ranges and require admin access. They accept an optional `userId` filter, which appears to be an admin analytics feature; the data policy should explicitly state whether a brand admin may query a user from another brand.

### Shared service trace: trend and report data boundaries

TREND-01 — Medium, conditional on brand-level admin isolation: trend queries aggregate across the shared exam table.\
The admin trend endpoints call `TrendsService` methods that query completed exams without a brand predicate. `getScoreTrends()` and `getSkillTrends()` optionally filter by `userId`; `getTrendSummary()` is platform-wide. If these are intended as platform-wide admin analytics, this is expected. If RTH/SkillUp admin access is brand-bound, the route’s verified token brand needs to flow into the service and SQL predicates.

REPORT-ADMIN-01 — Medium, conditional on brand policy: admin report listing and stats are global.\
`ReportRepository.listReports()` filters by status and optional user ID, but not brand; `getReportStats()` aggregates all report records. The admin route accepts an optional user ID and returns report records plus global stats. Confirm that a brand admin is allowed to inspect all report metadata and counts. If not, add brand scope to both the list and aggregate query; filtering only the returned list would still leave global statistics exposed.

The report repository uses parameterized Drizzle conditions for user/status filters, so the concern here is data scope, not SQL injection.### Exact-route verification: public domain creation is confirmed

I have now checked the separate route `apps/api-server/src/app/api/domains/route.ts`, which resolves the earlier ambiguity.

DOMAIN-01 — High: public `POST /api/domains` creates domain records without authentication.\
The handler reads and sanitizes the JSON body, then calls `DomainService.createDomain(data)` directly. It does not call `requireAdminRouteAccess()`, verify a JWT, or require an internal service identity. The `validateJsonSize(raw)` and `validateJsonDepth(raw)` calls are also made without checking their return values, so they do not reject payloads that fail those checks.

This is a confirmed source-level unauthenticated write path. The impact depends on what domain creation exposes downstream, but it can at minimum allow untrusted callers to modify shared catalog hierarchy. Fix: remove public POST or require an authenticated, permission-checked admin/service caller; enforce a strict domain schema and actually reject failed size/depth checks.

This confirms the original concern, but the correct evidence is the exact public `apps/api-server/src/app/api/domains/route.ts`—not the admin route. I’m correcting the record accordingly.

### Admin user management: service-level behavior

ADMIN-USER-02 — High operational/security concern: the user-create endpoint reports success without creating a user.\
`apps/api-server/src/app/api/admin/users/route.ts` is explicitly marked as an RBAC example. Its POST authenticates a caller with `user.manage`, reads the body, logs the email, and returns `201` with “User created successfully”—but the actual `userService.createUser()` call is commented out. This is a misleading success response and should be removed from production or return `501 Not Implemented` until real creation is implemented. The email is also logged unnecessarily.

ADMIN-USER-03 — Medium: user update accepts `roles` but does not apply them.\
`updateUserSchema` accepts `roles?: string[]`, and `AdminUserEngine.updateUser()` receives that field. However, the engine builds an update object containing only `isBlocked`, `updatedAt`, and optionally `passwordHash`; it never writes role assignments. This creates an authorization-administration correctness defect: the API may appear to accept a role change while leaving the persisted privileges unchanged. Either implement validated role replacement transactionally or reject/remove `roles` from this endpoint’s input schema.

ADMIN-USER-04 — Medium: admin user listing total count ignores the applied filters.\
In `DrizzleAdminUserRepository.findAll()`, the page query uses `whereClause` including search, role, blocked, verified, and status conditions, but the separate `countResult` query only filters active/deleted status. The reported total can therefore describe a broader population than the filtered result set. This is a pagination/information-accuracy defect, not a direct authorization bypass.

The user repository is also backed by the shared global DB and has no visible brand condition in `findAll()`. That reinforces the earlier need to define whether admin user management is platform-global or brand-scoped.

### Remaining admin operational routes: findings

REPORT-ADMIN-02 — High functional integrity issue: retry endpoint says it queued work but does not trigger generation.\
`apps/api-server/src/app/api/admin/reports/[id]/retry/route.ts` changes the report status to `pending`, then returns “Report queued for re-generation.” The actual background-generation logic is represented by `// ... background generation logic ...`; no queue or worker invocation appears in the handler. A report can therefore remain pending indefinitely while the API reports success. The route should enqueue a durable job and return success only after that enqueue operation succeeds. Its comment also says “Protected by x-internal-key,” but the actual guard is `requireAdminRouteAccess()`; update the comment to match the implementation.

ADMIN-OPS-01 — Medium: materialized-view refresh runs synchronously from an admin request.\
`/api/admin/maintenance/refresh-views` calls `materializedViewsService.refreshAll()` inline. The code comment itself notes that production should use a worker to avoid timeout. This creates request timeout and concurrent-refresh risk if multiple admins invoke it. Use a durable job/lock and return an accepted job ID.

ADMIN-OPS-02 — Medium: live-session admin pagination inputs are not bounded at the route.\
`/api/admin/sessions/live` parses `page` and `limit` directly and passes them to `GetLiveSessionsQuery`. There is no route-level finite/positive check or maximum limit. Ensure the query handler enforces a sensible cap and rejects invalid page values to prevent expensive admin queries.

ADMIN-OPS-03 — Low/Medium: feature-flag endpoint returns runtime environment metadata.\
`/api/admin/feature-flags` includes `process.env.NODE_ENV`. The endpoint is admin-protected, so this is not public disclosure, but the environment value is not needed for the flag data itself. Keep it only if the admin UI genuinely uses it.

### Audit status

The review is still progressing file-by-file. Findings so far are grounded in source code at `main`; no tests, production DBs, or deployed gateway controls have been exercised. The most urgent confirmed items remain the public domain-create route, predictable internal-key fallbacks, fail-open shared admin verification, export authorization, attendance roster validation, and client-supplied quiz correctness.

I’m continuing the source review against main in skillupitacademy-alt/SUIA_RTH_SHC. I’m keeping this as a read-only architecture/security audit—I’m not changing files, and I’m not treating source inspection as proof that tests or deployed infrastructure have been checked.
Additional findings from the files just inspected
TELEMETRY-01 — High: client can submit arbitrary metric names and values
File: apps/api-server/src/app/api/telemetry/route.ts

The type === 'metric' branch accepts a client-provided metric name, numeric value, and tags. It then calls recordTimer() or recordCounter() without a visible metric-name allowlist, value bounds, or tag-key/cardinality controls.

Risk: A caller may pollute operational metrics, create high-cardinality series, or submit misleading measurements. The route is rate-limited, but that does not constrain the metric namespace or values.

Recommended control: Accept only defined client metric names; validate metric type, value range, and allowed tag keys/values. Keep server-owned operational metrics separate from client telemetry.
TELEMETRY-02 — Medium: client metadata can overwrite structured log fields
File: apps/api-server/src/app/api/telemetry/route.ts

The route builds the structured log object with controlled fields such as component, operation, requestId, sessionId, and severity, then spreads scrubbedMetadata afterward. If metadata contains matching keys, it can replace those fields.

Risk: Client-supplied metadata can make logs attribute events to misleading operations, request IDs, or severities. Key-based PII scrubbing does not prevent this field-overwrite behavior.

Recommended control: Put client metadata under a dedicated nested property (for example, clientMetadata) or spread it before server-owned fields. Allowlist metadata keys.
LOGS-01 — Medium: client-log rate limiting fails open
File: apps/api-server/src/app/api/logs/client/route.ts

rateLimited() returns false when cacheService.increment() throws.

Risk: During cache failure, the endpoint continues accepting client logs without the intended per-IP/source limit. That may increase log volume and cost during an incident.

Recommended control: Choose an explicit failure policy: fail closed for abuse-sensitive ingestion, or use a bounded local/edge fallback. Alert on limiter backend failures.
LOGS-02 — Medium: IP and user-agent are logged without the route’s PII scrubber
File: apps/api-server/src/app/api/logs/client/route.ts

The route scrubs email and bearer-like strings in the message and metadata, but includes ip and ua directly in the logger child context. The IP is derived from x-forwarded-for, whose trust depends on the gateway/proxy chain.

Risk: Logs may retain personal/device data; an untrusted forwarded header may also let callers influence the recorded IP.

Recommended control: Apply a privacy policy to IP/UA retention and masking, and only trust forwarding headers set by a verified proxy.
CSP-01 — Medium: CSP reporting logs the complete untrusted report
File: apps/api-server/src/app/api/security/report/route.ts

The route logs the entire csp-report object, including document URI, referrer, blocked URI, policy, and script sample when supplied. The visible validation checks only a couple of required fields; it does not show field-length/type constraints. A missing or malformed Content-Length also does not provide a reliable body-size limit by itself.

Risk: CSP reports can contain sensitive URLs or user-controlled strings, and may produce oversized or noisy logs.

Recommended control: Enforce an actual bounded body read, validate each field and length, redact query strings/script samples as appropriate, and log a small structured subset rather than the whole report.
INSIGHT-PDF-01 — High, tenant-boundary verification required
File: apps/api-server/src/app/api/student-insight-pdf/route.ts

The route verifies the user token and checks that the exam’s userId matches the token’s userId. That is a meaningful ownership check. However, the visible exam lookup and later update are keyed by exams.id and do not include a brand predicate.

Risk: If exam IDs or the shared exams table are not globally isolated across brands, brand-level separation may be missing. The same attempt ID is also passed into multiple report/export services whose own ownership and brand checks need confirmation.

Recommended control: Bind the request’s validated brand to the exam lookup/update and ensure every downstream report query is scoped to the same owner and brand. This is a conditional tenant-isolation finding, not evidence that cross-brand access has been demonstrated.
Tutor and recommendation routes
TUTOR-HELP-01 — High/Medium: cooldown check and insert are not atomic
File: apps/api-server/src/app/api/tutor/help/request/route.ts

The handler first queries for a recent request, then inserts a new request separately. The 12-hour cooldown is therefore a check-then-act sequence.

Risk: Concurrent requests can both pass the cooldown check and create duplicate help requests. The same route inserts a notification in a separate operation; if that insert fails, the help request may exist without the corresponding notification.

Recommended control: Enforce the cooldown with a transactional/atomic operation or a suitable database constraint/locking strategy. Make notification delivery durable through an outbox or retryable job.
TUTOR-NOTES-01 — Medium: requested topic IDs need service-level ownership/brand validation
Files:
- apps/api-server/src/app/api/tutor/notes/request/route.ts
- apps/api-server/src/app/api/topics/[id]/request-notes/route.ts
Both routes authenticate a user and pass the user ID plus a client-selected topic ID to AdaptiveTutorService.requestMasterNotes(). The route code does not itself show that the topic is published, available in the user’s brand, or eligible for dispatch.

Risk: The service must enforce those content and tenant constraints. The route-level source alone does not establish whether it does.

Recommended control: Confirm that the service resolves the topic within the authenticated brand, checks publication/eligibility, and limits dispatch frequency. I’m treating this as a verification item until the service implementation is inspected.
TUTOR-NOTES-02 — Low/Medium: signed-download URL is topic-scoped, not visibly user-scoped
Files:
- apps/api-server/src/app/api/tutor/notes/view/route.ts
- apps/api-server/src/app/api/tutor/notes/download/route.ts
The view route requires a user recommendation for the topic, then issues a one-hour signature over the topic ID and expiry. The download route validates that signature, but does not require the user token or check the original user’s recommendation.

Risk: Anyone who obtains the signed URL can use it until expiry. That may be intended as a temporary bearer link, but it is not a user-bound authorization credential. The notes source path is currently empty in the inspected code, so I cannot confirm an actual file-disclosure path from this route as written.

Recommended control: Decide explicitly whether these URLs are bearer links. If they are, use a short expiry, avoid leaking them through logs/referrers, and ensure the signed content is appropriate for bearer access. If user-bound access is required, bind the signature to the user or require authenticated download.
RECOMMENDATION-01 — High/Medium: brand scope not visible in recommendation queries
Files:
- apps/api-server/src/app/api/recommendations/route.ts
- apps/api-server/src/app/api/recommendations/explain/route.ts
- apps/api-server/src/app/api/recommendations/history/route.ts
These routes scope recommendation rows by authenticated userId, which is positive. The SQL joins to topics, exam_questions, questions, and results_by_dimension do not visibly apply a brand predicate.

Risk: If these tables are shared and topic/exam identifiers are not globally unique or brand-isolated, recommendation details may cross brand boundaries. This is conditional; the schema and service-level brand guarantees need to be checked before calling it a demonstrated exposure.

Recommended control: Use the authenticated brand in the query path and verify global uniqueness/tenant constraints for every joined identifier.
RECOMMENDATION-02 — Medium: explanation counts may not be topic-filtered
File: apps/api-server/src/app/api/recommendations/explain/route.ts

The query joins exam_questions by exam_id, then joins questions with the topic condition. The aggregate counts eq.id, not a topic-filtered question ID.

Risk: totalQuestions and mistakeCount may include exam questions from other topics, while the output is grouped as a topic recommendation. That can misstate learner performance and the explanation behind a recommendation.

Recommended control: Apply the topic condition to the counted exam-question rows (or use a filtered aggregate/subquery) and test a multi-topic exam case.
Quiz and exam routes
QUIZ-01 — High/Medium: request-size/depth checks are called but their results are ignored
Files:
- apps/api-server/src/app/api/quiz/start/route.ts
- apps/api-server/src/app/api/quiz/answer/route.ts
- apps/api-server/src/app/api/quiz/submit/route.ts
- apps/api-server/src/app/api/quiz/count/route.ts
These handlers call validateJsonSize(raw) and validateJsonDepth(raw) without checking the returned values. The code then continues to sanitize and parse the body.

Risk: If these validators return booleans—as their use elsewhere in this repository indicates—the intended payload limits are not enforced at these call sites. A large or deeply nested request may proceed to later processing.

Recommended control: Reject when either validator returns false, and enforce a body-byte limit before req.json() as well.
QUIZ-02 — High/Medium: active-exam route uses payload.userId before validating the verified payload
File: apps/api-server/src/app/api/quiz/active/route.ts

The route checks that a token exists, then calls verifyUserAccessToken(token), but does not visibly check that the returned payload and payload.userId are non-null before querying exams.

Risk: Malformed or unexpected verifier output can lead to a runtime error rather than a controlled authentication rejection. This is primarily an auth robustness issue; it is not, by itself, proof of unauthorized exam access.

Recommended control: Apply the same verified-payload and user-ID validation used in the neighboring quiz handlers.
QUIZ-03 — Medium: question-count endpoint needs strict body and brand validation
File: apps/api-server/src/app/api/quiz/count/route.ts

The route authenticates the user but casts sanitized JSON to a TypeScript shape rather than validating it with a runtime schema. It passes client-selected domain/subject/topic/subtopic IDs to ExamBlueprintService.getAvailableCounts().

Risk: Runtime input constraints and brand/publication eligibility are not established by the route. The service must reject malformed IDs and ensure counts are limited to eligible content in the requested brand.

Recommended control: Add a strict schema with bounded arrays and ID validation, then enforce brand and content eligibility in the service/query.
QUIZ-04 — Medium: result retrieval can trigger scoring work
File: apps/api-server/src/app/api/quiz/result/route.ts

A GET request may call ScoringEngine.calculateExamResults(examId) when the exam is processing and queues are disabled, and may call it again when completed results still contain unanswered correctness values.

Risk: A read endpoint can initiate expensive writes/computation. If the condition remains true after scoring, repeated polling can repeatedly trigger scoring.

Recommended control: Move repair/re-scoring to a controlled idempotent job or lock it with a durable scoring state transition. Keep result retrieval read-only where possible.

Positive control observed: The result route checks the exam owner against the verified token before returning the report. The answer route also passes the authenticated user ID to its command rather than trusting a client-supplied user ID; the command handler still needs to enforce exam ownership.
Question factory and durable workflow routes
FACTORY-01 — Medium/High: no explicit maximum question batch size
Files:
- apps/api-server/src/app/api/factory/save/route.ts
- apps/api-server/src/app/api/factory/check-duplicates/route.ts
The save schema requires at least one question but does not set a maximum. The duplicate-check route also checks only that questions is a non-empty array. Both perform per-question duplicate evaluation; the save route uses Promise.all() for the batch.

Risk: An authorized admin or compromised admin session can submit an excessively large batch, causing high concurrent duplicate-check load, long transactions, or resource exhaustion.

Recommended control: Enforce a strict maximum batch count and per-question text/options limits. Process bounded chunks with controlled concurrency.
FACTORY-02 — Medium: topic/subtopic relationship is not established in the route
File: apps/api-server/src/app/api/factory/save/route.ts

The payload validates topicId and optional subtopicId as UUIDs, then inserts questions using both values. The route does not visibly verify that the subtopic belongs to the supplied topic or that the topic/subtopic is within the authenticated admin’s brand.

Risk: Incorrect hierarchy associations or cross-brand content insertion if the underlying database does not enforce those relationships.

Recommended control: Validate parent-child and brand consistency inside the transaction, and add database constraints where feasible.
WORKFLOW-01 — High/Medium: signed job payloads still need domain-level validation
Files:
- apps/api-server/src/app/api/workflows/bulk-import/route.ts
- apps/api-server/src/app/api/workflows/exam-report/route.ts
- apps/api-server/src/app/api/workflows/pdf-report/route.ts
- apps/api-server/src/app/api/workflows/learning-journey/route.ts
These handlers verify QStash signatures, which is a positive trust boundary. However, the outer handler validates only a small subset of the signed payload (for example, jobId or attemptId). The workflow then consumes related values such as adminId, examId, userId, context, and score.

Risk: If a trusted producer can enqueue malformed or mismatched fields—or a producer-side authorization bug exists—the signature alone does not prove that the supplied user, exam, job, and brand belong together. For instance, the PDF workflow accepts both attemptId and userId, while the outer handler checks only the attempt ID.

Recommended control: Validate the full payload schema and confirm entity ownership/brand linkage before starting work. Treat the queue signature as proof of sender authenticity, not as a substitute for domain authorization.
WORKFLOW-02 — Medium: job lock scope and lifetime need confirmation
Files: all four workflow routes above.

The routes acquire a lock, invoke the Upstash workflow handler, and release the lock in finally. Whether this prevents duplicate work depends on whether the workflow handler’s response remains open for the entire workflow or returns after durable enqueue/acceptance.

Risk: If the handler returns after accepting the workflow, the lock may be released while work is still running. The lock alone would then not prevent overlapping retries.

Recommended control: Verify the Upstash workflow lifecycle semantics and use durable idempotency at the workflow/job layer, especially for scoring, PDF generation, and bulk writes.
Authentication and notification routes
AUTH-ROUTE-01 — Medium: signup has no visible body-size/depth guard
File: apps/api-server/src/app/api/auth/signup/route.ts

The handler parses JSON and validates it with signupSchema, but unlike several neighboring auth routes, it does not visibly call the JSON size/depth validators. It does have a rate limiter.

Risk: Schema validation limits fields, but does not necessarily cap the incoming raw body before parsing. This is a robustness/resource-exhaustion concern.

Recommended control: Enforce a byte limit before parsing and reject malformed or oversized requests consistently.
AUTH-ROUTE-02 — Medium: onboarding emits extensive identity and runtime diagnostics
File: apps/api-server/src/app/api/auth/onboarding/route.ts

The route logs the build version, request path, full user ID, brand, DB instance metadata, and error messages. It also logs multiple runtime DB checks and repository-construction details.

Risk: This can expose identity and internal architecture details in operational logs. The broad catch returns the exception message as a bad-request response, which may also expose internal failure detail.

Recommended control: Remove temporary build/debug logging, use a request ID and non-sensitive audit fields, and return a generic server error while retaining sanitized server-side diagnostics.
AUTH-ROUTE-03 — Medium: reset-token validation uses a URL query parameter
File: apps/api-server/src/app/api/auth/reset-password/route.ts

The GET endpoint accepts _token in the query string. Query values can be captured in request logs, tracing, browser history, and other URL-handling layers. The response also does not visibly set Cache-Control: no-store.

Risk: A password-reset token may persist in places beyond the intended form flow.

Recommended control: Prefer a POST body for token validation where feasible; otherwise enforce no-store, redact query tokens in logs/traces, and ensure the reset page uses a restrictive referrer policy.
AUTH-ROUTE-04 — High/Medium: resend-verification accepts a client-supplied user ID
File: apps/api-server/src/app/api/auth/resend-verification/route.ts

The route accepts userId from the request body and calls AuthService.resendVerification(userId, ip, brand) without requiring an authenticated user. It is rate-limited and returns a generic success on successful service execution, which reduces direct enumeration.

Risk: The service must ensure this endpoint cannot be used to repeatedly trigger email delivery for arbitrary accounts, cross-brand users, or unverified identity mappings.

Recommended control: Keep responses generic, enforce per-account and per-IP cooldowns inside the service, and verify that the user ID belongs to the resolved brand. Consider a signed or email-address-based flow if that better fits the verification lifecycle.
NOTIFY-01 — Positive ownership checks; brand scoping remains to verify
Files:
- apps/api-server/src/app/api/notifications/route.ts
- apps/api-server/src/app/api/notifications/mark-read/route.ts
- apps/api-server/src/app/api/notifications/unread-count/route.ts
The routes use the verified token’s user ID for notification reads and updates. The single-item mark-read update also filters by both notification ID and user ID. That is the correct ownership pattern.

The visible queries do not include a brand predicate. If notifications are globally user-scoped and the global identity ID is the intended owner key, this may be appropriate; if notifications are brand-partitioned, add brand scope.
Export workflow follow-up
EXPORT-STATUS-01 — High/Medium: status route does not visibly enforce job ownership
File: apps/api-server/src/app/api/export/status/[jobId]/route.ts

The route authenticates a user unless the internal key is valid, then retrieves the job by jobId. I do not see a check that job.userId equals the authenticated payload.userId before returning status or running stale-job recovery.

The recovery path can also update the job to COMPLETED or FAILED based on artifact checks.

Risk: An authenticated user who knows another job ID may be able to inspect job state or trigger status-repair side effects for that job. The download route separately checks ownership, so this finding does not establish direct artifact download.

Recommended control: After loading the job, require job.userId === payload.userId for user requests. Keep internal access explicit and scope repair operations to the authorized job.
EXPORT-TRIGGER-01 — Critical/High: export trigger trusts client-supplied user identity
File: apps/api-server/src/app/api/export/trigger/route.ts

The route validates that examId, userId, and format are non-empty/allowed, but does not authenticate a user or verify that the exam belongs to the supplied userId before starting the export saga or job.

Risk: A caller can attempt to initiate exports for another user’s exam by supplying that user’s ID. The download route’s owner check is useful but does not undo unauthorized job creation, computation, or potential export artifact creation.

Recommended control: Authenticate the requester, derive userId from the verified token, and verify exam ownership and brand before queueing. For internal callers, require a service credential and validate the full job/exam/user association.
EXPORT-DOWNLOAD-01 — Medium: storage reference and proxy behavior require strict trust
File: apps/api-server/src/app/api/export/download/route.ts

The route checks user ownership before reading the artifact, which is positive. It then passes the stored fileRef to storage.getReadUrl() and fetches that URL. The trust boundary is therefore the integrity of job.result.downloadUrl and the exam’s export URL fields.

Risk: If those fields can be influenced by untrusted data or an insufficiently authorized workflow, the download proxy may fetch an unintended resource. I have not established that such write access exists from this route alone.

Recommended control: Ensure fileRef is constrained to the expected private storage bucket/key namespace and that URL generation cannot produce arbitrary external URLs. Keep proxy responses private and consider no-store for sensitive exports rather than a one-hour cache directive.
Worker and certificate follow-up
WORKER-01 — Medium: notification HTML interpolates database/user-controlled values without escaping
File: apps/api-server/src/modules/notifications/skillup-notifications.service.ts

The email HTML builders interpolate recipientName, batchName, sessionNotes, and installment labels directly into HTML. Some of these values can originate from user- or admin-entered content.

Risk: HTML markup or links embedded in those values may be rendered in email clients, enabling misleading content or email-based injection. This is not browser DOM XSS, but it is still an unsafe HTML output boundary.

Recommended control: HTML-escape all interpolated text fields, and validate/encode URLs separately if links are introduced.
WORKER-02 — Medium: worker payloads are type-cast rather than runtime-validated
Files:
- apps/api-server/src/app/api/workers/certificate-issued/route.ts
- apps/api-server/src/app/api/workers/payment-overdue/route.ts
- apps/api-server/src/app/api/workers/session-reminder/route.ts
The routes use createQStashHandler() and cast envelope.data to TypeScript interfaces. The route code does not show runtime validation for required IDs, dates, or numeric fields.

Risk: A signed but malformed event—or a producer defect—can pass invalid data into notification/delivery services. Those services should validate the payload shape and verify that the referenced entity and recipient are related.

Recommended control: Add runtime schemas at the event boundary and enforce entity linkage in the service. Signature verification authenticates the event sender; it does not guarantee payload correctness.
CERT-VERIFY-01 — Medium: public verification response exposes certificate metadata and PDF reference
Files:
- apps/api-server/src/app/api/certificates/verify/[code]/route.ts
- apps/api-server/src/lib/certificate-verification.ts
The public verification endpoint returns certificate ID, scope, parent name, verification code, issue/expiry dates, version, and pdfUrl.

Risk: A verification code is effectively a public lookup key. This may be intentional for certificate validation, but the endpoint discloses the PDF reference and all listed metadata to anyone holding the code. I have not established whether the PDF itself is public or private.

Recommended control: Define the public verification response contract deliberately. Return only fields needed to validate authenticity, and ensure the verification code is high-entropy/non-guessable and rate-limited. Avoid returning a private storage reference.
Positive worker controls observed
- verifyQStashSignature() fails closed when signing keys are missing and verifies the signed body.
- Certificate delivery queries by both certificate ID and user ID before generating the PDF.
- Payment-overdue notification lookup ties the installment to the supplied user ID and sends only when the installment status is overdue.
Learner dashboard and analytics
DASHBOARD-01 — High/Medium: dashboard handlers need consistent brand-bound data access
Files:
- apps/api-server/src/app/api/dashboard/route.ts
- apps/api-server/src/app/api/dashboard/breakdown/route.ts
- apps/api-server/src/app/api/dashboard/metadata/route.ts
- apps/api-server/src/app/api/dashboard/trend/route.ts
These routes validate the token brand against the request, which is a positive defense. Their engine calls use userId and range, but do not pass brand in the visible route call. The main dashboard cache is also keyed by user ID, range, page, and limit—not brand.

Risk: If the same global identity can access both brand portals and the dashboard data/cache is brand-specific, cached or queried data may be shared across brands. The actual impact depends on the query and cache design inside DashboardEngine and CacheManager.

Recommended control: Confirm user IDs and dashboard data are globally scoped by design. If dashboards are brand-specific, include canonical brand in query and cache keys.
ANALYTICS-USER-01 — Medium: weakness-tree hierarchy lookups are global
File: apps/api-server/src/app/api/analytics/user/weakness-tree/route.ts

The learner’s performance dimensions are filtered through exams owned by the verified user. The hierarchy queries that map topic/skill IDs to domains, however, read the topics and skills hierarchy without a brand predicate.

Risk: If identifiers are not globally unique across brands, hierarchy labels or parent mappings can be ambiguous or cross-brand. This is a conditional data-isolation concern; the user-specific performance query itself is scoped to the verified user.

Recommended control: Make hierarchy resolution brand-aware or establish and test global uniqueness and immutable parent mapping for the IDs used here.
ANALYTICS-USER-02 — Medium: learner trend query lacks an explicit completed-exam filter
File: apps/api-server/src/app/api/analytics/user/mastery-trend/route.ts

The mastery trend query selects results_by_dimension rows whose exam ID belongs to the user, but does not visibly filter the parent exams to status = 'completed'. The score-history query in the same route does filter completed exams.

Risk: If results/dimensions can be created before an exam is completed, partial or in-progress attempts may influence the trend.

Recommended control: Apply the same completed-status policy to the trend query, unless partial-attempt inclusion is an intentional product requirement.
Administrative operational routes
MIGRATE-01 — High: database migration is exposed as a GET operation
File: apps/api-server/src/app/api/migrate/route.ts

The handler performs database migrations in GET. It supports a migration secret or admin token and invokes _verifyAdmin() for the admin fallback.

Risk: GET requests can be triggered by crawlers, prefetchers, monitoring, or browser navigation. More importantly, this endpoint performs a high-impact schema mutation in the application request path and inherits the previously identified fail-open risk in _verifyAdmin().

Recommended control: Move migrations to a controlled deployment/operations workflow. If an HTTP trigger is retained, use a dedicated service identity, a mutation method, strict environment gating, and an explicit migration lock.
ADMIN-LOGS-01 — Medium: audit-log pagination inputs are not bounded in the route
File: apps/api-server/src/app/api/admin/logs/route.ts

The route parses limit with parseInt() and forwards it, along with cursor and fields, to GetAuditLogsQuery. There is no visible positive/finite/max bound at the route.

Risk: Malformed or very large limits may produce expensive queries or unexpected behavior unless the query handler applies strict bounds.

Recommended control: Validate cursor format, finite positive limit, and a modest maximum; allowlist requested fields.
ADMIN-PUBLISH-01 — Medium: duplicate approval/publish entry points have different input hardening
Files:
- apps/api-server/src/app/api/admin/approve/route.ts
- apps/api-server/src/app/api/admin/publish/route.ts
Both require admin access and validate the publish schema. The publish route also checks JSON depth/size; approve parses JSON and schema-validates but does not visibly apply those payload guards.

Risk: The same publishing operation has inconsistent request-boundary controls, which can complicate assurance and allow unusually large bodies through one path.

Recommended control: Consolidate both endpoints or apply the same raw-body limits and schema validation to each. Also ensure the shared admin helper is corrected before relying on either route.
Legacy tutorial-content route — high-priority review item
TUTOR-LEGACY-01 — Critical/High: user identity is taken directly from request headers
File: apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts

This deprecated route extracts x-user-id and x-brand directly from request headers. It defaults an absent/invalid brand to realtutorialhub, then passes the header-derived user ID and brand to TutorialService.getContent().

The route does perform a content-brand comparison after retrieval, but that does not authenticate the user ID or establish that the caller is entitled to the requested user’s progress.

Risk: If the route is reachable without a trusted gateway that strips caller-supplied identity headers and injects authenticated values, a caller may impersonate another user. The brand default also risks silently selecting RTH when the brand is missing or invalid.

Recommended control: Remove this legacy route if it is no longer used. Otherwise, authenticate through the same verified-token/internal-context path as current routes, reject missing/invalid brands, and never treat raw client headers as authoritative identity.
TUTOR-LEGACY-02 — Critical/High: response containing user progress is marked public-cacheable
File: apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts

The handler returns result.data from a service call that includes user progress, then sets:

- Cache-Control: public, max-age=3600

Risk: A shared cache may store personalized progress and serve it to another requester if the cache key does not include the user identity. Even if the gateway prevents identity spoofing, the explicit public directive is unsafe for a personalized response.

Recommended control: For user-specific tutorial progress, use private, no-store (or a carefully designed private cache). If the content itself is public, separate the public content response from the personalized progress response.

This route is marked deprecated in source, and the comments say the production system uses /api/tutorial/sections/*. I’m flagging the legacy handler because the route still exists in the inspected tree; actual deployment reachability remains unverified.
Tutorial progress and interaction APIs
TUTOR-PROGRESS-01 — Critical/High: progress endpoints trust x-user-id as identity
File: apps/api-server/src/app/api/tutorial/progress/route.ts

Both GET and POST read x-user-id directly from request headers. POST also reads x-brand, defaulting to realtutorialhub when the value is missing or invalid. The route then reads or writes progress for that header-supplied user.

Risk: Without a trusted gateway that strips caller-supplied identity headers and injects authenticated identity, a caller can impersonate another learner and read or modify their progress. The default brand can also silently bind an invalid/missing brand to RTH.

Recommended control: Authenticate the request and derive user ID/brand from verified auth context. Reject missing or invalid brand rather than defaulting.
TUTOR-INTERACTION-01 — Critical/High: code, completion, and visual routes share the same header-trust boundary
Files:
- apps/api-server/src/app/api/tutorial/interactions/_shared.ts
- apps/api-server/src/app/api/tutorial/interactions/code/route.ts
- apps/api-server/src/app/api/tutorial/interactions/completion/route.ts
- apps/api-server/src/app/api/tutorial/interactions/visual/route.ts
getAuthenticatedUserId() returns the raw x-user-id header. The routes use it to insert and query learner interaction records. getTutorialSection() loads a section by ID alone, with no visible brand predicate.

Risk: The interaction APIs depend on the same identity-header provenance as the progress route. In addition, the section lookup does not establish that the section belongs to the authenticated brand.

Recommended control: Replace header-only identity with verified auth context, and resolve the section within the user’s canonical brand before recording interactions.
TUTOR-COMPLETION-01 — Medium: completion score and time are client-provided
File: apps/api-server/src/app/api/tutorial/interactions/completion/route.ts

The completion request schema accepts timeSpent and score, and the route stores those values from the client. The route marks a section/subsection completed based on the request; no server-side evidence of the learning activity is checked here.

Risk: Learners can submit fabricated completion timing or scores. If these fields influence certification, mastery, recommendations, or reports, client assertions should not be treated as authoritative evidence.

Recommended control: Treat telemetry values as untrusted observations. Derive mastery/assessment scores server-side and require explicit server-validated completion rules for unlocks or certificates.

The shared helper’s own comment states that it does not validate authentication and is deprecated for security-boundary use. That comment is an explicit warning in the source, not a runtime proof of gateway behavior.
Exam-engine service review
EXAM-ENGINE-01 — High/Medium: answer submission can report success when the question is not part of the exam
File: apps/api-server/src/modules/exam-engine/exam.engine.ts

submitAnswer() validates that the exam belongs to the user and is active. It then looks up the exam-question relation. If findQuestionByExamAndQuestion() returns no row, the code logs an error but does not throw; execution continues to update the last-answered timestamp and may return success to the caller.

Risk: A client can submit an unrelated question ID and receive a success response even though no answer was persisted. This can confuse client state and telemetry and may allow unnecessary timestamp updates.

Recommended control: Reject the submission with a not-found/invalid-question error when the exam-question relation is absent. Only update the exam timestamp after a successful answer write.
EXAM-ENGINE-02 — Medium: scoring logs contain answer and correct-answer material
File: apps/api-server/src/modules/scoring-engine/scoring.engine.ts

The scoring diagnostic logs raw user answers, resolved scoring answers, resolved correct answers, question type, and correctness for each exam question.

Risk: Logs become a secondary store of assessment responses and answer keys. Access to general application logs may be broader than access to assessment records, and logs may persist longer.

Recommended control: Remove answer text and correct-answer content from production logs. Use aggregate counts, opaque IDs, and sampled diagnostics with controlled access.
EXAM-ENGINE-03 — High/Medium: exam completion ownership check is conditional
File: apps/api-server/src/modules/exam-engine/exam.engine.ts

In completeExam(), the ownership rejection is conditional on examWithQuestions.userId being non-null, non-empty, and defined. If an exam record has a missing/empty owner, the service does not reject based on ownership at that check.

Risk: If unowned or legacy exam rows can exist and be addressed by ID, the completion path may proceed without proving ownership. This is conditional on the database invariant and route reachability.

Recommended control: Fail closed when the exam owner is missing; require an exact owner match for every user-triggered completion. Reserve any ownerless/system completion for a separately authorized service path.
Admin bulk-import workflow integration
BULK-IMPORT-01 — High: trigger authentication appears incompatible with the workflow receiver
Files:
- apps/api-server/src/app/api/admin/questions/bulk/route.ts
- apps/api-server/src/app/api/workflows/bulk-import/route.ts
The admin bulk route directly fetch()es the workflow URL and sends Authorization: Bearer ${QSTASH_TOKEN}. The receiving /api/workflows/bulk-import route, however, calls verifyQStashSignature(req) and rejects the request when the QStash signature is invalid or absent.

The caller’s request code does not visibly provide an upstash-signature header or call the QStash publish/trigger API. The fallback path is only taken for HTTP 404; a 401 response is instead marked failed and thrown.

Risk: The configured workflow path may reject the direct trigger, causing the bulk-import job to fail rather than enter the intended background workflow. This is a source-level integration mismatch; I have not executed the deployed flow.

Recommended control: Trigger the workflow through the supported QStash/Upstash workflow client so the receiver gets a valid signed request. Add an integration test that verifies the actual trigger path and confirms that the workflow receives the complete payload. Avoid falling back to a synchronous bulk insert for arbitrary non-404 errors without an explicit safe policy.
Admin identity and health endpoints
ADMIN-ME-01 — High/Medium: admin /me authorizes using only the first role
File: apps/api-server/src/app/api/admin/auth/me/route.ts

The route loads user roles, but derives rawRole from _user.userRoles[0] and builds a one-role array for RBACService.hasPermission(). The order of returned roles is not established in this query path.

Risk: A multi-role administrator may be denied access if a non-admin role is returned first. More broadly, authorization should evaluate the full canonical role set rather than an arbitrary first record.

Recommended control: Normalize and validate all current database roles, then evaluate permission against the complete set. Do not rely on ordering for access decisions.
HEALTH-01 — Medium: public readiness/status endpoints expose operational detail
Files:
- apps/api-server/src/app/api/status/route.ts
- apps/api-server/src/app/api/health/ready/route.ts
Both return HealthService.getReadinessReport(). The status route additionally includes NODE_ENV. The exact report contents come from the health service, which needs to be reviewed for dependency names, database/cache details, and raw error messages.

Risk: Detailed dependency state can help an unauthenticated caller map infrastructure or identify failing components. The public liveness endpoint is much narrower and is less concerning.

Recommended control: Keep public liveness minimal. Restrict detailed readiness diagnostics to trusted monitoring or return only a coarse healthy/unhealthy status publicly.

The health-service implementation confirms the concern.
HEALTH-02 — High/Medium: readiness response exposes dependency errors and cache usage
File: apps/api-server/src/modules/core/health.service.ts

getReadinessReport() returns component-by-component status. The database checks include raw exception messages; the cache check can return keys and memory details. The public /api/status and /api/health/ready routes return this report.

Risk: An unauthenticated caller can learn which individual database/cache dependencies are unavailable and may receive internal connection or configuration error details. Cache key counts and memory usage also disclose operational state.

Recommended control: Separate internal detailed readiness from public readiness. Public responses should expose only coarse status; detailed component messages, cache usage, and raw exceptions should be available only to authorized monitoring.## Brand BFF authentication boundary
BFF-AUTH-01 — High: RTH requireStudent() does not enforce the RTH brand
File: apps/realtutorialhub-web/src/lib/assignment-auth.ts

The helper verifies a user-audience token and checks that the token contains one of the allowed roles. It does not visibly require payload.brand === 'realtutorialhub' or verify RTH platform access.

Risk: A valid SkillUp user token may satisfy this helper and access RTH BFF routes if the token is presented to the RTH host. This is a potential cross-brand access boundary failure; actual cookie/domain and gateway behavior still needs deployment verification.

Recommended control: Enforce the canonical RTH brand/platform claim in this helper, mirroring the brand-access check in SkillUp’s helper. Reject a token with missing or mismatched brand context.
BFF-AUTH-02 — Medium: RTH learner helper permits admin/faculty roles
File: apps/realtutorialhub-web/src/lib/assignment-auth.ts

The allowed-role set includes student, admin, super_admin, faculty, and legacy user.

Risk: If a route is intended strictly for learner actions or learner data, an admin/faculty token also passes the helper’s role gate. That may be acceptable for some routes, but the helper name and route usage do not distinguish the policy.

Recommended control: Separate requireStudent from broader authenticated-user/admin access. Each route should require the minimum role/permission it needs.
BFF-AUTH-03 — Medium: SkillUp identity resolution prefers shadowUserId
File: apps/skillup-web/src/lib/student-auth.ts

SkillUp derives its effective user ID from payload.shadowUserId when present, otherwise payload.userId. It does validate SkillUp brand/platform access and allowed roles, which is positive.

Risk: The effective ID convention must match the downstream API server and database ownership convention. If one service expects the global identity ID and another expects the brand shadow ID, this can cause incorrect ownership scoping or inconsistent audit attribution.

Recommended control: Define one canonical identity contract for BFF-to-API requests, document whether the header carries global or brand-local identity, and test both identities across route families.
Shared web middleware and BFF gateway boundary
I checked the shared auth proxy and confirmed both apps/realtutorialhub-web/src/proxy.ts and apps/skillup-web/src/proxy.ts install it for application routes. That changes the interpretation of the earlier BFF-helper findings: the shared proxy does perform hostname-to-brand matching before protected routes proceed. The missing brand check in RTH’s route helper remains a defense-in-depth gap, but I’m not treating it as a demonstrated cross-brand bypass through the normal proxy path.
BFF-GATEWAY-01 — Medium: missing gateway secret configuration fails open in the shared proxy
File: src/share-branding/middleware/authProxy.ts

hasValidGatewaySecret() returns true when INTERNAL_GATEWAY_SECRET is missing or empty. When configured, it compares the incoming x-gateway-secret to the expected secret.

Risk: The intended gateway-secret gate is silently disabled when the environment variable is absent. The protected-route auth logic still applies to the listed protected paths, but this weakens the separate gateway-origin check for other API paths.

Recommended control: Fail closed when the secret is missing in production, and add startup validation that the secret is configured for the deployed BFF.
BFF-LOG-01 — Medium/Low: shared auth proxy logs a token prefix
File: src/share-branding/middleware/authProxy.ts

resolveUser() logs tokenPrefix: token?.substring(0, 20) and token length.

Risk: A token fragment is retained in logs. It is not the complete bearer credential, but it is unnecessary credential-adjacent data and can help correlate a token across requests.

Recommended control: Log only a boolean such as hasToken, token type/source, and a request ID. Do not log token fragments or lengths.
BFF-ROLE-01 — Medium: shared proxy treats admin/faculty roles as eligible for learner-protected routes
File: src/share-branding/middleware/authProxy.ts

hasRequiredRole() allows student, user, and the OVERRIDE_ROLES set (admin, super_admin, faculty) for protected prefixes.

Risk: This is broader than a learner-only gate. It may be intentional for shared pages, but the same role rule covers protected API prefixes, including tutorial/quiz-related routes.

Recommended control: Separate route policies: require learner roles for learner APIs, and explicit permissions for faculty/admin APIs. Avoid using one broad role allowlist for all protected routes.
BFF-AUTH-04 — High/Medium, conditional: shared auth helper defaults missing/invalid brand to RTH
File: src/share-branding/auth/unifiedBffAuth.ts

extractAuthFromRequest() validates the token audience and identity claims, but if the brand claim is missing or unsupported, it sets the returned brand to realtutorialhub. createInternalHeaders() also falls back to RTH when auth.brand is absent.

Risk: Any BFF route using this helper can silently convert an ambiguous token into RTH context rather than reject it. That conflicts with the strict hostname/JWT brand matching implemented in the shared proxy.

Recommended control: Reject missing or unsupported brand claims in the helper and require the helper’s brand to match the canonical request-host brand before creating internal headers. This is conditional on the helper’s call sites; I have not established that every route uses it.
Critical discovery — content-manager write endpoint
CONTENT-MANAGER-01 — Critical: unauthenticated endpoint writes request-derived data into a TypeScript source file
Files:
- apps/realtutorialhub-web/src/app/api/content-manager/add-section/route.ts
- apps/skillup-web/src/app/api/content-manager/add-section/route.ts
Both POST handlers parse the request body and write the transformed content into:

../../src/share-branding/subtopicContentRegistry.ts

I do not see authentication, admin authorization, an internal service credential, or a strict runtime schema at the start of either handler. The endpoint accepts subtopicId, subtopicInfo, section, and content, then calls fs.writeFileSync() on the registry source file.

The generated source also interpolates request-derived values into TypeScript text. In particular, the new-entry generator inserts subtopicInfo.subtopic and subtopicInfo.subject inside single-quoted strings without escaping them; the registry key is also assembled from subtopicId.

Risk: This is an unauthenticated server-side content/file mutation boundary. Malicious input may corrupt the registry source or inject source text. Whether that becomes code execution depends on the runtime/build/deployment behavior, which I have not tested—but the source-file write itself is directly visible.

Recommended control:
1. Disable or remove this route from deployed learner-facing applications.
2. If content management is required, move it to a protected admin service and use the current database-backed content workflow.
3. Never write request-derived text into source code. Persist validated JSON in a data store instead.
4. Add strict section schemas, maximum payload limits, and parent/brand authorization.
5. Audit whether the registry file has been modified by this endpoint in any deployed or development environment.
This finding is more urgent than the earlier conditional findings because the handler itself contains the write operation and no route-level authorization is visible.
Project worker integrity checks
PROJECT-WORKER-01 — High/Medium: badge worker does not visibly bind payload identity to the fetched submission
File: apps/realtutorialhub-web/src/app/api/workers/award-project-badge/route.ts

The worker verifies a QStash event and loads the submission by submissionId. It then calls awardBadge(userId, badgeId, submissionId) using the event’s userId, without visibly checking that the loaded submission belongs to that user or the supplied projectId.

Risk: A signed but mismatched event payload—or a producer-side defect—could cause a badge to be awarded to an identity that does not own the referenced submission. QStash signature verification authenticates the sender; it does not validate the relationships among event fields.

Recommended control: Before the transaction, verify the submission’s owner and project match the payload. In the transaction, scope the badge-award update by submission ID plus owner and require the expected approval status.
PROJECT-WORKER-02 — Medium: event type appears inconsistent between handler and schema
File: apps/realtutorialhub-web/src/app/api/workers/award-project-badge/route.ts

The createQStashHandler() call is configured for PlatformEventTypes.PROJECT_SUBMITTED, while AwardBadgeSchema requires the event type literal project.approved.

Risk: If the event type constant resolves to project.submitted, the handler and schema disagree and valid requests may be rejected. I have not confirmed the constant’s runtime value or executed the worker.

Recommended control: Use one canonical event type for both the QStash handler and payload schema, and test the actual published event through this worker.
CERT-WORKER-02 — High: certificate event type is inconsistent across publisher, handler, and schema
Files:
- apps/realtutorialhub-web/src/app/api/workers/award-project-badge/route.ts
- apps/realtutorialhub-web/src/app/api/workers/issue-certificate/route.ts
- packages/events/src/types.ts
The badge worker publishes an event whose type is project.certificate_requested. But the shared PlatformEventTypes defines CERTIFICATE_ISSUED as certificate.issued, and the issue-certificate worker is configured with PlatformEventTypes.CERTIFICATE_ISSUED while its local schema requires the literal project.certificate_requested.

Risk: The producer and consumer use different event contracts. The certificate issuance workflow may reject events before creating a certificate, or behave differently from the intended flow. I have not executed the QStash delivery path.

Recommended control: Define a single event type and payload schema in packages/events, use it in the publisher and consumer, and add a contract test covering the full event envelope from publication through worker validation.
Shared profile BFF
PROFILE-BFF-01 — Medium: profile handlers log personal and identity details
File: src/share-branding/auth/bffProfileHandler.ts

The profile GET handler logs the resolved upstream URL and, when a successful response is enriched, logs the user’s email address. The PATCH handler logs the full x-user-id value in its diagnostic object. Catch blocks also log error messages and short stack fragments.

Risk: Email, stable identity IDs, internal service URLs, and exception details become part of application logs. This increases privacy exposure and can make log access equivalent to access to profile metadata.

Recommended control: Use request/correlation IDs, mask identity values, do not log email or full user IDs, and keep exception details server-side in sanitized structured logs.
PROFILE-BFF-02 — Medium/High, conditional: shared profile handler relies on the auth helper’s brand fallback
File: src/share-branding/auth/bffProfileHandler.ts

Both profile GET and PATCH use requireBffAuth() followed by createInternalHeaders(). As noted above, the underlying helper defaults an absent/unsupported brand to RTH and does not itself compare the JWT brand to the current hostname.

Risk: If a token with a missing/unsupported brand claim is accepted by the token verifier and reaches these handlers, the request can be forwarded with an implicit RTH brand. The current helper should reject ambiguous identity context instead.

Recommended control: Require a valid canonical brand claim and match it to the request hostname before forwarding profile reads or writes. Also validate that the API server’s profile endpoint independently enforces brand and owner scope.

Scope qualification for CONTENT-MANAGER-01: the shared web proxy applies an additional gateway-secret check to API paths that are not in its BFF-internal allowlist. /api/content-manager/add-section is not in that allowlist. So the route is not necessarily reachable by an ordinary browser request when the gateway secret is configured and enforced.

The security defect remains: the handler itself has no user/admin authorization, and the only visible proxy gate is the shared secret check—which is fail-open when INTERNAL_GATEWAY_SECRET is unset. I’m therefore treating this as a critical unauthenticated file-write/code-injection surface if that secret gate is absent or bypassed, rather than claiming unconditional public reachability in the deployed environment.
Placement handoff credential boundary
PLACEMENT-HANDOFF-01 — High/Medium: handoff request forwards broad BFF headers to the placement service
Files:
- apps/realtutorialhub-web/src/app/api/auth/placement-handoff/route.ts
- apps/skillup-web/src/app/api/auth/placement-handoff/route.ts
- src/share-branding/auth/authBffRoute.ts (createForwardHeaders())
Both placement-handoff routes send createForwardHeaders(request) to https://placement.skillhubcore.in/api/auth/handoff. That helper starts from the full incoming request headers and adds internal gateway/API credentials when configured. The handoff route also places the access token in the JSON body.

Risk: The placement service receives more than the intended handoff credential: depending on the incoming request and environment, the forwarded headers can include cookies, an Authorization header, and internal gateway/API secrets. The placement service may be trusted, but these credentials should not be disclosed to a downstream service unless that service specifically needs them.

Recommended control: Construct a minimal allowlisted header set for the handoff request. Send only the handoff token, brand, request/correlation ID, and content type required by the placement service. Do not forward browser cookies or internal gateway/API secrets. Validate the access token and brand before initiating handoff.

This is a source-level credential-minimization finding; I have not inspected the placement service’s deployed ingress or verified what it logs or retains.## Additional BFF/API observations
ONBOARDING-SESSION-01 — Low/Medium: onboarding session cookie is user-supplied state
Files:
- apps/realtutorialhub-web/src/app/api/onboarding/session/route.ts
- apps/skillup-web/src/app/api/onboarding/session/route.ts
- src/share-branding/onboardingSessionCookie.ts
The endpoint accepts a schema-validated onboarding object and serializes it into an HttpOnly cookie, but does not authenticate the caller or sign the cookie. The data includes profile preferences and a journeyStatus.

Risk: This is acceptable if the cookie is only a convenience for pre-login/onboarding UI state. It must not be treated as authoritative evidence of completed onboarding, user identity, eligibility, or authorization. A user can forge equivalent client-side state outside the endpoint.

Recommended control: Keep the cookie strictly non-authoritative; persist and verify completion/eligibility server-side before granting any consequential access.
PROJECT-SUBMIT-01 — Medium: deliverable payload has no visible size or nested-field limits
Files:
- apps/realtutorialhub-web/src/app/api/tutorial/projects/submit/route.ts
- apps/realtutorialhub-web/src/server/project.service.ts
The request schema accepts deliverable as z.record(z.unknown()), without a visible key count, nested-depth, or serialized-size limit. The service stores the submitted object in the database and publishes a review event.

Risk: A learner can submit an unusually large or deeply nested deliverable, consuming request, database, and queue resources. The service checks that a required deliverable field exists, but that is not a payload-size policy.

Recommended control: Bound request bytes, object key count, nesting, and field lengths. Validate allowed deliverable types and URL formats before persistence and queueing.
TUTOR-LEGACY-03 — High: both brand BFFs repeat the public-cache directive on authenticated tutorial content
Files:
- apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts
- apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts
Both BFFs authenticate the learner, forward the user ID to the API server, and then set Cache-Control: public, max-age=3600 on the returned content. The API server’s deprecated handler also sets the same public-cache directive and returns user-specific progress.

Risk: This creates a shared-cache exposure risk at both layers. The authenticated request does not make a response safe for public caching when its body contains learner-specific progress.

Recommended control: Remove the legacy route or set private, no-store on any response containing user progress. If static tutorial content should be cacheable, split it from the personalized progress payload and cache only the public content.
ASSIGNMENT-01 — High: assignment completion does not enforce tier prerequisites
File: apps/realtutorialhub-web/src/server/assignment.service.ts

startTier() checks whether the prior tier is completed before allowing a tier to start. But completeTier() does not repeat that prerequisite check and does not require the current tier to be in_progress. It only rejects if that same tier is already marked self_completed, then writes self_completed.

The BFF completion route calls completeTier() directly after checking tutorial-content completion. It does not independently prove that the assignment tier was started or unlocked.

Risk: A learner can call the completion endpoint for a tier they never started, or for a higher tier whose prerequisite was not completed. This can falsify assignment completion and undermine tier-based progression.

Recommended control: Enforce the full state transition in the service and transaction: verify prior tier completion, require the current tier to be in progress (or a valid idempotent completion), and reject unauthorized transitions. Do not rely on the UI or startTier() having run first.
SkillHubCore Tutorial Composer authorization
COMPOSER-AUTH-01 — Medium/High: section-list endpoint authenticates but does not check authoring permission
File: apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts

The GET handler calls authenticateRequest() and validates query parameters, then queries tutorials. Unlike the create, update, delete, block, and publish handlers, it does not call requireTutorialEditPermission(), requireSubtopicAccess(), or requireBrandAccess().

The query can return tutorial content and workflow metadata, including draft/review status, rejection reason, AI generation fields, and quality/hallucination scores.

Risk: Any request accepted by authenticateRequest() can list matching tutorial records without a route-level content-author permission check. This may be broader than intended if the shc-admin audience includes roles that should not read draft authoring content.

Recommended control: Require the intended read/author permission on list access and scope the query to authorized brands/subtopics. If all SHC administrators are deliberately allowed to view all drafts, document that policy and test it explicitly.
COMPOSER-AUTH-02 — Medium, permission-policy mismatch: mutation routes do not require the operation-specific permission
Files:
- apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts
- apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/blocks/route.ts
- apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/publish/route.ts
- apps/skillhubcore-admin/src/lib/auth-helpers.ts
The shared helper defines separate requireTutorialEditPermission(), requireTutorialDeletePermission(), and requireTutorialPublishPermission() checks. The routes instead use requireSubtopicAccess(), which authorizes if the user has either the create or edit permission.

Risk: The endpoint-level policy does not distinguish editing, deleting, and publishing. If the RBAC matrix later grants these permissions to different roles, a create/edit-only role could archive content or publish it without the dedicated permission.

Recommended control: Enforce the operation-specific permission in each route: edit for PATCH/block changes, delete for archive, publish for publish. Keep subtopic/brand scope checks as additional controls. I’m rating this conditional because the helper comments say some of these permissions currently share the same admin/super-admin grant set.
Critical discovery — Tutorial Left Sidebar API is missing authorization
SIDEBAR-AUTH-01 — Critical: sidebar save/publish route mutates database without authentication
File: apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts

The POST handler validates the request schema, checks hierarchy relationships, normalizes the navigation tree, and writes to tutorialSidebarTreesV2 using an upsert. When body.status === 'published', it also calls ensureTopicHierarchySynced() to synchronize the domain → subject → topic → subtopic hierarchy before publishing.

I do not see a call to authenticateRequest(), an admin-role check, an RBAC permission check, or a trusted internal-secret check anywhere in this handler. The app’s src/proxy.ts only logs API requests and calls NextResponse.next(); it does not enforce authentication.

Risk: If this route is reachable in the deployed admin app, an unauthenticated caller can save or publish sidebar navigation and trigger hierarchy synchronization. That is a direct content-integrity and administrative authorization failure.

Recommended control:
1. Require a verified admin token and a dedicated sidebar/content publish permission before parsing or processing the request.
2. Bind authorization to the requested brand and topic.
3. Keep hierarchy synchronization behind the same authenticated operation.
4. Add a test proving anonymous POST receives 401 and a non-authorized admin receives 403.
This is a direct source-level finding: the route performs a persistent write and publish workflow without visible authentication or authorization.
MARKETING-OBS-01 — High: unauthenticated route proxies a privileged analytics observability endpoint
File: apps/skillhubcore-admin/src/app/api/marketing/collector/observability/route.ts

The GET handler reads ANALYTICS_ADMIN_TOKEN from the server environment and sends it as a bearer token to the configured analytics collector’s /observability endpoint. It does not authenticate the incoming request or check an admin permission. The SkillHubCore admin proxy does not add an authentication gate.

Risk: Any caller who can reach this route may retrieve observability data from a downstream endpoint using the server’s privileged token. The exact sensitivity depends on the collector’s response, but the route is acting as an unauthenticated privileged proxy.

Recommended control: Require an authenticated admin session and an analytics-observability permission before making the upstream request. Keep the admin token server-side and return only the fields authorized for that caller.
SIDEBAR-READ-01 — Medium: sidebar hierarchy/navigation endpoints are unauthenticated
Files:
- apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/hierarchy/route.ts
- apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/navigation-nodes/route.ts
Both GET handlers read hierarchy/navigation data directly from the database without an authentication check. They return domains, subjects, topics, subtopics, or navigation nodes.

Risk: This may be acceptable if the hierarchy is deliberately public. If it is intended only for the composer/admin workspace, it exposes internal draft or brand-specific navigation metadata without a session.

Recommended control: Classify the returned hierarchy as public or admin-only. If admin-only, require authentication and brand access; if public, filter to published/visible records and explicitly document that policy.
Critical discovery — direct database CRUD in the admin BFF
SHC-ADMIN-DOMAINS-01 — Critical: admin domain CRUD has no authentication or authorization
File: apps/skillhubcore-admin/src/app/api/admin/domains/route.ts

This route directly calls getDb() and implements GET, POST, PUT, and DELETE against the domains table. I do not see any token verification, admin permission check, gateway-secret validation, or internal-service authentication in any of the four handlers. The SkillHubCore admin src/proxy.ts only logs API requests and calls NextResponse.next().

The DELETE handler also performs a hard delete (db.delete) for one or multiple IDs rather than a soft delete.

Risk: If reachable in the deployed app, an unauthenticated caller can create, modify, or delete domain records. This can corrupt the content hierarchy and cause downstream subject/topic relationships to break.

Recommended control:
1. Require a verified admin session and explicit domain-management permission for every method.
2. Validate body/query schemas and cap batch-delete size.
3. Use transactional soft deletion with relationship checks where appropriate.
4. Add anonymous 401 and unauthorized-role 403 tests for GET/POST/PUT/DELETE.
This is a direct source-level finding; deployment reachability has not been tested.
SHC-ADMIN-HIERARCHY-01 — Critical: multiple admin CRUD APIs repeat the unauthenticated database-write pattern
Files:
- apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts
- apps/skillhubcore-admin/src/app/api/admin/topics/route.ts
- apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts
- apps/skillhubcore-admin/src/app/api/admin/skills/route.ts
These handlers directly query and mutate the shared database. The POST, PUT, and DELETE methods do not visibly authenticate the caller or check an admin permission. Their DELETE implementations use direct database deletes, including comma-separated batch IDs.

Risk: The unauthenticated hierarchy-write surface is broader than the domains route. If reachable, callers can create, alter, or delete subjects, topics, subtopics, and skills. This can damage hierarchy integrity and affect learner content, question associations, and navigation.

Recommended control: Apply a common server-side admin authorization wrapper to every method, validate each request with strict schemas, verify parent-child relationships, bound pagination and batch sizes, and replace hard deletes with guarded transactional soft deletion where the data model requires retention.

These are separate route-level findings, but they share one systemic root cause: the SkillHubCore admin app’s API proxy does not provide an authentication boundary, and these direct-DB handlers do not implement their own.### SIDEBAR-READ-02 — High/Medium: unauthenticated GET can return draft sidebar source content
File: apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts

The GET handler accepts brandId and topicId, then queries tutorialSidebarTreesV2 by those fields. It does not filter status = 'published' and returns tree, sourceFormat, sourceContent, and status.

Risk: An unauthenticated caller who knows or discovers a topic ID can retrieve draft sidebar/navigation content and the original authoring source. This is not limited to public published navigation.

Recommended control: If the route is for the composer, require admin authorization. If it is intended for learner delivery, query only published records and return a minimal delivery projection—never draft sourceContent or workflow status.
Project AI FastAPI authorization
PROJECT-AI-AUTH-01 — High: sensitive workflow/candidate reads require authentication but not a role or ownership scope
Files:
- services/project-ai/app/api/routes/workflows.py
- services/project-ai/app/api/routes/candidate.py
- services/project-ai/app/api/routes/evidence.py
- services/project-ai/app/api/routes/snapshot.py
- services/project-ai/app/auth/dependencies.py
Several read endpoints—including workflow detail/list/history, candidate list/manifest, evidence listing, and snapshot access—use Depends(get_current_user). That dependency verifies a JWT and its identity claims, but does not require a contract-viewer/admin role or scope the record to the authenticated user.

The service defines require_contract_viewer() and require_contract_admin(), so a role-aware read boundary is available but not consistently applied.

Risk: If the API is reachable by ordinary user tokens, an authenticated user may be able to enumerate or retrieve another user’s workflow, candidate package, manifest, evidence, or repository snapshot. These records may contain project source/artifacts and internal engineering workflow details.

Recommended control: Use require_contract_viewer() or a narrower role for all sensitive read endpoints, and enforce owner/workflow/brand scope where records are user-specific. Keep global snapshots and agent registry access limited to explicitly authorized internal roles.

Reachability qualification: The SkillHubCore admin adapter forwards a cookie token to FastAPI without local role enforcement. The actual exposure depends on whether ordinary user tokens can reach that adapter/backend in deployment; I have not verified ingress or runtime access.
PROJECT-AI-CANDIDATE-01 — High: candidate upload is not restricted to an authorized workflow owner/admin
File: services/project-ai/app/api/routes/candidate.py

POST /candidates/upload depends on get_current_user, not require_contract_admin. It accepts a client-supplied workflow_id, loads that workflow, and permits candidate upload/revision across a broad set of workflow states. I do not see a check that the authenticated user is the workflow requester/owner or has an authorized candidate-upload role.

The operation then validates the package, runs candidate qualification tests, persists the candidate, binds the artifact to the workflow, and transitions workflow state.

Risk: A valid but insufficiently privileged user who knows a workflow ID may be able to attach or replace a candidate artifact and alter workflow progression. The endpoint also performs potentially expensive qualification work.

Recommended control: Require a dedicated candidate-upload role or contract-admin permission, and verify the authenticated principal is authorized for the target workflow before unpacking files or running tests. Enforce the same workflow-owner/permission predicate in the artifact-binding transaction.

This is a source-level authorization gap. Whether ordinary user tokens can reach the deployed service is not yet verified.
PROJECT-AI-CANDIDATE-02 — High/Medium: candidate upload has no visible per-file or archive expansion limits
Files:
- services/project-ai/app/models/candidate.py
- services/project-ai/app/api/routes/candidate.py
CandidatePackage.files is an unbounded list of files; CandidateFile.content has no visible maximum length. The upload handler accepts ZIP content, reads every qualifying archive entry, decodes it, and builds an expanded in-memory file list before running qualification tests.

Risk: A large request or highly compressed archive can consume substantial memory/CPU and trigger expensive qualification runs. This compounds the authorization issue in PROJECT-AI-CANDIDATE-01.

Recommended control: Enforce request-body bytes, file-count, per-file bytes, total expanded bytes, archive entry count, and compression-ratio limits before qualification. Reject unsafe archive paths and duplicate normalized filenames, and run qualification in a bounded isolated worker.
PROJECT-AI-WORKFLOW-01 — High: generic workflow transition accepts any authenticated user and client-supplied actor
File: services/project-ai/app/api/routes/workflows.py

POST /workflows/{workflow_id}/transition depends on get_current_user, not require_contract_admin or another workflow-transition permission. It passes request.triggered_by directly to governance_service.transition_state() rather than deriving the actor from the verified principal.

The service validates state-machine transitions and has an authorization gate for the IMPLEMENTING transition, which is a useful control. But the route itself does not establish that the caller is authorized to request other valid transitions, and the audit actor can be client-supplied.

Risk: A regular authenticated user may be able to move a workflow through allowed state transitions or disrupt workflow progression, and may spoof the recorded actor identity. The exact transitions that succeed depend on the state machine and service checks.

Recommended control: Require a workflow-admin permission for state transitions, derive triggered_by from the JWT principal, and authorize the requested transition against both the current state and caller role. Keep only narrowly defined user-requestable transitions open to lower roles.
PROJECT-AI-AUTH-02 — Medium: admin JWT secret fallback conflicts with strict secret binding
Files:
- services/project-ai/app/auth/config.py
- services/project-ai/app/auth/jwt.py
get_jwt_config() defaults ADMIN_JWT_SECRET to JWT_SECRET when the admin secret is absent. But decode_access_token() tries the user secret first and records which secret verified the token. It then requires tokenType == 'admin' to have been verified with the admin secret.

When the two secrets are equal, an admin token can verify with the first (user) secret and then fail the strict binding check. This makes the fallback behavior inconsistent with the decoder’s policy.

Risk: If the deployment omits ADMIN_JWT_SECRET, admin tokens may be rejected even when correctly signed with the configured shared secret.

Recommended control: Either require a distinct admin secret at startup, or handle equal-secret configuration explicitly without ambiguous “which secret verified” classification. Add tests for distinct secrets and the fallback/equal-secret case.
PROJECT-AI-APPROVAL-01 — Medium: legacy approval endpoints are authenticated but not owner-scoped
File: services/project-ai/app/api/routes/governance.py

The legacy /approvals/submit endpoint accepts a manifest ID and hash from the request and stores an in-memory approval record under any authenticated user. The GET /approvals/{approval_id} endpoint also requires only get_current_user; it does not verify that the caller submitted or is authorized to view that approval.

The file comments describe this as legacy in-memory approval storage while newer paths use persistent repositories.

Risk: If these legacy endpoints remain enabled, a valid user may create approval records for arbitrary manifest references and retrieve approval/audit details by ID. The risk is reduced by the in-memory store, but the route-level authorization is still broader than the record policy.

Recommended control: Remove or return 410 Gone from legacy approval endpoints after migration. Otherwise, validate the referenced manifest and enforce submitter/approver ownership and role checks consistently.
SHC-LOGIN-CORS-01 — Medium, conditional: login preflight reflects arbitrary origins with credentials enabled
File: apps/skillhubcore-admin/src/app/api/auth/login/route.ts

The OPTIONS handler returns the request’s Origin value as Access-Control-Allow-Origin and sets Access-Control-Allow-Credentials: true, without checking it against an allowlist. It also allows POST and credential-related headers.

Risk: This is an overly permissive credentialed CORS preflight policy. Whether it enables a usable cross-origin attack depends on the actual POST response CORS headers, browser cookie policy, and deployment origin configuration; I have not verified those at runtime.

Recommended control: Validate the origin against an explicit SkillHubCore admin origin allowlist and return no credentialed CORS permission for unknown origins. Do not reflect arbitrary Origin values.
SHC-LOGOUT-01 — High: logout clears primary cookies but leaves the admin alias cookies
Files:
- apps/skillhubcore-admin/src/app/api/auth/login/route.ts
- apps/skillhubcore-admin/src/app/api/auth/logout/route.ts
- apps/skillhubcore-admin/src/lib/auth-helpers.ts
Login sets both accessToken and admin_accessToken, plus both refreshToken and admin_refreshToken. Logout clears only accessToken and refreshToken. The auth helper explicitly falls back to admin_accessToken when accessToken is absent.

Risk: After logout, the remaining admin_accessToken may still authenticate requests. The remaining admin_refreshToken may also allow session renewal if the refresh path accepts it. This undermines the expected logout behavior.

Recommended control: Clear all four cookie names with matching path/domain/security attributes on every logout outcome. Also ensure the upstream logout revokes the server-side session/refresh token; clearing browser cookies alone is not sufficient.

This is directly supported by the cookie names and fallback logic in source. The effect on a live session depends on upstream revocation, which I have not tested.
Critical discovery — candidate qualification executes untrusted code with the service environment
PROJECT-AI-SANDBOX-01 — Critical: candidate tests run in a worktree, not an OS-isolated sandbox
File: services/project-ai/app/verification/candidate_tester.py

The qualification runner writes candidate-supplied component and test files into a detached Git worktree, then executes them with Vitest through subprocess.run().

The inspected code shows that:
- The subprocess environment starts with os.environ.copy(), so it inherits the Project AI service’s environment variables.
- The worktree links node_modules directories back to the live workspace using symlinks/junctions.
- Candidate tests execute as code in the Node/Vitest process.
- The worktree is isolated from the live Git tree, but the code does not show a container, OS sandbox, restricted user, network isolation, filesystem allowlist, or environment-secret filtering.
Risk: A submitted test can execute arbitrary JavaScript during qualification. A detached worktree does not isolate process privileges or secrets. Candidate code may be able to read inherited environment variables and access files reachable through the linked workspace, including service credentials, depending on the runtime account and deployment filesystem permissions.

This becomes especially urgent when combined with the candidate-upload authorization gap: the upload route accepts a workflow ID from the request and triggers qualification without requiring a contract-admin role or proving workflow ownership.

Recommended control:
1. Do not execute candidate-provided tests in the API service process.
2. Run qualification in a disposable container/VM with a non-privileged identity, no production secrets, no host mounts/symlinks, restricted network egress, read-only base image, and strict CPU/memory/time/process limits.
3. Pass only a minimal allowlisted environment.
4. Separate the qualification worker identity and queue from the API server.
5. Require authorization for candidate upload before enqueueing qualification.
This is a direct source-level execution boundary finding. I have not executed a malicious candidate or verified the live service’s environment/filesystem permissions; the risk is based on the subprocess and environment construction in source.
PROJECT-AI-SANDBOX-02 — Critical: Composer verification copies the admin .env.local into the candidate worktree
File: services/project-ai/app/verification/composer_worktree_verifier.py

The dependency-preparation function explicitly copies:

apps/skillhubcore-admin/.env.local

from the main workspace into the isolated verification worktree “so Next.js server has database credentials.” The verifier then builds and runs the candidate placement commit in that worktree.

Risk: The verification worktree is a Git isolation boundary, not a process/OS security boundary. Candidate code that executes during build or server startup may be able to read the copied environment file. If it contains database credentials or other secrets, the verifier exposes them to candidate code.

Recommended control: Never copy production or privileged .env.local files into a candidate-controlled worktree. Use a dedicated test-only environment with synthetic credentials and least-privilege database access; preferably run verification in a disposable container with no production network access or secret mounts.

This compounds PROJECT-AI-SANDBOX-01: both qualification and verification execute candidate-controlled code, and the verification path explicitly places the admin environment file inside the worktree.
FACULTY-BFF-AUTH-01 — High/Medium, conditional: faculty proxy authenticates role but does not bind the token to the faculty app’s brand
Files:
- apps/faculty-app/src/proxy.ts
- apps/faculty-app/src/lib/faculty-api.ts
The faculty proxy verifies a user-audience token and requires faculty or super_admin, but does not check the token’s brand/platform claim. The upstream-header builder forwards x-brand and x-platform from the request headers rather than deriving them from the verified token or a canonical faculty-app hostname.

Risk: A faculty token from another brand may satisfy the role gate. The upstream request may also carry a client-selected brand assertion. Whether this becomes cross-brand access depends on the upstream gateway/API’s brand resolution and trusted-header handling.

Recommended control: Bind the faculty app to its intended brand/platform, reject missing or mismatched token brand claims, and set brand headers from that verified context. Do not forward client-supplied brand headers as authoritative identity.
FACULTY-ATTENDANCE-02 — High/Medium, conditional: attendance helper does not validate each student against the session roster
File: apps/faculty-app/src/lib/faculty-live-data.ts

upsertFacultyAttendance() verifies that the faculty member owns the batch and that the session belongs to that batch by calling getFacultyAttendanceRoster(). It then loops over the submitted studentId values and upserts attendance without checking that each student is enrolled in that batch.

Risk: If this helper is used by a reachable attendance write path, a faculty member may write attendance for a student outside their roster. The API-server attendance route has a similar roster-membership gap noted earlier.

Recommended control: Validate every submitted student ID against the active roster for the authorized batch/session, and enforce the same roster predicate in the database write. Confirm whether this helper is currently called by a route; the inspected faculty attendance route itself proxies to the API server.
Current highest-priority findings
These are the most urgent source-level issues found so far—not a final repo-wide verdict:
Priority	Finding	Primary risk
Critical	PROJECT-AI-SANDBOX-01/02	Candidate code executes in the service environment; Composer verification copies admin .env.local into a candidate worktree
Critical	SIDEBAR-AUTH-01	Sidebar save/publish and hierarchy sync have no visible auth gate
Critical	SHC-ADMIN-DOMAINS-01 and SHC-ADMIN-HIERARCHY-01	Direct admin DB CRUD endpoints can mutate/delete hierarchy data without visible auth
Critical, conditional	CONTENT-MANAGER-01	Request-derived data is written into TypeScript source; exposure depends on the gateway-secret gate
High	PROJECT-AI-CANDIDATE-01	Candidate upload can attach/replace artifacts on a client-selected workflow without an admin/owner check
High	MARKETING-OBS-01	Unauthenticated route proxies a privileged analytics observability endpoint
High	TUTOR-LEGACY-02/03	Authenticated tutorial responses containing learner progress are marked public cacheable
High	SHC-LOGOUT-01	Logout leaves admin alias cookies that the auth helper still accepts

The main architectural pattern emerging is authorization at the route boundary is inconsistent: some routes use strong verified-token/permission checks, while other admin or workflow handlers rely on middleware assumptions, raw headers, or only basic authentication. I’m continuing into the remaining API and service files rather than treating this list as complete.
PROJECT-AI-VERIFY-03 — High/Medium, conditional: verifier embeds a fixed admin test credential
File: services/project-ai/app/verification/composer_worktree_verifier.py

The generated Playwright script fills the login form with admin@skillhubcore.in and the password testing.

Risk: If that account/password exists in any shared or production-like identity database, the verification worker contains a reusable credential and may authenticate with more privilege than intended. The risk depends on whether the account is a disposable local fixture or exists in a connected environment.

Recommended control: Use a short-lived test identity provisioned for the isolated verification environment, load credentials from a dedicated test-only secret source, and fail closed if the verifier is pointed at a non-test identity/database. Do not reuse a fixed password in a deployment-capable worker.

This finding is separate from the .env.local copy: the credential is directly embedded in the verifier source, while the environment file creates an additional secret exposure path.
Critical discovery — faculty dashboard SSRF and credential forwarding
FACULTY-SSRF-01 — Critical/High: request-controlled forwarded host becomes a server-side fetch destination
Files:
- apps/faculty-app/src/lib/faculty-api.ts
- apps/faculty-app/src/lib/faculty-live-data.ts
- apps/faculty-app/src/app/(faculty)/dashboard/page.tsx
getFacultyPortalBaseUrl() prefers x-forwarded-host and x-forwarded-proto from the supplied headers, then constructs a URL. fetchFacultyPortalJson() uses that URL as the destination for a server-side fetch().

The dashboard server component obtains request headers through headers() and passes them into getFacultyDashboardSummary() and the related list functions. Those functions call fetchFacultyPortalJson().

The request headers forwarded to that fetch include the browser cookie and a server-injected x-gateway-secret, plus user identity headers.

Risk: If an attacker can supply x-forwarded-host/x-forwarded-proto through the app’s ingress, a request may cause the faculty server to fetch an attacker-controlled destination and send it the session cookie, internal gateway secret, and identity headers. This is an SSRF plus credential-exfiltration risk. Actual exploitability depends on whether the deployed ingress strips or overwrites those headers; I have not tested that.

Recommended control:
1. Never derive a server-side fetch destination from request headers.
2. Use a fixed, allowlisted faculty API base URL from server configuration.
3. Do not forward browser cookies or internal secrets to the faculty app’s own host-proxy fetch; use a minimal header allowlist.
4. At ingress, strip caller-supplied forwarding headers and set trusted values.
5. Add tests with attacker-controlled x-forwarded-host and verify no outbound request is made to it.
This is one of the highest-priority findings because the code combines an attacker-influenced URL with server-side credentials in the outgoing headers.
SkillUp Admin student provisioning
SKILLUP-ADMIN-01 — Critical/High: every created student receives the same hardcoded password
File: apps/skillup-admin/src/app/api/admin/students/route.ts

The POST handler hashes the literal password SkillUp@2025 and stores it as the new student’s password. The code does not show a per-user random temporary credential, forced password reset, or an invitation/verification flow.

Risk: Anyone who knows the fixed password and a newly provisioned student’s email may be able to log in as that student. This creates a predictable credential across all accounts created by this endpoint.

Recommended control: Replace the fixed password with a one-time invitation or cryptographically random temporary credential, store only its hash, enforce expiry and first-login reset, and never use a shared default password. Also ensure the created identity receives the correct SkillUp platform-access mapping and onboarding state.

This is a direct source-level finding; I have not tested whether the live login flow accepts the resulting account or whether a separate password-change gate exists elsewhere.
SKILLUP-ADMIN-PAYMENT-01 — High/Medium: existing installment is selected by label only, not student ownership
Files:
- apps/skillup-admin/src/app/api/admin/payments/route.ts
- packages/db-people/src/schema/payment-installments.ts
The payment POST handler searches existing installments using only paymentInstallments.label === installmentId. If a row exists, it updates that row to paid by its database ID. It does not include the request’s userId in the lookup or verify that the existing row belongs to that student.

The schema does not make label unique; it has a student/due-date index instead.

Risk: If installment labels are reused across students (for example, “Installment 1”), the route may mark the wrong student’s installment paid. This is a payment-record integrity defect, not an unauthenticated access issue—the route does require admin authorization.

Recommended control: Resolve an installment by its actual UUID, or query by both studentUserId and the installment identifier and reject mismatches. Add a database uniqueness rule if the business model requires a unique per-student installment label.
SKILLUP-ADMIN-AUTH-01 — High/Medium: SkillUp admin route guard checks role headers but not brand
Files:
- apps/skillup-admin/src/proxy.ts
- apps/skillup-admin/src/lib/admin-route-guards.ts
The proxy verifies an admin-audience token and checks admin/super_admin roles, but it does not compare the token’s brand/platform claim to the SkillUp admin app. The route guard then authorizes using the x-user-roles header only; it does not independently verify the token or brand.

Risk: A valid admin token from another brand may satisfy the SkillUp admin role gate. This matters especially for SkillUp routes that directly query or mutate the shared people_prod tables rather than forwarding to the API server.

Recommended control: Enforce brand === 'skillup' (and the required platform access) in the proxy and in the route-level admin authorization helper. Derive the role set only from verified auth context; do not treat a raw header as the sole authorization source.

Qualification: The normal Next.js proxy path overwrites x-user-roles from the verified token, so this is not a demonstrated header-spoof bypass through that path. The brand mismatch is the stronger concern and depends on the app’s intended admin-brand policy.
RTH-CONTENT-PUBLISH-01 — High: generic create/update APIs can set isPublished directly
Files:
- apps/realtutorialhub-admin/src/lib/tutorial-content-api.ts
- apps/realtutorialhub-admin/src/app/api/tutorial/content/route.ts
- apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/route.ts
- apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/publish/route.ts
tutorialContentWriteSchema accepts isPublished, adminApprovedBy, adminApprovedAt, and other workflow metadata from the request. normalizeTutorialWritePayload() forwards those values to the repository. Both POST create and PATCH update use that normalized payload.

The dedicated /publish endpoint performs a version snapshot, audit entry, publish operation, event publication, and cache revalidation. The generic create/update handlers can set isPublished: true without running that publication workflow.

Risk: A content editor can bypass the dedicated publication path, including its audit/version/event/cache-revalidation steps. This can leave published content out of sync with downstream indexing or caches and weaken the approval trail.

Recommended control: Remove workflow-owned fields from the generic write schema. Force drafts to remain unpublished in create/update, and permit publication only through the dedicated publish endpoint after explicit approval checks. Treat approval identity/timestamps as server-derived, not client-provided.

This is a direct source-level content-integrity finding; the route does require admin authentication, so it is not an anonymous write issue.
SKILLUP-ADMIN-DATA-01 — High: SkillUp admin data queries are not consistently scoped to SkillUp
File: apps/skillup-admin/src/lib/skillup-admin-data.ts

The shared people_prod database is used for multiple platform identities. In this data layer:
- listAdminStudents() joins admissions/users but does not filter users.platform = 'skillup'.
- listAdminBatches() returns batches without a brand/platform predicate.
- listAdminPayments() returns payment installments across users without a SkillUp filter.
- listAdminPlacementProfiles() returns placement profiles without a platform predicate.
- getAdminDashboardSummary() filters total users by platform = 'skillup', but its batch, payment, placement, admissions, and follow-up aggregates are not consistently brand-scoped.
Risk: SkillUp admin screens and summary metrics may include RealTutorialHub or other-platform records from the shared database. This is a cross-brand confidentiality and reporting-integrity concern.

Recommended control: Add a canonical SkillUp tenant/platform predicate to every brand-specific query and join, including aggregates and detail endpoints. If a table is truly platform-global, document that as an explicit policy rather than omitting the filter by default.
SKILLUP-ADMIN-02 — High: admission/enrollment can attach an existing cross-brand identity without a SkillUp access grant
Files:
- apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts
- apps/skillup-admin/src/app/api/admin/students/[id]/enroll/route.ts
The admission handler finds an existing global user by email and reuses that user ID. The enrollment handler similarly reuses an existing user by ID. Neither visibly verifies that the existing identity belongs to SkillUp or uses the identity bridge/platform-access grant flow before attaching the user to a SkillUp batch.

Risk: An enquiry whose email already belongs to a RealTutorialHub identity may be admitted/enrolled into SkillUp using the same global user ID without a proper SkillUp platform-access grant. That can create cross-brand identity and authorization inconsistencies.

Recommended control: Resolve existing identities through the identity bridge, verify the brand/platform mapping, and grant SkillUp access transactionally before creating admissions/enrollments. Do not use email equality alone as proof of brand membership.
SKILLUP-ADMIN-03 — Critical/High: fixed student password is reused in admission and enrollment flows
Files:
- apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts
- apps/skillup-admin/src/app/api/admin/students/[id]/enroll/route.ts
- apps/skillup-admin/src/app/api/admin/students/route.ts
The same hardcoded password SkillUp@2025 is hashed for newly created student accounts in all three flows. This is not isolated to the student-create endpoint.

Risk: A predictable shared credential can be used to access newly provisioned accounts if the normal login path accepts it.

Recommended control: Replace every occurrence with a one-time invitation or random temporary credential, enforce expiry and first-login reset, and search the full repository for the literal to eliminate remaining provisioning paths.
SKILLUP-ADMIN-CSV-01 — Medium: payment export is not CSV-safe and permits formula injection
File: apps/skillup-admin/src/app/api/admin/payments/export/route.ts

The export handler joins payment fields with commas without CSV quoting or escaping. Fields include studentName, installmentId, and paymentRef, which may contain commas, newlines, or formula-leading characters.

Risk: The export can be malformed, and a value beginning with =, +, -, or @ may be interpreted as a spreadsheet formula when an administrator opens the CSV. Quoting fields alone would not neutralize formulas.

Recommended control: Use a proper CSV serializer that escapes quotes, commas, and line breaks. Neutralize formula-leading values (including after leading whitespace/control characters) before export.

The audit-log exporter quotes fields but does not visibly neutralize formula-leading values either; it needs the same formula-injection policy.
RTH Admin documentation endpoint — path traversal / local file read
RTH-DOCS-01 — High: documentation route can read files outside docs/, including app-local secrets
File: apps/realtutorialhub-admin/src/app/api/admin/docs/route.ts

The handler accepts a caller-supplied path, resolves it relative to the docs directory, and checks only:

absolutePath.startsWith(process.cwd())

The source comment explicitly permits escaping docs/ to read .agent/ files. Because the check allows any resolved path inside the app root, a caller can also request app-root files such as .env.local using a relative path like ../.env.local.

The route does not perform its own requireAdmin() check. The RTH admin proxy normally protects this route, so I’m not calling it an anonymous public read; the issue is that an authenticated admin can use it as a broad local-file reader.

Risk: Application secrets, environment files, private configuration, and other source files may be exposed to any account authorized to reach this endpoint. The prefix-only path check is also weaker than a proper directory-bound check.

Recommended control: Remove the path escape feature. Resolve and validate paths strictly under the docs directory using a separator-aware containment check, allowlist known documentation files, and add route-level admin authorization. Never expose .env*, source, or configuration files through a documentation API.
RTH-ADMIN-AUTH-01 — High/Medium, conditional: RTH admin token validation does not bind the token to the RTH brand
Files:
- apps/realtutorialhub-admin/src/proxy.ts
- apps/realtutorialhub-admin/src/lib/tutorial-content-api.ts
The RTH admin proxy verifies an admin-audience token and checks admin/super_admin roles, but does not compare the token’s brand/platform claim to realtutorialhub. The route-level requireAdmin() checks isAdmin and the role set, but also does not enforce RTH brand access.

Risk: A valid admin token issued for another brand may satisfy the RTH admin gate if presented to this app. This is especially relevant to routes that directly query or mutate tutorial content without going through the API gateway’s brand assertion.

Recommended control: Require the RTH brand/platform claim in both the proxy and route-level guard, and scope direct DB queries to the canonical brand. Keep the SkillUp-side brand check symmetrical.

Qualification: This is a brand-isolation gap in the source. I have not verified whether deployed cookie-domain restrictions or external ingress prevent a cross-brand token from reaching the app.
SKILLUP-ADMIN-CSRF-01 — High: admin mutation endpoints accept simple form submissions without a CSRF check
Files:
- packages/auth/src/middleware/cookie.middleware.ts
- apps/skillup-admin/src/lib/admin-bff.ts
- apps/skillup-admin/src/proxy.ts
- Multiple /api/admin/* POST handlers, including students, payments, batches, and CRM
The shared auth-cookie helper sets SameSite: 'none' and Secure: true. The SkillUp admin BFF’s parseJsonOrFormBody() accepts non-JSON requests as form data. The admin proxy authenticates the cookie and checks roles, but I do not see an Origin/Referer validation or CSRF-token check in the BFF guard.

Risk: A cross-site HTML form may be able to submit a state-changing POST while the browser attaches the administrator’s cookies. The request can pass the proxy’s valid-session/role checks; CORS does not prevent the browser from sending a simple form request.

Recommended control:
1. Add a CSRF token or strict Origin/Referer validation to every cookie-authenticated mutation.
2. Reject application/x-www-form-urlencoded and multipart/form-data on JSON APIs unless form submission is explicitly required.
3. Keep SameSite policy appropriate to the cross-subdomain auth design, but do not rely on SameSite alone.
4. Test cross-origin form POSTs against admin create/admit/payment/batch routes.
This is a source-level CSRF risk. The browser behavior depends on the deployed cookie domain and origin topology, which I have not tested.
FACULTY-BFF-AUTH-01 — Severity strengthened: trusted BFF secret makes the forwarded brand header authoritative downstream
Files:
- apps/faculty-app/src/proxy.ts
- apps/faculty-app/src/lib/faculty-api.ts
- apps/api-server/src/middleware/gateway-auth.middleware.ts
- apps/api-server/src/middleware/internal-auth.middleware.ts
The API server accepts the legacy x-gateway-secret from a trusted BFF. After that secret is validated, its internal-auth middleware trusts x-user-id and x-brand as gateway identity context.

The faculty proxy verifies the token audience and role, but does not validate the token brand. Its upstream-header builder injects the server-side x-gateway-secret and forwards x-brand from the request rather than deriving it from verified auth context.

Risk: A faculty token from one brand may pass the faculty role check, while a caller-supplied x-brand is forwarded under the BFF’s trusted secret and treated as authoritative by the API server. This creates a credible cross-brand authorization path if the faculty app accepts a faculty token from another brand.

Required fix: Validate the verified token’s brand/platform in apps/faculty-app/src/proxy.ts, set x-brand from that verified value, and remove client-supplied x-brand/x-platform before forwarding. Add a test showing a RTH faculty token cannot call SkillUp-scoped faculty APIs (and vice versa).

This is no longer just a generic header-provenance concern: the source confirms the downstream trust behavior. Live reachability and account claim combinations still need runtime testing.
PROJECT-AI-BFF-LOG-01 — Medium: proxy logs complete upstream error bodies
File: apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts

When FastAPI returns an HTTP error, the adapter logs the complete responseText. It also logs the full target URL. The backend may include validation details, manifest data, candidate information, or other request-specific content in error responses.

Risk: Sensitive Project AI artifacts or internal diagnostic details may be copied into the SkillHubCore admin application logs, which can have a broader retention/access policy than the backend data.

Recommended control: Log status, request ID, route template, and a sanitized error code. Do not log full upstream bodies or query strings; redact known sensitive fields and bound any diagnostic excerpt.
COMPOSER-DEV-BYPASS-01 — Medium, environment-dependent: a request header alone activates the development admin bypass
Files:
- apps/skillhubcore-admin/src/app/api/tutorial-composer/import/route.ts
- apps/skillhubcore-admin/src/app/api/tutorial-composer/analysis/route.ts
- apps/skillhubcore-admin/src/app/api/tutorial-composer/block-suggestions/route.ts
- apps/skillhubcore-admin/src/app/api/tutorial-composer/presentation-ideas/route.ts
The dev bypass condition is:
- NODE_ENV === 'development', and
- either TUTORIAL_COMPOSER_DEV_AUTH_BYPASS === 'true' or request header x-tutorial-dev-bypass: true.
So the header alone activates the bypass whenever the app runs in development mode; the environment flag is not required. The bypass fabricates an admin/super-admin identity.

Risk: If a development-mode instance is reachable by untrusted users, they can invoke protected composer APIs as the fabricated admin. A deployment accidentally running with NODE_ENV=development would also be at risk.

Recommended control: Require both a server-side explicit enable flag and development mode; never let a client header enable the bypass by itself. Bind development instances to localhost or a trusted network, and add a startup guard that rejects this configuration outside local development.

This is conditional and lower priority than the unauthenticated admin write routes, but it is a concrete auth-bypass mechanism in the source.
Batch status
This review has now covered the API gateway, API-server auth and route families, both learner BFFs, faculty BFF, RTH and SkillUp admin apps, SkillHubCore admin, and the Project AI FastAPI/worker path.

The highest-priority architectural remediation themes are:
1. Untrusted code execution: isolate Project AI candidate qualification and verification; remove production secrets from worktrees.
2. Admin authorization: secure the SkillHubCore direct-DB CRUD and sidebar APIs before relying on them in deployment.
3. Brand isolation: bind every admin/faculty token and trusted forwarded brand to the actual application brand.
4. Request-derived identity: stop treating raw user/brand headers as authoritative outside a validated trust boundary.
5. Session protection: fix the admin alias-cookie logout behavior and add CSRF protection to cookie-authenticated mutation routes.
6. Data integrity: correct payment installment ownership matching, assignment completion state transitions, and the tutorial publication workflow.
No files have been modified, and I have not run tests, attempted exploits, or verified the deployed ingress/configuration. Findings are based on source inspection; where reachability depends on environment or proxy behavior, I have marked that condition explicitly.

The audit is not complete. The next review segment should continue through the remaining SkillUp/RTH admin detail and mutation handlers, then the API-server service/repository layer and test coverage for the findings already identified.