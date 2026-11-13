# R5 hierarchy synchronization cases

Baseline is main at 7f8c952a5a19b0e1ca04c4ed307b1a8c7abefc86. hierarchy-before.json records the original five failing tests. Historical tutorialSyncStatus fields were removed by commit 742c2f9414858670467f243579a372cc4aaa62db. No column or failure journal was restored.

| Case | Original problem | Current assertion and disposition |
| --- | --- | --- |
| A1 topic and parents | Test expected removed MainDB status writes | Preserve parent-first TutorialDB upserts and stable external IDs. Assert no MainDB status mutation. Unit current-contract test passes. |
| A2 subtopic and full chain | Test expected removed status writes | Assert domain, subject, topic and subtopic mapping relationships and canonical IDs. Real remote chain and idempotency tests pass. |
| A3 failure | Removed status field assertion concealed the real failure contract | sync now returns the actual boolean result. Real transaction rollback, structured failure logging and unsuccessful summary are asserted. Background callers already discard results explicitly and continue to use existing logging. |
| A4 syncAll | Historical status writes were expected | Preserve compatible total/succeeded/failed. Discover active undeleted sources in stable order. Test failed-item counting and independent successful commits. No blanket bulk sync was executed remotely. |
| A5 retryFailed | Empty work list falsely reported success and could never recover anything | Reconcile current MainDB/TutorialDB state through the existing service and signed worker. Scoped remote tests demonstrate detection, repair, retained deleted mappings, rollback, timeout, deletion race and rediscovery. Historical failure replay has no journal. |

The first revised unit run recorded five passes and the unresolved retry test. The reconciliation unit run then passed all six current-contract tests. Additional targeted receipts and final runs are recorded separately. The first remote harness omitted MainDB relation definitions and failed nine scenarios. The harness now uses the same relation definitions as production, with failure receipts retained. A later real worker HTTP test reached successful repair but required its cache assertion to recognize the existing middleware's no-store canonicalization. These failures are preserved.

Reconciliation uses existing ancestor locks and re-reads authority after locking. It compares external ID, canonical name and target parent UUID, then upserts only drifted mapping rows in a TutorialDB transaction. Existing target slug and difficulty levels are preserved on conflict. Soft-deleted target rows fail closed and require an explicit restoration decision. Inactive source chains are skipped. Missing or deleted authoritative parents fail closed. Target commits are verified while MainDB locks are held.

At most 100 entities can be requested, with a default 50. The loop yields between completed entities after 30seconds. Individual database operations retain existing timeouts. This is a bound on page work and between-entity decisions, not a hard request deadline or cancellation of an already committing transaction. No distributed transactional atomicity is promised.

A bounded unfinished scan returns complete=false with nextCursor only if the page has no unresolved failures. Failed pages must be retried from their existing position. The current cursor is JSON authenticated by its signed request envelope. No standalone signed cursor or automatic continuation is implemented. Automatic continuation has a separate design proposal and requires owner approval. No full hierarchy acceptance follows from one scoped fixture or one completed page.

Summary counts describe candidate entities, each of which may require a complete parent chain. They are not counts of distinct target rows or historical failed jobs. Default discovery scans active undeleted MainDB source rows only. It does not delete TutorialDB-only orphans or prove a global snapshot across multiple pages. Direct SQL writers remain outside the lock protocol.
