# W4 entry dependency working matrix

Source: `Architecture_Remediation_Execution_Plan.md` W4.1–W4.6 and consolidated assignment, revision 5c498f29. All entries below are PENDING, not accepted or excepted. Dependency associations are working review inputs inferred from the named W4 scope; Sol must confirm the full dependency graph and review evidence before authorization to enter W4. The plan additionally requires Critical = 0; High = 0 or explicitly accepted with owner/date; Gates 1A–1H VERIFIED; CI green; and independent re-audit complete. These are not established by offline source controls.

| W4 item | Foundation dependency and evidence still needed |
| --- | --- |
| W4.1 taxonomy boundary | FND03/FND06 tenant and admin authority; FND19/FND24 taxonomy schema/caller contracts; FND26 gates. A documented repository contract, real hierarchy positive and malformed/foreign negatives remain pending. |
| W4.2 tutorial sidebar | FND03/FND05 private owner/store policy; FND21/FND24 tutorial/ILS identity/navigation contracts; FND10 physical/browser evidence. Legacy, canonical, telemetry and persistence lanes cannot substitute for one another. |
| W4.3 question factory | FND20/FND24 question schemas, aliases, editor/import/review ingress and round-trip; FND03/FND06 admin context; FND26. 45947f8c is narrow UI containment, not canonical contract acceptance. |
| W4.4 composer concurrency | FND03 publication semantics and reviewed tutorial authority, FND21 version/identity contract, FND25 transaction sensitivity; persisted version/locking change requires selected policy and separate scope. |
| W4.5 Project LLM governance | FND08/FND09 verified actor and gate authority, FND15 truth, FND22/FND24 governance contracts. Bounded transition actor scope is authorized; Gate 1 permission and artifact hash contract remain unresolved. |
| W4.6 observability/errors | FND26 supported quality gates and FND23 event semantics, plus applicable security boundaries and sanitized error evidence. No cross-domain aggregate pass is established. |

G1–G9 remain open; no Sol exception has been recorded here. W4.1–W4.6 remain PLANNED. This matrix is a readiness input, not approval to start runtime restructuring.

## Updated decision and evidence checkpoint

The current Sol checkpoint selects verified tenant plus tenant-local subject for learner ownership, unknown historical provenance denial, and registered/payload event type equality; those decisions do not establish migrated storage or event processing atomicity. FND03 migration drafts and FND23 producer/consumer compatibility trace are review inputs only. FND08's bounded transition actor correction `488578ef` has isolated passing handler controls but remains IMPLEMENTED_UNVERIFIED; the separate Gate 1 actual service denial control still fails. FND11 admission, FND03 export tenant isolation and FND23 event-type controls remain failed. Consequently every W4 item above remains PENDING, and no exception or readiness is implied.

Additional current failed controls: FND05 legacy progress loses a concurrent completion under a deterministic adapter; FND07 worker fixture reads and writes private navigation cache; FND20 comma-bearing option text can credit an incorrect selection; FND21 incomplete D1/I1 authoring picks up example claims; FND22 accepts non-hex artifact hash; FND23 cross-brand and correlation dedupe collisions. Each remains fixture-scoped, not evidence of physical deployment, and none establishes W4 readiness.
