# Task List: Question Factory Phase 1 (The Blueprint)

## Goal
Build the "Input Console" where the user defines the exam generation constraints.

## Checklist
- [ ] **Route Setup**: Create `apps/admin-app/src/app/factory/question-generator/page.tsx` with a basic layout.
- [ ] **Layout Component**: Create `FactoryLayout.tsx` (Distinct from Dashboard, maximized width).
- [ ] **Context Selectors**: Implement cascading dropdowns for `Domain` -> `Subject` -> `Topic`.
- [ ] **Source Editor**: Add a large text area (Monaco or Styled Textarea) for Source Code input.
- [ ] **Distribution Controls**: Implement 3 numeric inputs for Simple/Intermediate/Expert counts.
- [ ] **Prompt Service**: Create `src/lib/factory/prompt-service.ts` to generate the strict prompt string.
- [ ] **Action Button**: Implement "Copy Prompt" button that builds the string and writes to clipboard.

## Verification
- [ ] **Visual**: Page loads at `/factory/question-generator`.
- [ ] **Functional**: Selecting Domain filters Subject list.
- [ ] **Logic**: Clicking "Copy Prompt" puts the *correctly formatted* text (Code + Schema) into the clipboard.
