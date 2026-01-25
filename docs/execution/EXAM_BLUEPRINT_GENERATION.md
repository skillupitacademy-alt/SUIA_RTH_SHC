# Enterprise Exam Blueprint Generation

> [!IMPORTANT]
> This document defines the deterministic logic for generating "Enterprise" grade exam blueprints. It is the absolute source of truth for the `ExamBlueprintService`.

## 1. Trigger Conditions
The blueprint generation process is triggered when:
1.  **Start Enterprise Test**: A user initiates a new exam session requiring a fresh, dynamically generated blueprint.
2.  **Admin Generation**: An administrator explicitly requests the generation of a standard blueprint for a domain/subject.

## 2. Input Parameters
The extraction logic requires the following input configuration:
*   `domainId` (Required): The root domain for the exam (e.g., "Web Development").
*   `subjectId` (Optional): A specific subject to refine scope (e.g., "Frontend").
*   `topicId` (Optional): A specific topic for deep-dives (e.g., "React Hooks").
*   `difficultyPreference` (Required): 'mixed' | 'simple' | 'intermediate' | 'expert'.
*   `questionCount`: Total number of questions required (e.g., 20, 50, 100).
    *   *Constraint*: Must be sufficient to satisfy difficulty distribution.

## 3. Schema Relationships
The generation process operates on the following referential hierarchy:
*   `exam_blueprints` → **belongs to** `domains`
*   `exam_blueprints` → **can belong to** `subjects` (nullable)
*   `exam_blueprints` → **can belong to** `topics` (nullable)

**Resolution Rules**:
*   If `topicId` is provided -> Scope is that Topic.
*   If `subjectId` is provided -> Scope is all Topics within that Subject.
*   If only `domainId` is provided -> Scope is all Topics within all Subjects of that Domain.

## 4. Question Pool & Eligibility
A question is eligible for selection ONLY if:
1.  `status` is 'active'.
2.  It belongs to the resolved Target Scope (Topic/Subject/Domain).
3.  It matches the required difficulty bucket.

## 5. Difficulty Distribution
The service determines distribution based on `difficultyPreference`:

### Option A: Mixed (Enterprise Standard)
Enforces strict 30/30/40 rule:
| Difficulty | Percentage | Logic |
| :--- | :--- | :--- |
| **Simple** | 30% | `floor(total * 0.30)` |
| **Intermediate** | 30% | `floor(total * 0.30)` |
| **Expert** | 40% | `total - (simple_count + intermediate_count)` (Remainder Safe) |

### Option B: Specific Difficulty
Enforces 100% allocation to the selected tier:
*   **Simple**: 100% Simple questions.
*   **Intermediate**: 100% Intermediate questions.
*   **Expert**: 100% Expert questions.

## 6. Selection Rules
1.  **No Duplicates**: A question ID cannot appear twice in the same blueprint (handled by set/unique selection).
2.  **Randomized**: Questions within a difficulty bucket must be shuffled before selection.
3.  **Deterministic Sequence**: Once selected, the final list of questions is stored in the blueprint JSON; the *order of presentation* is determined by the client or `exam_sessions`, but the blueprint definition itself is static once generated.

## 7. Failure Handling
*   **Insufficient Pool**: If a difficulty bucket cannot be filled (e.g., need 10 Experts, found 8):
    *   **Strict Mode (Enterprise)**: ABORT generation. Throw `InsufficientQuestionsError`.
    *   Do NOT backfill with other difficulties (violates "Enterprise" grade promise).

## 8. Audit & Logging
All generation events must log:
*   `timestamp`
*   `trigger_source`
*   `configuration` (Domain/Subject/Count)
*   `distribution_result` (e.g., "S:6, I:6, E:10")
*   `blueprint_id` (on success)
