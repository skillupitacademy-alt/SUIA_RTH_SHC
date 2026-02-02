# Implementation Plan: Question Factory Phase 4 (Intelligence & Hygiene)

## Objective
Ensure the database remains clean and structured by catching duplicates and unifying tags.

## Architecture Changes

### 1. New Services
#### [NEW] `skill-service.ts`
-   `fetchSkillTaxonomy()`: Returns `string[]` of all known skills.
-   `analyzeSkills(stagedQuestions)`: Returns mapping of `{ [questionIndex]: { existing: string[], new: string[] } }`.

#### [NEW] `duplicate-service.ts`
-   `checkDuplicates(questions, topicId)`: Checks vector/text similarity.
-   Returns: Indices of potential duplicates.

### 2. UI Enchancements
#### [MODIFY] `QuestionReviewCard.tsx`
-   **Skill Badge**:
    -   If `isNew`: `bg-orange-100 text-orange-600 border-orange-200`.
    -   If `isExisting`: `bg-slate-100 text-slate-600`.
-   **Warning Banner**:
    -   Conditional render: `<DuplicateWarning />` if flagged.

### 3. Server Actions
#### [NEW] `save-batch.ts`
-   **Transaction**:
    1.  Create any NEW Skills in `Skills` table.
    1.  Create any NEW Skills in `Skills` table.
    2.  Insert Questions into `Questions` table.
        -   **Traceability**: Store source snippet reference in `adminNote` column.
    3.  Insert Options.
    4.  Create Relations (Question <-> Skill).
-   **Return**: Count of success/fail.

## Verification Scenarios
1.  **Duplicate Flag**: Manually create a question identical to one in DB -> See Warning in Review.
2.  **New Skill**: Tag "SuperNewSkill" -> See Orange Badge -> Save -> Verify "SuperNewSkill" is now in DB.
