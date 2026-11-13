# R5 real hierarchy synchronization recovery

Current-state reconciliation is implemented in the existing HierarchySyncService and signed retry worker. Its exact source changes, five baseline case dispositions,14 real remote/HTTP scenarios, bounded continuation semantics and limits are recorded in SOL_R5_EXISTING_P1_SECURITY_ENGINEERING_REVIEW.md and .evidence/r5-existing-p1/HIERARCHY_SYNC_FIVE_CASES.md.

The valid flow remains SHC Admin -> authoritative MainDB hierarchy -> existing backend synchronization service under MainDB ancestor locks -> TutorialDB mappings -> canonical SUIA/RTH consumers. No tutorial content journey was repeated. Missing/stale mappings are repaired only for explicit eligible source chains. Retained deleted mappings require an explicit restoration decision.

Historical failed-job replay cannot be reconstructed from current state. Automatic page chaining, independent signed cursors and durable restart are not implemented. The owner selected a design proposal only. Review .evidence/r5-existing-p1/AUTOMATIC_CONTINUATION_PROPOSAL.md before a separate implementation decision.

The final bounded suite passed 14 scenarios with exit 0 and exact-UUID cleanup. Full platform and Q48 acceptance remain OPEN, with the remaining method/resource matrix and owner decisions controlling their own gates. All four affected local production builds passed with exit 0. No blanket remote sync, schema change, new service, commit, push or deployment occurred.
