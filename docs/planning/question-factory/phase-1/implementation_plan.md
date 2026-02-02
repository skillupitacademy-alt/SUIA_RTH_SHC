# Implementation Plan: Question Factory Phase 1 (The Blueprint)

## Objective
Create the foundational UI where users define the "Shape" of the exam generation batch.

## Architecture Changes

### 1. New Route & Layout
#### [NEW] [QuestionFactory Page](file:///d:/onlinewebsites/quiz-platform/apps/admin-app/src/app/factory/question-generator/page.tsx)
-   Create new route `apps/admin-app/src/app/factory/question-generator/page.tsx`.
-   Use a dedicated `FactoryLayout` (cleaner, less nav noise).

#### [NEW] [FactoryLayout](file:///d:/onlinewebsites/quiz-platform/apps/admin-app/src/components/layout/FactoryLayout.tsx)
-   Simplified header/footer. Max-width container for the "Review Console" (future).

### 2. The Blueprint Components (`components/factory/blueprint`)
#### [NEW] `ContextSelector.tsx`
-   Reuse `useDomains`, `useSubjects` hooks.
-   Cascading Logic: Reset Subject when Domain changes.

#### [NEW] `SourceEditor.tsx`
-   Large styled textarea (bg-slate-900 text-slate-200 font-mono).
-   Placeholder: "Paste source code or lecture notes here..."

#### [NEW] `DistributionMatrix.tsx`
-   3x Number Inputs (Simple, Intermediate, Expert).
-   Validation: Prevent negative numbers.

### 3. The Intelligence Logic
#### [NEW] [PromptService](file:///d:/onlinewebsites/quiz-platform/apps/admin-app/src/lib/factory/prompt-service.ts)
-   `generateTechnicalPrompt(blueprint: FactoryBlueprint): string`
-   Constructs the prompt:
    -   **Role**: "Act as Senior Examiner..."
    -   **Constraint**: "Use ONLY the provided source..."
    -   **Counts**: "Strictly generate [X] Simple, [Y] Intermediate..."
    -   **Schema**: Injects the `JSON Schema` definition.

## Verification Scenarios
1.  **Context Flow**: Select Domain -> Subject loads. Select Topic.
2.  **Prompt Generation**: Fill inputs -> Click "Copy" -> Paste in Notepad -> Verify JSON Schema and Counts are present.
