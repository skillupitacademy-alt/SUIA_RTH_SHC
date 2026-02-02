# Task List: Question Factory Phase 2 (Ingest & Parser)

## Goal
Implement the "Fallback Mode" ingestion pipeline, allowing users to paste external JSON and validate it.

## Checklist
- [ ] **Ingest Component**: Create `JsonIngestBox.tsx` with a large text area and "Process JSON" button.
- [ ] **Data Schema**: Define the TypeScript Interface `GeneratedQuestionBatch` matching the Spec contract.
- [ ] **Validator Service**: Create `src/lib/factory/json-validator.ts`
    -   Function: `validateBatch(jsonString: string): ValidationResult`
    -   Checks: Valid JSON syntax, Required Keys (`questionText`, `options`, `correctAnswer`), Option count (4).
- [ ] **Error UI**: Display specific validation errors (e.g., "Question 3 is missing 'correctAnswer'").
- [ ] **State Management**: Create a Context/Store (`FactoryContext`) to hold the "Staged Questions".

## Verification
- [ ] **Happy Path**: Paste valid JSON -> Navigate to Review Console (Next Phase).
- [ ] **Sad Path**: Paste invalid JSON -> See clear error message.
- [ ] **Auto-Fix**: (Bonus) Test if system handles minor format issues (like missing quotes).
