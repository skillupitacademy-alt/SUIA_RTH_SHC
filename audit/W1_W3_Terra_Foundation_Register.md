# W1–W3 foundation register (initial source-backed slice)

Baseline df81a5c0, clean before FND07. This is an incomplete register, not an exhaustive finding disposition. Authority: FinalAechitecture.md and Architecture_Remediation_Execution_Plan.md; original IDs come from CompleteProjectAudit.md, CompleteProjectMatrix.md and Audit_Finding_Root_Cause_Crosswalk.csv. Full audit/crosswalk enumeration remains FND01 work.

| Group / task | Original finding / root cause | Owner/source | Status / dependency |
| --- | --- | --- | --- |
| G1 FND07 | J-R1/J-R2 / RC-ID-01, RC-TUTORIAL-01 | `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`; manifest `W1_W3_FND07_Lifecycle_Slice_Manifest.md` | IMPLEMENTED_UNVERIFIED in 995e1f35; Sol independent review and browser/auth-owner gates pending. |
| G1 FND03-FND06 | RC-ID-01 / RC-DB-01 | Batch 08 resource and progress design; export/admin/progress routes | Conflicting tenant and foreign equal-ID failures remain; Sol tenant/resource policy and historic provenance required before runtime changes. |
| G2 FND11 | W1.2-EMAIL / RC-ID-01 | identity bridge and people lookup | Consumer inventory, equal-email controls and Sol decision pending; migration separate. |
| G3 FND14 | DATA-02 / RC-TRUTH-01, RC-ASSESS-01 | `src/share-branding/ExamSummaryReport.tsx`: fallback counts, percentile, concepts, subject/date and skills | IMPLEMENTED_UNVERIFIED for bounded report slice in 2d865a14; full assessment surface inventory remains open. |
| G3 FND13 | RC-TRUTH-01 | `apps/skillup-web/src/lib/skillup-data.ts`: fallback programs/faculty/batch/placement, generated recording URLs and placement match fallback | Confirmed source; enumerate active callers and distinguish unavailable/empty before behavior edits. |
| G3 FND15 | SHC-PLLM-AUDIT-TRUTH-001 / RC-TRUTH-01, RC-PLLM-01 | CompleteProjectAudit.md workflow-details findings | Actual current consumer verification and authority dependencies pending. |
| G4-G9 FND18-FND23 | RC-CONTRACT-01 and domain root causes | auth, taxonomy, question, tutorial, Project LLM and event contracts | Per-domain verified drift, consumer manifests and W1 authority dependencies pending; no consolidated acceptance. |

Unknown historical provenance, physical tenant routing, actual browser identity transitions and deployment gates are not inferred from offline fixtures. No group is accepted or closed by this register.

Additional original audit finding outside the 91-row crosswalk: SHC-PLLM-AUDIT-TRUTH-001 -> `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/workflow-details/page.tsx` -> FND15 bounded correction `3f988db2`, IMPLEMENTED_UNVERIFIED. Fetched workflow status retained; fabricated audit/evidence removed; backend evidence/approval and Sol acceptance remain pending. Specification-review and explorer reference issues are separate newly source-backed findings, not this original ID. This addition does not make the register exhaustive.
