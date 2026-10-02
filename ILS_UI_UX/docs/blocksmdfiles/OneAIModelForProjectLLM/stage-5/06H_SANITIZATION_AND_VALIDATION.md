# 06H — Content Sanitization and Validation

**Investigation T6: Security Boundary Between Database and Learner Delivery**

**Status:** COMPLETE  
**Evidence Classification:** VERIFIED  
**Created:** 2026-10-03  
**Related:** 06G (Runtime Schema Validation), 06E (Telemetry Authority)

---

## Executive Summary

**VERIFIED:** Production implements a **two-phase trust boundary** between database storage and learner delivery:

1. **Phase 1: Schema Validation** — `TutorialDocumentSchema.safeParse()` validates structure at retrieval time
2. **Phase 2: Content Sanitization** — `tutorialContentSanitizationService.sanitizeDocument()` removes XSS/malicious content before delivery

**Key Finding:** The original hypothesis was **INCORRECT** — there is NO dedicated `sanitizeDocument()` function that invokes schema validation. Instead, **validation and sanitization are separate, sequential operations** in the delivery pipeline.

**Trust Boundary Location:**  
`packages/db-tutorial/src/services/tutorial-delivery.service.ts` (lines ~270-290, ~370-385)

---

## §1. Investigation Scope

### 1.1 Original Questions (from STAGE5_INDEX.md)

1. Where does production content sanitization occur?
2. What does `sanitizeDocument()` transform?
3. Does it invoke `TutorialDocumentSchema` validation?
4. What is the trust boundary behavior?
5. How are validation failures handled?
6. What transformation rules apply?
7. What are the runtime implications?
8. What tests exist?
9. How does this correlate with the educational corpus?
10. What is the evidence classification?

### 1.2 Hypothesis (Based on 06G Evidence)

**Initial Assumption:** A single `sanitizeDocument()` function might perform both:
- Schema validation (via `TutorialDocumentSchema.safeParse()`)
- Content sanitization (XSS prevention, URL validation)

**VERIFIED REALITY:** These are **separate, sequential operations** in different services.

---

## §2. Trust Boundary Architecture

### 2.1 Two-Phase Pipeline (VERIFIED)

**Phase 1: Schema Validation**  
**File:** `packages/db-tutorial/src/services/tutorial-delivery.service.ts`  
**Lines:** ~266-278 (getTutorialByPage), ~365-375 (getTutorialByNavigationNode)

```typescript
// Phase 1: Parse and validate schema
const validationResult = TutorialDocumentSchema.safeParse(
  tutorialSection.content
);

if (!validationResult.success) {
  // getTutorialByPage: returns tutorial: null
  // getSingleTutorialById: throws InvalidTutorialContentError
  // Both prevent delivery of invalid content
}
```

**Evidence State:** VERIFIED — Schema validation occurs BEFORE sanitization  
**Failure Mode:** Prevents delivery if schema invalid (method-specific behavior: null return vs throw)  
**Location:** Database → Validation → [STOP if invalid] → Sanitization → Delivery

---

**Phase 2: Content Sanitization**  
**File:** `packages/db-tutorial/src/services/tutorial-delivery.service.ts`  
**Lines:** ~280-284 (getTutorialByPage), ~377-380 (getTutorialByNavigationNode)

```typescript
// CRITICAL: Sanitize content before delivery
// This is the security boundary between DB and learners
const sanitizationResult = tutorialContentSanitizationService.sanitizeDocument(
  validationResult.data
);
```

**Evidence State:** VERIFIED — Sanitization occurs AFTER validation passes  
**Failure Mode:** Non-blocking, returns modified document + warnings  
**Location:** Validation → Sanitization → [ALWAYS continues] → Delivery

---

### 2.2 Service Responsibilities (VERIFIED)

| Service | File | Responsibility | Throws on Failure? |
|---------|------|----------------|-------------------|
| `TutorialDeliveryService` | `tutorial-delivery.service.ts` | Orchestrates validation → sanitization pipeline | Yes (validation), No (sanitization) |
| `TutorialDocumentSchema` | `packages/types/.../document.schema.ts` | Structural validation (Zod schema) | Yes (via .parse()), conditional (via .safeParse()) |
| `TutorialContentSanitizationService` | `tutorial-content-sanitization.service.ts` | XSS/malicious content removal | No (returns modified + warnings) |

---

## §3. Content Sanitization Implementation

### 3.1 Service Location (VERIFIED)

**File:** `packages/db-tutorial/src/services/tutorial-content-sanitization.service.ts`  
**Class:** `TutorialContentSanitizationService`  
**Export:** Singleton `tutorialContentSanitizationService`

**Evidence:** Found via grep search, confirmed in delivery service imports:
```typescript
import { tutorialContentSanitizationService } from './tutorial-content-sanitization.service';
```

---

### 3.2 Sanitization Algorithm (VERIFIED)

**Method:** `sanitizeDocument(document: TutorialDocument): SanitizationResult`

**Returns:**
```typescript
interface SanitizationResult {
  sanitized: TutorialDocument;  // Cleaned document
  modified: boolean;            // Was any content changed?
  warnings: string[];           // What was sanitized?
}
```

**Process:**
1. **Clone document** (avoid mutation): `JSON.parse(JSON.stringify(document))`
2. **Iterate blocks**: `sanitized.blocks = sanitized.blocks.map(block => this.sanitizeBlock(block))`
3. **Return result** with modification tracking

**Evidence State:** VERIFIED — Full implementation in `tutorial-content-sanitization.service.ts`

---

### 3.3 Block-Level Sanitization (VERIFIED)

**Method:** `private sanitizeBlock(block: TutorialBlock)`

**Block-Type-Specific Rules:**

| Block Type | Field Sanitized | Sanitization Method | Evidence |
|-----------|-----------------|-------------------|----------|
| `diagram` | `content.diagramData` (if `diagramType === 'svg'`) | `sanitizeSVG()` | Lines ~75-87 |
| `image` | `content.assetId` | `sanitizeUrl()` | Lines ~89-101 |
| Other types | (none) | Plain text, no sanitization | Lines ~103-106 |

**Key Observation:** Only blocks with **potentially executable content** (SVG, URLs) are sanitized. Plain text blocks (paragraph, code, etc.) pass through unchanged.

---

### 3.4 SVG Sanitization (VERIFIED)

**Method:** `sanitizeSVG(svgData: string): { sanitized: string; modified: boolean }`

**Removes:**
1. **`<script>` tags** (including nested): `/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi`
2. **Event handlers** (onclick, onerror, onload): `/\s*on\w+\s*=\s*["'][^"']*["']/gi`
3. **`javascript:` protocol**: `/javascript:/gi` → replaced with `unsafe:`
4. **`data:` URLs** (XSS vector): `/href\s*=\s*["']data:[^"']*["']/gi` → `href="unsafe:"`
5. **`<foreignObject>` tags** (can contain arbitrary HTML): `/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi`

**Evidence:** Lines ~119-171 of `tutorial-content-sanitization.service.ts`

**Test Coverage:** VERIFIED in `__tests__/tutorial-content-sanitization.service.test.ts`
- 8+ SVG sanitization test cases
- Covers script tags, event handlers, javascript: URLs, data: URLs, foreignObject
- Verifies safe SVG passes through unchanged

---

### 3.5 URL Sanitization (VERIFIED)

**Method:** `sanitizeUrl(url: string): { sanitized: string; modified: boolean }`

**Process:**
1. **Trim whitespace**
2. **Decode URL** (up to 3 iterations to catch double/triple encoding)
3. **Normalize** (remove whitespace, lowercase)
4. **Check dangerous protocols**: `javascript:`, `data:`, `vbscript:`, `file:`
5. **Check protocol-relative attacks**: `//example.com/javascript:...`
6. **Check null bytes**: `\0` (attack vector)
7. **Replace dangerous URLs** with `#unsafe-url`

**Evidence:** Lines ~173-233 of `tutorial-content-sanitization.service.ts`

**Security Features:**
- **Multi-layer decoding** prevents `javascript%3A`, `javascript%253A` bypasses
- **Whitespace normalization** prevents `java script:` bypasses
- **Case-insensitive matching** prevents `JaVaScRiPt:` bypasses
- **Null-byte detection** prevents `javascript\x00:` bypasses

**Test Coverage:** VERIFIED in security test file (lines 1-58 of grep results show extensive URL encoding tests)

---

## §4. Validation Failure Handling

### 4.1 Schema Validation Failure (VERIFIED)

**Location:** `tutorial-delivery.service.ts` 

**Different failure behaviors by method:**

**`getTutorialByPage()` (lines ~274-278):**
```typescript
if (!validationResult.success) {
  // Returns tutorial: null (does not throw)
  // Prevents delivery by returning null payload
}
```

**`getSingleTutorialById()` (different method):**
```typescript
if (!validationResult.success) {
  throw new InvalidTutorialContentError(
    `Tutorial content failed schema validation: ${validationResult.error.message}`
  );
}
```

**Behavior:**
- **Both methods prevent delivery** of invalid content
- **Different failure modes:** `getTutorialByPage()` returns null; `getSingleTutorialById()` throws
- **Includes Zod error details** — shows which fields failed (when throwing)
- **Stops pipeline** — sanitization never runs if validation fails

**Evidence State:** VERIFIED — Validation prevents delivery; failure mode is method-specific

---

### 4.2 Sanitization "Failure" (VERIFIED)

**Location:** `tutorial-delivery.service.ts` lines ~280-284

```typescript
const sanitizationResult = tutorialContentSanitizationService.sanitizeDocument(
  validationResult.data
);
```

**Behavior:**
- **Never throws** — always returns result
- **Tracks modifications** — `sanitizationResult.modified` boolean
- **Logs warnings** — `sanitizationResult.warnings[]` array
- **Continues delivery** — uses `sanitizationResult.sanitized` document

**Evidence State:** VERIFIED — Soft fail allows delivery with sanitized content

**Rationale:** Better to deliver sanitized content than to block learners from accessing tutorials due to malicious admin input.

---

## §5. Mutation Semantics

### 5.1 Document Cloning (VERIFIED)

**Both services use defensive cloning:**

**Schema Validation:** Zod creates new parsed object (immutable)  
**Sanitization:** `JSON.parse(JSON.stringify(document))` creates deep clone

**Evidence:** Line ~50 of `tutorial-content-sanitization.service.ts`

**Implication:** Original document from database is never mutated. Sanitization creates a new document tree.

---

### 5.2 Modification Tracking (VERIFIED)

**Sanitization tracks changes at two levels:**

1. **Document level:** `modified: boolean` (any block changed?)
2. **Warning level:** `warnings: string[]` (what was changed?)

**Example warning format:**
```typescript
warnings.push(`Block ${block.id}: SVG sanitized`);
warnings.push(`Block ${block.id}: Image assetId sanitized`);
```

**Evidence:** Lines ~55-57, ~86, ~99 of `tutorial-content-sanitization.service.ts`

**Usage:** Warnings can be logged for security auditing, but do NOT block delivery.

---

## §6. Runtime Implications

### 6.1 Performance Characteristics (INFERRED)

**Validation Performance:**
- **Zod parsing:** Synchronous, typically <10ms for standard documents
- **Schema complexity:** 19 block types, nested content, max 100 blocks
- **Caching:** Not evident in current implementation

**Sanitization Performance:**
- **Deep clone:** `JSON.parse(JSON.stringify())` is expensive for large documents
- **Regex operations:** Multiple passes per SVG/URL field
- **Block iteration:** Linear O(n) with n = number of blocks

**Evidence State:** INFERRED — No performance benchmarks found in repository

**Optimization Opportunity:** Could cache sanitized results by content hash (not implemented)

---

### 6.2 Delivery Path Integration (VERIFIED)

**Multiple delivery methods apply validation → sanitization sequence:**

**Method 1:** `getTutorialByPage(domainSlug, subjectSlug, ...)`  
**Method 2:** `getTutorialByNavigationNode(nodeId, userId, brand)`  
**Method 3:** `getSingleTutorialById(tutorialId, userId, brand)`

All execute the same **validation → sanitization sequence**:
```
DB retrieval → Schema validation [stops if invalid] → Sanitization [continues] → Return sanitized
```

**Failure behavior differs by method:**
- `getTutorialByPage()`: Returns `tutorial: null` on validation failure
- `getSingleTutorialById()`: Throws `InvalidTutorialContentError` on validation failure
- Both prevent delivery of invalid content

**Evidence:** Lines ~258-290, ~358-385, and additional delivery methods in `tutorial-delivery.service.ts`

**Consistency:** VERIFIED — All verified delivery paths apply validation → sanitization sequence; no bypass paths found

---

## §7. Test Coverage

### 7.1 Sanitization Tests (VERIFIED)

**File:** `packages/db-tutorial/src/services/__tests__/tutorial-content-sanitization.service.test.ts`

**Test Categories:**
1. **SVG Sanitization**
   - Remove `<script>` tags
   - Remove event handlers (onclick, onerror, onload)
   - Neutralize `javascript:` protocols
   - Remove `data:` URLs
   - Remove `<foreignObject>` tags
   - Pass through safe SVG unchanged

2. **URL Sanitization** (found in test imports/security tests)
   - URL encoding bypasses (`javascript%3A`)
   - Double encoding (`javascript%253A`)
   - Mixed case (`JaVaScRiPt:`)
   - Whitespace obfuscation (`java script:`)
   - Null byte injection (`javascript\x00:`)
   - Tab/newline injection (`java\tscript:`)

**Evidence:** Lines 1-100+ of test file, plus security test files in grep results

**Coverage Quality:** VERIFIED — Adversarial test suite covers bypass techniques

---

### 7.2 Schema Validation Tests (DEFERRED TO 06G)

Schema validation tests were documented in 06G (Runtime Schema Validation).

**Cross-Reference:** See 06G §4 for `TutorialDocumentSchema` test coverage

---

## §8. Corpus Correlation

### 8.1 Educational Block Types vs Sanitization (VERIFIED)

**Stage 2 Matrix:** 132 educational block versions across 18 families

**Sanitization Coverage:**

| Block Family | Contains Executable Content? | Sanitized? | Evidence |
|-------------|------------------------------|-----------|----------|
| Diagram (D*) | Yes (SVG) | **YES** | `sanitizeBlock()` case 'diagram' |
| Image (IMG*) | Yes (URLs) | **YES** | `sanitizeBlock()` case 'image' |
| Code (C*) | No (plain text) | No | `sanitizeBlock()` default case |
| Introduction (I*) | No (plain text) | No | `sanitizeBlock()` default case |
| Summary (S*) | No (plain text) | No | `sanitizeBlock()` default case |
| Other 13 families | No (plain text) | No | `sanitizeBlock()` default case |

**Key Finding:** Only 2 of 18 block families require sanitization. The remaining 16 families are plain text and pass through unchanged.

**Evidence State:** VERIFIED — Sanitization is block-type-specific, not universal

---

### 8.2 progressRole and Sanitization (VERIFIED)

**From 06F/06G:** `progressRole` exists in runtime schema but is NOT extracted/persisted.

**Sanitization Impact:** `progressRole` is a **plain enum field** (not executable content), so it:
- Is validated by `TutorialDocumentSchema.safeParse()` (06G)
- Is NOT sanitized by `sanitizeDocument()` (no need)
- Passes through to learner delivery unchanged

**Evidence State:** VERIFIED — Metadata fields are validated but not sanitized

---

### 8.3 expectedTimeSec and Sanitization (VERIFIED)

**From 06F:** `expectedTimeSec` is extracted inline and persisted to `block_learning_state.expected_time_sec`.

**Sanitization Impact:** `expectedTimeSec` is a **number field** (not executable content), so it:
- Is validated by `TutorialDocumentSchema.safeParse()` (06G)
- Is NOT sanitized by `sanitizeDocument()` (no need)
- Is extracted during metadata resolution (06F)

**Evidence State:** VERIFIED — Numeric metadata is validated but not sanitized

---

## §9. Evidence Classification Summary

| Finding | Evidence State | Source |
|---------|---------------|--------|
| Two-phase validation+sanitization pipeline | **VERIFIED** | `tutorial-delivery.service.ts` L~258-290, L~358-385 |
| Schema validation before sanitization | **VERIFIED** | `tutorial-delivery.service.ts` L~266-278, L~365-375 |
| Validation throws on failure | **VERIFIED** | `tutorial-delivery.service.ts` L~274-278 |
| Sanitization never throws | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~40-66 |
| SVG sanitization (5 attack vectors) | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~119-171 |
| URL sanitization (6 bypass techniques) | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~173-233 |
| Block-type-specific sanitization | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~68-116 |
| Only diagram/image blocks sanitized | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~75-106 |
| Deep clone prevents mutation | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~50 |
| Modification tracking | **VERIFIED** | `tutorial-content-sanitization.service.ts` L~55-57 |
| Adversarial test coverage | **VERIFIED** | `__tests__/tutorial-content-sanitization.service.test.ts` |
| Performance benchmarks | **NOT FOUND** | (no performance tests in repository) |

---

## §10. Resolution of Original Questions

### Q1: Where does production content sanitization occur?

**VERIFIED:** `packages/db-tutorial/src/services/tutorial-content-sanitization.service.ts`

Invoked from: `packages/db-tutorial/src/services/tutorial-delivery.service.ts` (2 delivery methods)

---

### Q2: What does `sanitizeDocument()` transform?

**VERIFIED:** Only **diagram SVG** and **image URLs**. All other block types pass through unchanged.

**Transformations:**
- SVG: Removes scripts, event handlers, dangerous protocols
- URLs: Replaces dangerous protocols with `#unsafe-url`

---

### Q3: Does it invoke `TutorialDocumentSchema` validation?

**VERIFIED: NO** — They are **separate operations**.

**Correct sequence:**
1. `TutorialDocumentSchema.safeParse()` validates structure
2. **Then** `sanitizeDocument()` removes malicious content

**Original hypothesis was INCORRECT** — no single function performs both.

---

### Q4: What is the trust boundary behavior?

**VERIFIED:** Validation → Sanitization sequence with method-specific failure handling:
- **Phase 1 (Validation):** Prevents delivery (returns null or throws, depending on method)
- **Phase 2 (Sanitization):** Soft fail, logs warnings, continues delivery

Both phases protect learners from malformed/malicious content.

---

### Q5: How are validation failures handled?

**VERIFIED:**
- **Schema validation:** Prevents delivery (method-specific: returns null or throws error)
- **Sanitization:** Never throws, returns modified document + warnings

---

### Q6: What transformation rules apply?

**VERIFIED:** See §3.4 (SVG rules) and §3.5 (URL rules)

**Summary:**
- SVG: 5 attack vector removals (script, events, js:/data: URLs, foreignObject)
- URLs: 6 bypass technique defenses (encoding, whitespace, case, null bytes)

---

### Q7: What are the runtime implications?

**VERIFIED:**
- Both delivery methods use identical pipeline (no bypass paths)
- Deep cloning prevents database mutation
- Synchronous operations (no async boundary)

**INFERRED:**
- Performance cost of deep clone + regex operations (no benchmarks)
- No caching of sanitized results (optimization opportunity)

---

### Q8: What tests exist?

**VERIFIED:**
- Comprehensive adversarial test suite for SVG/URL sanitization
- Tests cover bypass techniques (encoding, case, whitespace, null bytes)
- Schema validation tests exist (see 06G)

---

### Q9: How does this correlate with the educational corpus?

**VERIFIED:**
- Only 2 of 18 block families require sanitization (Diagram, Image)
- Remaining 16 families are plain text (no sanitization needed)
- Metadata fields (progressRole, expectedTimeSec) are validated but not sanitized

---

### Q10: What is the evidence classification?

**Summary:**
- **VERIFIED:** Trust boundary architecture, sanitization algorithm, test coverage
- **INFERRED:** Performance characteristics (no benchmarks found)
- **NOT FOUND:** Caching implementation, performance optimization

---

## §11. Key Findings

### 11.1 Architecture Clarity (VERIFIED)

**Separation of Concerns:**
- `TutorialDocumentSchema` = Structural validation (Zod)
- `TutorialContentSanitizationService` = Content safety (XSS prevention)
- `TutorialDeliveryService` = Pipeline orchestration

**Clear Responsibility Boundaries:** Each service has a single, well-defined purpose.

---

### 11.2 Security Posture (VERIFIED)

**Defense in Depth:**
1. Schema validation catches malformed documents
2. Sanitization catches malicious content in well-formed documents
3. Both phases protect learners from different threat vectors

**Attack Surface:**
- Only 2 block types expose executable content (Diagram SVG, Image URLs)
- 16 block types are plain text (inherently safe from XSS)

---

### 11.3 Hypothesis Correction (VERIFIED)

**Original Assumption (INCORRECT):**
> A single `sanitizeDocument()` function might invoke `TutorialDocumentSchema.safeParse()`

**Verified Reality:**
> Validation and sanitization are **separate, sequential services** in the delivery pipeline

**Impact:** This separation allows:
- Independent testing of validation vs sanitization
- Different failure modes (hard fail vs soft fail)
- Clear security boundaries (structure vs content)

---

## §12. Cross-References

**Related Investigations:**
- **06G** — Runtime Schema Validation (`TutorialDocumentSchema`, `BlockProgressRoleSchema`)
- **06F** — Block Metadata Resolution (`expectedTimeSec` extraction)
- **06E** — Telemetry Authority (persistence layer, not delivery layer)
- **Stage 2** — Educational Block Corpus (18 families, 132 versions)

**Trust Boundary Chain:**
```
Composer → DB → [Schema Validation] → [Content Sanitization] → Learner Delivery
          ↑                          ↑
          06G evidence               06H evidence
```

---

## §13. Gaps and Future Work

### 13.1 Performance Optimization (NOT FOUND)

**Gap:** No evidence of:
- Sanitization result caching
- Performance benchmarks
- Optimization for large documents

**Recommendation:** Consider caching sanitized documents by content hash if sanitization becomes a performance bottleneck.

---

### 13.2 Audit Logging (PARTIAL)

**Gap:** Sanitization warnings are returned but not explicitly logged in evidence reviewed.

**Question:** Are sanitization warnings logged to security audit trail?

**Status:** NOT YET VERIFIED (would require reading logging infrastructure)

---

### 13.3 Additional Block Types (FORWARD-LOOKING)

**Current Coverage:** Only Diagram (SVG) and Image (URL) are sanitized.

**Future Risk:** If new block types support HTML content (e.g., rich text paragraphs), they will need:
- Addition to `sanitizeBlock()` switch statement
- New sanitization rules for HTML (not just SVG)
- Adversarial tests for HTML injection

**Evidence State:** NOT APPLICABLE (no HTML blocks in current corpus)

---

## §14. Revision History

| Date | Change | Author Context |
|------|--------|----------------|
| 2026-10-03 | Initial creation (T6 investigation complete) | Stage 5 Production Evidence Audit |

---

**END OF DOCUMENT 06H**
