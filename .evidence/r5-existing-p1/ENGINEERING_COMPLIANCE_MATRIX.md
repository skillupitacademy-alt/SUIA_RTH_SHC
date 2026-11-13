# R5 engineering findings on affected code

| Requirement | Applied evidence | Bounded disposition |
| --- | --- | --- |
| Existing authoritative owner, SRP, SoC | Hierarchy recovery stays in HierarchySyncService and existing signed worker. Profile mutable-field projection is enforced in the owning API handler. Brand BFFs forward the existing device credential pair. | PASS for touched corrections. Full three-app owner map remains PENDING. |
| DRY/KISS/YAGNI | Reuse existing ancestor locks, transactions, upserts, role/session authorities and worker. No recovery store, new provider or module introduced. | PASS for the bounded changes. |
| OCP/LSP/ISP/DIP | Existing entry points and provider contracts retained. sync exposes boolean outcome to awaiters; existing fire-and-forget callers continue with their existing logging. Summary retains total/succeeded/failed and adds explicit reconciliation fields. | PARTIAL pending all downstream callers and affected gates. |
| Least privilege/object ownership | Profile mass assignment reproduced through actual local HTTP on both brands. Runtime parser removes userId/id/tenant and database fields before UPDATE. Existing authenticated owner WHERE predicate remains authoritative. | Verified targeted positive and negative fixtures, with cleanup. |
| Credential/session protection | RTH progress forwards same-device access+refresh pair instead of dropping refresh. Equivalent SUIA path now forwards the pair to preserve direct backend validation. Existing CSRF proof is retained. | Actual HTTP and regression unit evidence. |
| Private caching | Existing RTH private list responses now use private,no-store. Middleware permits only the two exact existing read paths without requiring a browser-held gateway secret, while preserving current-session and handler checks. | Bounded HTTP200 and proxy negative/unit evidence. Remaining route cache matrix PENDING. |
| Transactions, failure and retry | Reconciliation revalidates after locks, rolls back failed TutorialDB work, checks committed mapping state and withholds success on unresolved failure. Failed pages expose no advancement cursor. | Real remote scoped evidence. Automatic run continuation remains PENDING approval. |
| Strict typing and testability | Explicit source/target/result types and runtime profile parser. Mocked tests label their boundary. Separate real HTTP/PostgreSQL receipts retained. | Final typecheck/lint/build receipts govern the gate. |
| Safe errors/observability | Worker returns sanitized failure and no-store. Existing private structured hierarchy error event retained. | Scoped PASS. Comprehensive logging review PENDING. |

No criterion in this document confers application-wide acceptance. The existing source includes broader legacy defects and absent/unavailable capabilities outside this correction. Attendance, payments and Marketing retain OWNER HOLD. Accessibility/performance and release gates retain their separate owners.
