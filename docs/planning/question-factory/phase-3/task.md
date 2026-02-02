# Task List: Question Factory Phase 3 (Review Console)

## Goal
Create the "Staging Area" visual interface where users verify questions before saving.

## Checklist
- [ ] **Review Grid**: Implement a responsive Grid Layout for question cards.
- [ ] **Question Card**: Create `QuestionReviewCard.tsx`
    -   Display `questionText` (Markdown).
    -   Display `codeSnippet` (Syntax Highlighted).
    -   Display Options list.
    -   Display `Explanation` in a collapsible section.
- [ ] **Metadata Badges**:
    -   Difficulty (Color Coded: Green/Yellow/Red).
    -   Depth Level (Badge: "Lvl 5").
    -   Mapping Type (Badge: "Conceptual").
    -   Skills (Tags).
- [ ] **Interactivity**:
    -   Checkbox Selection logic.
    -   Inline Edit Mode (Click text to turn into Input).

## Verification
- [ ] **Visual**: Cards look clean, not cluttered.
- [ ] **Selection**: Ticking "Select All" works.
- [ ] **Edit**: Changing a typo in the card updates the `stagedQuestions` state.
