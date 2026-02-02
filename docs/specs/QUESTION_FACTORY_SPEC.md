# 🏭 Feature Spec: Question Factory (Context-Aware Generator)

**Version**: 1.0  
**Status**: DRAFT  
**Scope**: Admin Platform (`@quiz/admin-app`)

---

## 1. 🎯 Objective
To shift the Question Creation workflow from a **Manual Data Entry** task to an **Executive Review & Approval** process. The system converts raw educational material (Source Code, Lecture Notes) into high-quality, structured exam questions using AI (Internal or External), giving the user strict control over volume, difficulty, and scope.

---

## 2. 🏗️ Architecture: The 4-Stage Assembly Line

### Stage 1: The Blueprint (Input Console)
Users define the "Shape" and "Constraints" of the generation batch.

*   **1. Target Scope**:
    *   **Context**: `Domain` → `Subject` → `Topic` (Dropdowns).
    *   *Constraint*: Strict hierarchy enforcement.
*   **2. Source of Truth**:
    *   **Input**: Large Code Editor / Text Area.
    *   **Content**: Raw Code snippets, documentation, or lecture notes.
    *   *Rule*: "No Hallucination" - AI must generate questions *only* from this source.
*   **3. Distribution Matrix (The Controls)**:
    *   Precise volume control via counters:
    *   `[ N ]` **Simple** (Recall/Syntax)
    *   `[ N ]` **Intermediate** (Application/Logic)
    *   `[ N ]` **Expert** (Architecture/Edge Cases)

### Stage 2: The Intelligence Engine (Dual-Mode)
The system processes the Blueprint using one of two plugged engines:

#### Mode A: Premium (Internal AI)
*   **Action**: User clicks "Generate".
*   **Process**: Backend calls LLM API with the constructed prompt.
*   **Result**: JSON output parsed directly into the Review Console.

#### Mode B: Fallback (Copy Prompt / BYO-AI)
*   **Action**: User clicks **"📋 Copy Smart Prompt"**.
*   **Process**:
    *   System constructs a strict technical prompt containing:
        1.  Injected Source Code.
        2.  Strict "Count" Instructions (e.g., "Must be exactly 2 simple...").
        3.  Metadata Logic (Depth/Mapping definitions).
        4.  **Strict JSON Schema** (Enforced Output Format).
*   **User Action**: Pastes Prompt into external AI (e.g., ChatGPT) -> Copies JSON Response -> Pastes into **Ingest Box**.
*   **Validation**: System validates JSON structure/syntax immediately on paste.

### Stage 3: The Review Console (Quality Assurance)
A "Staging Area" where data is visualized before database commitment.

*   **Visual Cards**: Questions rendered as UI Cards (not raw JSON).
*   **Formatted Content**:
    *   `questionText` with Markdown support.
    *   `codeSnippet`: Dedicated syntax-highlighted block (if applicable).
    *   `explanation`: Rationale for the correct answer.
*   **Smart Metadata (Auto-Tagged)**:
    *   **Difficulty**: (Simple/Intermediate/Expert)
    *   **Depth Level**: (1-10 Scale)
    *   **Mapping Type**: (Conceptual/Technical/Practical)
    *   **Skills**: Auto-extracted tags (e.g., "React Hooks").
*   **Hygiene Indicators**:
    *   **New Skills**: Highlighted Orange (User must verify/approve new terms).
    *   **Duplicates**: Flagged if semantic match found in DB.
*   **Controls**:
    *   **Checkbox**: Select/Deselect for import.
    *   **Inline Edit**: Click-to-edit text/options.

### Stage 4: Commitment (Persistence)
*   **Action**: Click **"Save to Question Bank"**.
*   **Process**:
    *   Filter only "Selected" cards.
    *   Insert into `Questions` table (linked to Topic/Subtopic).
    *   Insert new `Skills` (if approved).

---

## 3. 🧩 Data Schema (JSON Contract)

The AI (Internal or External) must strictly adhere to this contract:

```json
{
  "questions": [
    {
      "questionText": "What is the primary purpose of the dependency array?",
      "codeSnippet": "useEffect(() => {}, [])", // Optional
      "options": [
        "To run the effect once", 
        "To loop indefinitely", 
        "To break the build", 
        "None of the above"
      ],
      "correctAnswer": "To run the effect once",
      "explanation": "An empty dependency array [] tells React to execute the effect only after the initial render (mount).",
      "difficulty": "simple",
      "depthLevel": 2,
      "mappingType": "technical",
      "skillNames": ["React Hooks", "Component Lifecycle"]
    }
  ]
}
```

---

## 4. 📅 Implementation Phases

To ensure stability, implementation will occur in strictly defined phases:

### Phase 1: The Blueprint (UI Shell)
*   New Page: `/factory/question-generator`
*   Components:
    *   Context Selector (Domain/Subject/Topic).
    *   Source Code Editor (Monaco/Textarea).
    *   Distribution Counters (Simple/Int/Expert).
    *   "Copy Prompt" Logic (Prompt Construction Service).

### Phase 2: The Ingest & Parser
*   "Ingest Box" for Fallback Mode.
*   JSON Parser with Error Handling/Auto-Repair.
*   State Management for "Staged Questions".

### Phase 3: The Review Console
*   Question Card Component.
*   Metadata Badges (Difficulty/Skill).
*   Code Snippet Renderer.
*   Edit/Delete Capabilities.

### Phase 4: Intelligence & Hygiene
*   Skill Taxonomy Check (New vs Existing).
*   Duplicate Detection logic.
*   Connect "Save" button to Backend Mutations.
