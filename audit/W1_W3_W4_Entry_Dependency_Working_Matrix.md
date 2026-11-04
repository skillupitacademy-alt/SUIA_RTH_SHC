# W4 entry dependency working matrix

Source: `Architecture_Remediation_Execution_Plan.md` W4.1–W4.6 and consolidated assignment, revision 5c498f29. All entries below are PENDING, not accepted or excepted. Dependency associations are working review inputs inferred from the named W4 scope; Sol must confirm the full dependency graph and review evidence before authorization to enter W4. The plan additionally requires Critical = 0; High = 0 or explicitly accepted with owner/date; Gates 1A–1H VERIFIED; CI green; and independent re-audit complete. These are not established by offline source controls.

| W4 item | Foundation dependency and evidence still needed |
| --- | --- |
| W4.1 taxonomy boundary | FND03/FND06 tenant and admin authority; FND19/FND24 taxonomy schema/caller contracts; FND26 gates. A documented repository contract, real hierarchy positive and malformed/foreign negatives remain pending. |
| W4.2 tutorial sidebar | FND03/FND05 private owner/store policy; FND21/FND24 tutorial/ILS identity/navigation contracts; FND10 physical/browser evidence. Legacy, canonical, telemetry and persistence lanes cannot substitute for one another. |
| W4.3 question factory | FND20/FND24 question schemas, aliases, editor/import/review ingress and round-trip; FND03/FND06 admin context; FND26. 45947f8c is narrow UI containment, not canonical contract acceptance. |
| W4.4 composer concurrency | FND03 publication semantics and reviewed tutorial authority, FND21 version/identity contract, FND25 transaction sensitivity; persisted version/locking change requires selected policy and separate scope. |
| W4.5 Project LLM governance | FND08/FND09 verified actor and gate authority, FND15 truth, FND22/FND24 governance contracts. Python service source-root scope and selected approval permission unresolved. |
| W4.6 observability/errors | FND26 supported quality gates and FND23 event semantics, plus applicable security boundaries and sanitized error evidence. No cross-domain aggregate pass is established. |

G1–G9 remain open; no Sol exception has been recorded here. W4.1–W4.6 remain PLANNED. This matrix is a readiness input, not approval to start runtime restructuring.
