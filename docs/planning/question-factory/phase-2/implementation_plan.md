# Implementation Plan: Question Factory Phase 2 (Ingest & Parser)

## Objective
Seamlessly bridge the gap between "External AI Output" (Clipboard) and "Internal Review Console" (State).

## Architecture Changes

### 1. Data Models
#### [NEW] Types (`types/factory.ts`)
-   `GeneratedQuestion`: The strictly typed shape.
-   `ValidationResult`: `{ isValid: boolean; errors: string[]; parsedData?: any }`

### 2. Services
#### [NEW] `json-validator.ts`
-   Uses `zod` or manual parsing to validate the structure.
-   **Critical**: Must handle "Chatty" AI responses (e.g., if AI adds "Here is your JSON:" prefix, strip it).

### 3. Components
#### [NEW] `JsonIngestBox.tsx`
-   **UI**: Full-width textarea.
-   **Action**: "Process & Review" button.
-   **Feedback**: Alert banner for errors.

### 4. State Integration
#### [NEW] `FactoryContext.tsx`
-   Store `stagedQuestions: GeneratedQuestion[]`.
-   Store `blueprint: FactoryBlueprint`.
-   Action `setStagedQuestions(questions)`.

## Verification Scenarios
1.  **Prefix Stripping**: Paste "Sure! Here is the JSON: {...}" -> Validator should strip the text and accept the JSON.
2.  **Schema Check**: Paste JSON missing `difficulty` -> Validator returns error.
