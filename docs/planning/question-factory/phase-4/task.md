# Task List: Question Factory Phase 4 (Intelligence & Hygiene)

## Goal
Establish system integrity by implementing Duplicate Checks, Skill Taxonomy Validation, and Final Persistence.

## Checklist
- [ ] **Skill Service**: Create `src/lib/factory/skill-service.ts`.
    -   Fetch existing skills.
    -   Comparison Logic: Flag "New" skills vs "Existing".
- [ ] **Duplicate Service**: Create `src/lib/factory/duplicate-check.ts`.
    -   Use Fuse.js or text matching to find existing questions in the same Topic.
    -   Flag threshold > 90% similarity.
- [ ] **Review Enhancement**:
    -   Highlight "New" Skills in Orange.
    -   Show "Duplicate Warning" Banner on cards.
- [ ] **Persistence**:
    -   Create Server Action: `saveQuestionBatch(blueprint, selectedQuestions)`.
    -   Transaction: Insert New Skills -> Insert Questions -> Link Options.

## Verification
- [ ] **Hygiene**: If AI suggests "React-Hook" and DB has "React Hooks", does it flag or auto-map?
- [ ] **Safety**: Does saving fail if a Question is missing an option?
- [ ] **End-to-End**: Full flow -> Blueprint -> Ingest -> Review -> Save -> Verify in Database.
