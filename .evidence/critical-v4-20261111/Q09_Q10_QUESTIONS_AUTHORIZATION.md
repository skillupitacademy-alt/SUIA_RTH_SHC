# Questions end-to-end authorization verification

11 November 2026. Local main at f245e11ee5584018a0f751080595192325e74ee6 plus uncommitted critical fixes.

## Decision

The corrected source passes the focused local HTTP authorization matrix using an isolated gateway with matching configured keys. Qualification of the original saved local environment remains conditional on signing-key alignment. Full three-app acceptance, question mutation workflows and production deployment are outside this result.

## Defects reproduced and correction

The initial real HTTP run returned 200 from the backend current-account endpoint and through the gateway current-account route, but 401 for authorized Questions requests. Ten unauthorized Questions probes returned the expected 401/403.

Two independent forwarding problems were confirmed.

1. The SHC forwarding adapter omitted x-portal-identity. The existing uncommitted fix injects shc-admin only for Questions paths after successful SHC authentication and administrator authorization.
2. Gateway authenticateRequest reduced the SHC administrator identity to admin. proxyRequest then replaced the trusted shc-admin header with admin, causing backend verification to expect aud=admin for a token issued with aud=shc-admin. Two new regression tests failed with actual header admin before the correction.

The gateway now derives the downstream shc-admin portal from the verified signed audience and skillhubcore brand after its existing token-type, tenant and role checks. A caller-controlled portal header cannot create this identity. Other tenant-admin and learner behavior is preserved.

Changed production paths in this focused continuation are services/api-gateway/src/middleware/auth.ts, src/index.ts and src/lib/proxy.ts. Four focused regression cases were added to services/api-gateway/src/__tests__/gateway.test.ts.

The saved local gateway .dev.vars also uses a signing key different from the configured SHC/backend key. The backend identity route succeeded because its public gateway route forwards the token to the backend for verification. Protected Questions invokes gateway verification and therefore rejects the mismatched key. No secret values were printed or stored in the report.

## Direct runtime evidence

An existing owner-designated active SHC administrator was selected using a parameterized SELECT in a READ ONLY transaction followed by ROLLBACK. Short-lived signed JWT probes used configured keys and were held in memory. No password login, refresh-token issuance, account mutation or Questions write was performed. Question bodies and personal account data were excluded from saved evidence.

To isolate configuration, a separate local gateway on 127.0.0.1:8788 loaded a temporary configuration outside the repository with matching SHC signing keys and the real local backend on port 3000. SHC was restarted on HTTP port 3007 with process-only gateway/identity overrides. INTERNAL_API_URL was empty for the final run, ensuring Questions used the gateway rather than the existing direct-backend override. No saved environment or deployment configuration was changed.

The final actual HTTP chain was SHC BFF and its guards, real gateway JWT verification, real API-server guards/handler, CQRS and database-backed read. Its identity authority also performed a real account lookup through the gateway. There were no mocked fetch calls or repository stubs in this runtime probe.

| Scenario | Expected | Actual | Result |
| --- | --- | --- | --- |
| Backend current eligible administrator | 200 with matching active account identity and current role | 200, body verified | PASS |
| Gateway current eligible administrator | 200 with matching identity | 200, body verified | PASS |
| Backend Questions signed SHC administrator | 200, Questions list contract | 200, list contract verified | PASS |
| Isolated gateway Questions signed SHC administrator | 200, Questions list contract | 200, list contract verified | PASS |
| Full SHC Questions current administrator | 200, Questions list contract | 200, list contract verified | PASS |
| Full SHC Questions admin-level claim | 200 with existing read permission | 200, list contract verified | PASS |
| Anonymous request | 401 | 401 | PASS |
| Forged user/role/brand/portal/secret headers without a session cookie | 401 | 401 | PASS |
| Signed student-role claim with forged admin headers | 403 | 403 | PASS |
| Wrong signed audience | 401 | 401 | PASS |
| Wrong signed brand | 401 | 401 | PASS |
| Wrong signed token class | 401 | 401 | PASS |
| Expired signed token | 401 | 401 | PASS |
| Explicit inactive token claim | 401 | 401 | PASS |
| Unknown account identity | 401 | 401 | PASS |
| Invalid signature | 401 | 401 | PASS |

All 16 probes passed. Positive lists were limited to one record and checked for array/total response compatibility. Response records and account details were discarded. Negative cases were denied despite forged administrator headers. The inactive-token test exercises an explicit signed claim. It does not claim an actual account was deactivated. The admin-level positive case uses a reduced admin claim for the existing administrator and the live least-privilege reconciliation, without changing the account role.

questions-readonly-results.json contains redacted final outcomes and request IDs. questions-gateway-chain-runtime.log records the successful final run. questions-before-gateway-fix.json retains the earlier failed positive cases. questions-readonly-probe.cjs is the reproducible read-only runner. Set SHC_VERIFICATION_EMAIL to the owner-designated account through the environment and SHC_VERIFICATION_GATEWAY to the approved local gateway. It never saves JWTs or connection strings.

## Regression and quality evidence

- Four focused gateway regression tests passed with exit 0. They verify both admin/super_admin SHC portal reconstruction, tenant-admin forged portal non-elevation and learner rejection before forwarding. Real JWT signing/verification executes. Outgoing fetch is mocked for these unit tests.
- SHC test:security returned 65 passed across two files, exit 0.
- SHC check:boundaries verified 80 handlers, exit 0.
- Gateway type-check returned exit 0 after the source correction.
- git diff --check returned exit 0.
- Q08 login verification remains 6 browser checks and 3 unit tests passed, with SHC type-check exit 0.

The broader gateway two-file run failed with 17 passed and 43 failed. Many existing tests use api.example.com without a resolvable trusted tenant. To distinguish regressions, the committed gateway source was extracted into an evidence-only baseline and executed with the same test dependencies. That baseline returned 13 passed and the identical 43 failed test titles. The current source adds four passing cases with zero newly failing titles. This comparison establishes unchanged baseline failures for the selected files. It does not make the broader gateway suite pass. Initial baseline attempts failed to discover tests or resolve @quiz/auth, and were corrected in the evidence-only configuration before the valid comparison.

The first wide login ESLint attempt was interrupted after stalling. A package-local narrowed retry also stalled. Browser tests and typechecks are passing evidence, while final login lint needs a successful recorded rerun. No lint PASS is claimed here.

## Remaining work

1. Align the normal local gateway signing configuration with the existing SHC/API issuer through the appropriate configuration workflow. The saved original environment continues to differ. Preserve the key secrecy and the existing tenant-admin/user contracts.
2. Repeat the 16 read-only probes against that normal configuration before claiming default-environment acceptance. Do not silently substitute isolated runtime evidence for normal-runtime proof.
3. Reconcile the 43 demonstrated pre-existing gateway test failures separately. Preserve strict brand resolution.
4. Persisted account-disable/demotion experiments and Questions create/edit/delete are outside this read-only verification. They require controlled fixtures and applicable owner authorization.

All code changes remain uncommitted. Canonical acceptance ledger, database schema and deployment are unchanged. No migrations, data deletion, paid providers or production deployment were performed.

After the qualification run, the isolated gateway was stopped and its temporary secret/configuration files were removed. SHC was restarted using its saved configuration. The original gateway on port 8787 was preserved. The saved key mismatch therefore remains visible for correction and is not concealed by leaving special verification settings active.
