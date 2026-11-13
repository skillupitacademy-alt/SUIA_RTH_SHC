# R5 existing capability decisions and holds

Current-state hierarchy repair is implemented in the existing HierarchySyncService. Historical failed-job replay is CAPABILITY_ABSENT because its durable failure journal was removed. The owner's approved alternative is current-state reconciliation. Automatic continuation is PENDING OWNER DESIGN APPROVAL under AUTOMATIC_CONTINUATION_PROPOSAL.md. No new recovery registry is authorized.

A failed page has unresolved outcomes and no advancement cursor. A clean bounded page may still have later pages. Caller-controlled continuation remains explicit until a design is approved. The presence of QStash settings has no deployment-verification meaning.

Attendance, payments, Marketing, broad accessibility/performance and tutorial-content browser campaigns remain OWNER HOLD. The faculty application and creation of faculty services remain outside scope. Existing faculty-list source in SUIA can be inventoried without authorizing new faculty functionality.

All195 exported methods are represented in AUTHENTICATED_AUTHORIZATION_MATRIX.csv. Most still lack complete caller-to-repository positive/negative runtime qualification. Those rows remain PENDING or PARTIAL. A passed anonymous sweep, static guard check or imported helper does not close those rows. Untraced callers are explicitly labeled. Live provider/paid-operation positives were not exercised. Existing but unavailable providers must be recorded separately from absent contracts.

R5 local tests target HTTP skillhubcore.localhost:3007, skillup.localhost:3009 and realtutorialhub.localhost:3003. Internal transports point to local API/gateway ports3000 and8787. Remote PostgreSQL tests use only run-owned synthetic UUIDs with cleanup. An RTH environment file contains a production public-web URL default, while the executed probe requests use explicit localhost URLs. That default does not establish a live frontend deployment or qualify local redirect configuration. No production website was tested or deployed.

Q48 remains OPEN. Canonical SHC acceptance and original Q-register statuses require their own evidence and owner acceptance. Migration provenance, Marketing HOLD and release/Docker signoff are outside R5 closure. No ledger mutation, migration, Git commit/push or deployment was performed.

## MainDB schema dependency

Read-only information_schema inspection found that the current MainDB users table lacks tenant_id, local_subject_id and shadow_user_id declared by source. A synthetic fixture insert failed with SQLSTATE 42703 and was cleaned up. The existing core-column quiz fixture successfully tests same-user versus foreign-user ownership. Cross-brand colliding identity semantics and schema alignment remain PENDING OWNER DECISION. No DDL, migration or repair was attempted.
