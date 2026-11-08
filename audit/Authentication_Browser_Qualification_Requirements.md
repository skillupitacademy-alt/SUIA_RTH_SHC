# Authentication browser qualification - owner requirements

Recorded: 2026-11-03 from the owner's explicit instruction in the Sol chat.
Status: mandatory requirement; browser execution NOT STARTED.
Owner live-data scope update: `W1.2_Browser_Live_Neon_Owner_Authorization.md` records
explicit authorization for bounded local-browser smoke journeys against existing Neon
bindings. Its explicit live mode supersedes isolation-only prerequisites for that pass;
it does not authorize production-domain browser tests, destructive scenarios or false
synthetic/isolated fixture claims.
Execution tracking authority: Architecture_Remediation_Execution_Plan.md.
Architecture authority: FinalAechitecture.md. This requirement supplements existing
source acceptance; it does not replace either authority or the accepted identity contracts.

## Stage A - early controlled Chromium smoke qualification

Do not postpone every browser check until Wave 8. Once accepted authentication code
is integrated and running in a controlled local or staging environment, assign a
separate, bounded Playwright task using Chromium. Pin the source/build revision,
environment, hostnames, application routes and configuration actually under test.
Do not claim a server contains accepted code merely because its branch name matches.

Use dedicated authorized test accounts and securely provided environment credentials.
Do not place passwords, cookies or tokens in reports, screenshots, console output,
HAR files or Playwright traces. Configure capture before login: disable sensitive
capture or redact it before retention. Retain useful failure evidence without secrets.
Do not request that credentials be pasted into chat or committed into source.

Cover the actual SUIA learner, RTH learner and SHC administrator journeys:

- Valid login, protected dashboard and relevant protected API access.
- Invalid credentials and cross-tenant authorization denial.
- Refresh under the approved policy; distinguish known SHC compatibility gaps from
  an implemented refresh capability. Re-login alone is not proof of refresh.
- Logout and post-logout access under the actual session contract. Cookie removal
  alone is not proof of immediate invalidation of an already-issued stateless JWT.
- Same-email accounts remain independent across SUIA and RTH.
- Account switching does not expose the previous account's private state.
- Blocked-account refresh rejection in controlled fixtures; do not change real users.
- Host-specific cookies, redirects and learner/admin principal boundaries.

Record executable commands/test IDs, results/exit codes, exact tested source/build,
redacted failure evidence and independent verification. Report unsupported scenarios,
fixture limitations and failures explicitly. Unit tests and builds do not constitute
browser/runtime acceptance. Deterministic rotation races and rollback still require
appropriate API/persistence tests in addition to browser checks.

## Stage B - formal Wave 8 six-environment qualification

| Application/principal | Environment | Owner-required host |
| --- | --- | --- |
| SUIA learner | Production | user.skillupitacademy.com |
| SUIA learner | Local | skillup.localhost:<port> |
| RTH learner | Production | user.realtutorialhub.com |
| RTH learner | Local | realtutorialhub.localhost:<port> |
| SHC staff/admin | Production | skillhubcore.in |
| SHC staff/admin | Local | skillhubcore.localhost:<port> |

Use approved environment configuration for actual ports, routes, cookie rules and
any staging mapping. Staging is not a substitute claim for production verification.
Preserve the complete formal matrix under Wave 8, including deployed version evidence.
Production deployment and production testing require separate owner authorization,
approved synthetic accounts and non-destructive operations. Neither is authorized
by this document. Never infer deployed results from a local smoke test.

## References required in relevant tasks

Reference this file in authentication browser tasks, relevant login/logout/dashboard,
session/refresh/authorization implementation acceptance criteria, and Wave 8 handoffs.
Require runtime evidence where behavior depends on browser or deployment boundaries.
Apply SOLID, DRY, KISS, YAGNI, Separation of Concerns and least privilege within each
ticket. Do not turn smoke qualification into broad application refactoring.

Batch 04 source-investigation acceptance remains recorded in W1.2_Batch_04_Sol_Acceptance.md.
Its closure does not satisfy this browser requirement or close RC-ID-01.
