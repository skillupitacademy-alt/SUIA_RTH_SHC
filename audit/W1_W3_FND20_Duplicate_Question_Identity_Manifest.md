# FND20 duplicate question identity follow-up manifest

Baseline a506e8d2, SHC-IDENTITY-002 / RC-CONTRACT-01. The question list uses ID for selection/edit/delete and React keys; duplicate IDs within a response cannot identify distinct rows. Allowed production file `apps/skillhubcore-admin/src/components/questions/QuestionTable.tsx`, adjacent mounted test. Reject duplicate IDs in the same response, while retaining valid unique IDs. Do not change backend or cross-page identity policy. Isolated mocked API with fail-closed fetch; real API/browser NOT EXECUTED. Sol review required.

Verification: root, DB/cache/queue keys removed, programmatic Vitest `config: false`, jsdom, React plugin and explicit SHC `@` alias selecting `question-timestamp-truth.test.tsx`: exit 0, 4 passed including duplicate, absent/blank and valid identities with mocked API and blocked fetch. SHC `pnpm exec tsc --noEmit` exited 0. No real API/browser execution. Whitespace check passed; IMPLEMENTED_UNVERIFIED.
