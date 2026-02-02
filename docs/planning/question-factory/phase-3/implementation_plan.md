# Implementation Plan: Question Factory Phase 3 (Review Console)

## Objective
Provide a robust "Staging Environment" where the user acts as the Executive Editor.

## Architecture Changes

### 1. Components (`components/factory/review`)
#### [NEW] `ReviewGrid.tsx`
-   Responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
-   Pagination: If batch > 20 questions.

#### [NEW] `QuestionReviewCard.tsx`
-   **Header**: Checkbox + Difficulty Badge + Delete Button.
-   **Body**: 
    -   `MarkdownRenderer` (ReactMarkdown) for main text.
    -   `MarkdownRenderer` (ReactMarkdown) for main text.
    -   `SyntaxHighlighter` (Prism) for `codeSnippet`.
    -   **Explanation**: Collapsible `<details>` section showing the answer rationale.
-   **Footer**: Skill Tags (Clickable to remove).
-   **Edit Mode**: Swaps Text Display for Text Input on click.

### 2. State & Actions
#### [UPDATED] `FactoryContext`
-   Add `toggleSelection(index)` logic.
-   Add `updateQuestion(index, field, value)` logic.
-   Add `discardQuestion(index)` logic.

## Verification Scenarios
1.  **Render Check**: Markdown lists render correctly? Code blocks have colors?
2.  **Edit Check**: Click question text -> Edit -> Blur -> State updates?
3.  **Selection**: Uncheck item -> "Selected Count" decreases?
