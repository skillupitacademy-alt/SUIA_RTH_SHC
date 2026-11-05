# FND20 Multi-Select Delimiter Compatibility Constraint

## Status: VERIFICATION_FAILED (Known Limitation)

## Problem Statement

The multi-select scoring system uses comma (`,`) as a delimiter to separate multiple option identifiers. This creates a compatibility constraint where option text containing commas produces incorrect scoring results.

## Current Implementation

### Affected Components

1. **ExamEngine** (`apps/api-server/src/modules/exam-engine/exam.engine.ts`)
   - `resolveCorrectAnswerForScoring()`: Joins correct options with comma delimiter
   - `resolveAnswerForScoring()`: Resolves user answer IDs/labels to text, joins with comma

2. **MultiSelectEvaluator** (`apps/api-server/src/modules/answer-engine/evaluators/multi-select.evaluator.ts`)
   - Uses `parseAnswer()` to split comma-delimited strings
   - Compares sets of parsed segments for scoring

3. **parseAnswer** (`apps/api-server/src/modules/question/question-contract.ts`)
   - Splits on comma: `answer.split(',').map(s => s.trim()).filter(s => s.length > 0)`

### Observed Failure Case

**Test:** `apps/api-server/src/modules/exam-engine/__tests__/delimiter-contract.test.ts`

**Scenario:**
- Correct option: `{ id: '1', text: 'red, blue', isCorrect: true }`
- Incorrect option: `{ id: '2', text: 'red', isCorrect: false }`
- User selects option 2 (incorrect)

**Expected:** Score = 0 (incorrect answer)

**Actual:** Score > 0 (false partial credit)

**Root Cause:**
1. Engine converts option 1 text to `'red, blue'` (correct answer)
2. Engine converts option 2 selection to `'red'` (user answer)
3. `parseAnswer('red, blue')` returns `['red', 'blue']`
4. `parseAnswer('red')` returns `['red']`
5. Evaluator finds `'red'` in correct set, awards partial credit
6. Result: `(1 - 0) / 2 = 0.5` instead of `0`

## Historical Context

### Legacy Stored Answers

The system accepts both:
- **ID-based answers:** `'1,2,3'` (option IDs, resolved through engine)
- **Text-based answers:** `'Red,Blue,Green'` (option text, used directly)

This dual representation is preserved for backward compatibility with existing exam submissions and stored responses.

### Question Identity Encoding

Options can be identified by:
- `option.id`: Unique identifier (string)
- `option.label`: Display label (e.g., 'A', 'B', 'C')
- `option.text` or `option.code`: Actual content shown to user

The engine resolves all identifiers to text content before scoring, maintaining a consistent text-based comparison layer.

## Compatibility Constraint

**DO NOT** change the multi-select scoring algorithm without explicit Sol approval, because:

1. **Historical Data:** Existing exam submissions and scores were computed using current delimiter logic
2. **Algorithm Change Impact:** Any fix affects scoring for ALL historical comma-containing questions
3. **Data Migration:** Would require:
   - Identifying all affected questions in the database
   - Recomputing scores for past exam attempts
   - Migrating stored answer format if changing delimiter
   - Owner/policy decision on retroactive scoring changes

## Potential Solution Approaches (NOT IMPLEMENTED)

### Option 1: Use Option IDs Instead of Text

**Change:** Score based on option IDs, not resolved text
- Pros: Eliminates text ambiguity
- Cons: Requires migration of text-based stored answers; breaks backward compatibility

### Option 2: Use Non-Comma Delimiter

**Change:** Replace comma with `|`, `;`, or ASCII control character
- Pros: Reduces collision with natural text
- Cons: Requires migrating all stored answers; still possible to have option text with new delimiter

### Option 3: Structured Answer Format

**Change:** Use JSON array `["id1", "id2"]` instead of delimited string
- Pros: Eliminates ambiguity entirely
- Cons: Major format change; requires migration of all stored exam data

### Option 4: Escape Commas in Option Text

**Change:** Escape commas in option text during resolution
- Pros: Preserves current format with fix
- Cons: Complex escaping rules; legacy data without escaping remains broken

### Option 5: Validation Constraint

**Change:** Reject questions with commas in multi-select option text at ingestion
- Pros: Prevents new problematic questions
- Cons: Does not fix existing questions; limits authoring flexibility

## Current Mitigation

1. **Test Coverage:** Failing test `delimiter-contract.test.ts` documents the known limitation
2. **Schema Validation:** No current validation prevents comma-containing option text
3. **Status:** Marked `VERIFICATION_FAILED` in FND20 handoff

## Required for Resolution

1. **Owner Decision:** Sol must select:
   - Acceptable solution approach from options above
   - Policy on retroactive score changes for historical exams
   - Acceptance criteria for backward compatibility

2. **Data Audit:**
   - Count of existing multi-select questions with comma-containing options
   - Count of exam submissions affected by delimiter ambiguity
   - Assessment of score impact distribution

3. **Migration Strategy:**
   - If changing format: migration script for stored answers
   - If recomputing: approval for score changes and notification plan
   - If constraining: handling for existing problematic questions

4. **Compatibility Testing:**
   - Verify legacy ID-based answers continue to work
   - Verify legacy text-based answers continue to work
   - Verify new format works correctly
   - Regression tests for score stability

## Test Evidence

### Passing Tests

- `delimiter-contract.test.ts`: Documents the limitation with expected failure case
- `fnd20-question-identity-inventory.test.ts`: Verifies ID/label/text resolution works for non-comma cases
- `fnd20-schema-control.test.ts`: Verifies schema accepts multi-select questions

### Failing Test (Intentional)

- `delimiter-contract.test.ts`: "does not credit an incorrect option that matches part of a comma-containing correct option"
  - Status: VERIFICATION_FAILED
  - Purpose: Regression control for delimiter issue
  - Disposition: Retained as failing until Sol-approved fix implemented

## References

- **Primary Task:** FND20 - Consolidate question and assessment contracts
- **Group:** G6 / W3.3 question/assessment contracts
- **Handoff:** `audit/W1_W3_Terra_Consolidated_Handoff.md`
- **Delimiter Test:** `apps/api-server/src/modules/exam-engine/__tests__/delimiter-contract.test.ts`
- **Authority:** Claude_Sonnet45_W1_W3_Detailed_Implementation_Handover_a239ca39.md, Section D3

## Disposition

**IMPLEMENTED_UNVERIFIED:** Delimiter constraint is documented and test coverage exists. Scoring algorithm remains unchanged pending Sol approval of compatibility-preserving fix strategy.

**Next Steps:** Sol to review compatibility constraint, select solution approach, and authorize scoring algorithm changes with migration plan.
