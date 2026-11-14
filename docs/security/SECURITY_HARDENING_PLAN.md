# Security Hardening Plan

Top risks (current)
- /api/migrate is public by code path.
- Access tokens stored in localStorage.
- Factory endpoints are not admin-gated.

Hardening steps
1) Remove /api/migrate from public routes.
2) Require an internal secret or remove the route entirely in production.
3) Move access tokens to httpOnly cookies.
4) Enforce admin role checks on factory routes.
5) Add strict input validation and schema checks on all write endpoints.
6) Add audit logs for admin actions and sensitive updates.

Access token migration (minimal steps)
- Server sets access token as httpOnly, secure cookie on login and refresh.
- Client stops reading accessToken from localStorage.
- API client relies on cookies for auth and refresh.
- Remove accessToken persistence from Zustand stores.
- Validate CSRF still passes with cookie-based auth.

Authentication
- Short-lived access tokens.
- Refresh tokens in httpOnly cookies.
- Token rotation with reuse detection.

Authorization
- Centralized RBAC checks for all admin endpoints.
- Ownership checks for exam operations.

Data protection
- Encrypt PII at rest.
- Minimize PII in logs.
- Use secrets manager for keys.

Operational security
- WAF and DDoS protection at edge.
- Per-tenant rate limiting.
- Vulnerability scanning in CI.


## R6-B owner decision recorded 14 November 2026

This entry records the latest owner sequencing decision under PSEG-001 proposed v1.1 and its owner-decision precedence. The current development, architecture remediation and relevant Markdown/CSV governance, implementation and acceptance documentation work must complete before the dedicated project-wide credential program starts. Program execution is DEFERRED — OWNER DECISION. This decision authorizes documentation only.

### Open incident R6B-SEC-01

| Field | Recorded finding |
|---|---|
| Incident | Neon PostgreSQL connection credential appeared in a serialized pg driver diagnostic during disposable branch qualification. |
| Identified | 14 November 2026, first separate-database test run at approximately 01:32 UTC. |
| Affected system/category | Neon platform-people qualification branch br-young-silence-a1b1ta26, database-owner SQL credential. Reach beyond that branch and password reuse elsewhere are unknown. |
| Evidence | Qualification report and evidence commit 8ca7ad05e04cf15f6cdce16afb4ad8a84852ee68, crossdb-initial-summary.txt, CROSS_DATABASE_INITIAL_EXECUTION.json. |
| Exposure circumstances | Forced database cleanup produced PostgreSQL 57P01. The driver diagnostic serialized connection parameters into a raw test log and tool output. |
| Known impact | A credential that successfully authenticated during qualification was disclosed in the diagnostic. The role used in qualification could create and mutate disposable resources. |
| Unknown impact | Viewers, retention/access to tool output, credential reuse, access beyond the verified target, and misuse remain uninvestigated. No fresh provider/session-log review was authorized or executed here. |
| Evidence limitation | A Windows-encoding failure during attempted redaction truncated the initial raw log. The reconstruction summary and original nonzero execution receipt remain. Original raw diagnostic completeness cannot be recovered from the committed evidence. |
| Workflow status | DEFERRED — OWNER DECISION. |
| Security risk | OPEN, HIGH. Documentation and a negative committed-file scan do not close the exposure. |
| Accountable decision owner | Project owner. Security Operations owns the later remediation program. |
| Recommended remediation | Rotate/revoke the exposed credential, update authorized consumers, validate new access and old-credential rejection, assess sessions/audit activity, and record scope and results. Execution is deferred. |
| Sequencing prerequisite | Completion of current project documentation and architecture work, followed by explicit authorization of the dedicated security phase. |
| Review/expiry | No calendar expiry was supplied. Review at the documentation/architecture completion milestone. New misuse or exposure evidence requires renewed incident review. Deferral remains an open risk until verified remediation. |
| Closure evidence | Owner-approved change receipt, provider-side revocation/rotation evidence, inventory of authorized consumers, positive new-credential and negative old-credential checks with secrets omitted, session/access assessment, sanitized artifact review, and accountable security signoff. |

The prior Secrets Rotation Strategy emergency guidance calls for immediate revocation. The latest owner decision explicitly defers this incident's rotation. This is a recorded owner exception with OPEN risk. It provides no security acceptance or release waiver. No live credentials, permissions, sessions or production configuration were changed in this documentation task.

### Available containment without rotation

Further use of the exposed connection should be avoided where feasible. Current work can use committed source and sanitized receipts. Keep connection values outside chat, tracked files, command output and reports. The qualification harness corrected logging before its successful rerun, and assignment-created scratch databases, synthetic data, backup files and temporary client utilities were removed as recorded in FINAL_DATABASE_STATE.json.

The owner can restrict access to existing diagnostic/thread artifacts using provider-supported access controls, review access activity through authorized tools, and delete the disposable qualification branch after evidence review and dependency confirmation. These measures have not been executed by this task. Deleting a branch does not establish credential revocation or absence of reuse. Provider/network restrictions, session termination and live permission changes require their own approved operating scope.

### Future project-wide credential governance requirement

The dedicated later security phase must inventory SHC, SUIA, RTH and their shared dependencies. Required categories include all Neon/application database credentials, Cloudflare API tokens and gateway secrets, Google Cloud/Cloud Run identities and service credentials, internal service authentication, JWT signing/verification secrets, third-party and AI-provider keys, Redis/storage/messaging credentials, GitHub Actions secrets, VPS/deployment access and other credentials found in the inventory. Inventory metadata must record secret references and identifiers without values.

| Required control | Evidence expected from the later security phase |
|---|---|
| Ownership and inventory | Named accountable owner, provider, environment, credential purpose, consumer/dependency map, privileges, expiry and protected secret reference. |
| Environment separation and least privilege | Independently scoped development/test/production identities, minimum grants, approved access paths and service-account authority. |
| Secret storage | Approved secret store and injection mechanism, operator/access controls, backup/recovery handling and exclusion from Git, logs, client bundles and ordinary documents. |
| Rotation triggers and cadence | Immediate exposure/revocation response procedures plus owner-approved risk-based periodic intervals. Existing SOP intervals are reference policy and require reconciliation with actual provider/consumer capabilities. |
| Exposure response | Containment authority, incident scope, access/session review, notification decisions, evidence preservation, revocation sequence and tracked residual risks. |
| Rollout and validation | Dependency-aware change order, supported overlap only where verified, maintenance/session impact, new-credential success, old-credential rejection and affected application health/security checks. |
| Emergency recovery | Approved rollback or forward-repair plan that does not silently reactivate exposed credentials. Define outage handling and recovery ownership. |
| Audit and closure | Redacted provider receipts, exact source/config references, execution timestamps/results, outstanding exceptions and owner/security acceptance. |

Two existing Git paths differ only by case, docs/security/SECRETS_ROTATION.md and docs/security/secrets-rotation.md, and contain different SOP text. Their coexistence is a Windows-path governance ambiguity. Both committed blobs are preserved. This dated owner decision is recorded in the existing Security Hardening Plan and Risk Register rather than adding a third rotation document. Consolidation of those historical SOP paths needs a separate document-owner decision.

Traceability uses RC-OBS-01 and RC-ID-01, PSEG-U07/PSEG-U10, acceptance annex U-07/U-09 and the relevant SHCA-U07/SHCA-U09 notes. Canonical acceptance states remain separate from the incident workflow state.
