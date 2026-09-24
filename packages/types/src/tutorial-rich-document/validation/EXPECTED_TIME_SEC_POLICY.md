# expectedTimeSec Field Policy

## Overview

The `expectedTimeSec` field represents estimated learning time for instructional blocks. This document clarifies the distinction between generation-time requirements and persistence-time requirements.

## Schema Status: Optional

**TypeScript/Zod Schema:**
```typescript
expectedTimeSec?: number  // Optional field
```

**Validation:**
```typescript
z.number().int().positive().optional()
```

**Rationale:** Backward compatibility with existing blocks that don't have this field.

## AI Generation Contract: Required

**Prompt Contract:**
All instructional block prompts (D1, C1, I1, S1) contain:
- Global contract via `buildExpectedTimeSecContract()`
- Block-specific estimation instructions
- Requirement to generate after content creation
- Prohibition against copying template values

**AI Requirement:**
The Composer AI **MUST** generate `expectedTimeSec` for all instructional blocks.

## Validation Strategy: Warning (Not Error)

**Custom Validator Behavior:**
```typescript
missing expectedTimeSec on instructional block
    ↓
WARNING (not error)
    ↓
block still accepted
```

**Rationale:**
- Allows graceful degradation for legacy content
- Provides feedback to improve AI generation
- Doesn't break existing workflows
- Enables gradual migration

## Three-Tier Contract Architecture

### Tier 1: Generation-Time Contract (Composer AI)
- **Status:** REQUIRED
- **Enforcement:** AI prompts explicitly instruct generation
- **Failure Mode:** AI doesn't generate → custom validator warns
- **Impact:** Analytics data missing, but block functional

### Tier 2: Persistence Contract (Database/Schema)
- **Status:** OPTIONAL
- **Enforcement:** Zod schema allows undefined
- **Failure Mode:** Missing field → stored as undefined
- **Impact:** Backward compatible with existing content

### Tier 3: Runtime Validation (Custom Validator)
- **Status:** WARNING if missing, ERROR if invalid
- **Enforcement:** Custom validator after Zod
- **Failure Mode:** Missing → warn, invalid type/range → error
- **Impact:** Guidance for improvement, blocks defects

## Comparison to progressRole

| Field | Schema | Generation | Validation | Purpose |
|-------|--------|------------|------------|---------|
| `progressRole` | OPTIONAL with default | REQUIRED | Default 'instructional' | Controls completion |
| `expectedTimeSec` | OPTIONAL | REQUIRED | WARN if missing | Analytics only |

**Key Difference:**
- `progressRole` has a **default value** ('instructional')
- `expectedTimeSec` has **no default** (undefined if missing)

This ensures:
- `progressRole` always exists → completion logic works
- `expectedTimeSec` missing → analytics gracefully degrades

## Future Migration Path

If/when all instructional blocks have `expectedTimeSec`:

### Option A: Keep Optional (Recommended)
```typescript
expectedTimeSec?: number  // Keep optional
// Rationale: Simplest, backward compatible
```

### Option B: Make Required
```typescript
expectedTimeSec: number  // Make required
// Requires: Migration script to backfill existing blocks
// Benefit: Stronger guarantee for analytics
```

**Current Recommendation:** Keep optional indefinitely. The warning-based validation provides sufficient guidance without breaking compatibility.

## Validation Error Codes

| Condition | Code | Severity | Message |
|-----------|------|----------|---------|
| Missing from instructional block | `MISSING_EXPECTED_TIME` | WARNING | "Instructional block missing expectedTimeSec. AI should generate this metadata." |
| Not a number | `INVALID_TYPE` | ERROR | "expectedTimeSec must be a number, got {type}" |
| Not an integer | `INVALID_TYPE` | ERROR | "expectedTimeSec must be a whole number (integer), got {value}" |
| Zero or negative | `INVALID_RANGE` | ERROR | "expectedTimeSec must be greater than 0, got {value}" |
| Nested in content | `INVALID_PLACEMENT` | ERROR | "expectedTimeSec found inside content object. It must be at block root level only." |
| Nested in page | `INVALID_PLACEMENT` | ERROR | "expectedTimeSec found inside content.page object. It must be at block root level only." |
| Unusually low (<50% min) | `UNUSUAL_VALUE` | WARNING | "expectedTimeSec ({value}s) is unusually low for {type} blocks. Typical range: {min}-{max}s." |
| Unusually high (>200% max) | `UNUSUAL_VALUE` | WARNING | "expectedTimeSec ({value}s) is unusually high for {type} blocks. Typical range: {min}-{max}s." |

## Testing Strategy

### Unit Tests
- Schema validation: optional field accepted
- Validator: missing → warning (not error)
- Validator: invalid types/values → error

### Integration Tests
- Prompts include generation instructions
- Validator provides appropriate feedback
- Blocks without field still process correctly

### AI Generation Tests
See `DYNAMIC_ESTIMATION_VERIFICATION.md` for AI-specific testing strategy.

## Architectural Separation

**Critical:**
```
expectedTimeSec
    ↓
ONLY affects analytics
    ↓
NOT used for completion/eligibility
```

```
progressRole
    ↓
Controls completion logic
    ↓
resolveRequiredBlocks()
    ↓
R/Y/G status
```

Changing `expectedTimeSec` **MUST NOT** change:
- `requiredBlocks`
- `completedBlocks`
- `progressPercentage`
- R/Y/G calculation
- ILS completion flow

This separation is verified in Phase 2B.13 tests and must remain intact.

## Summary

| Aspect | Status |
|--------|--------|
| **Schema** | Optional (backward compatible) |
| **AI Contract** | Required (generate for all new blocks) |
| **Validation** | Warn if missing, error if invalid |
| **Purpose** | Analytics metadata only |
| **Completion Impact** | None (uses progressRole) |
| **Migration** | Gradual (no breaking changes) |

This policy enables:
1. **Backward compatibility** - Existing blocks work unchanged
2. **Forward progress** - New blocks include analytics data
3. **Graceful degradation** - Missing data doesn't break workflows
4. **Clear feedback** - Warnings guide improvement
5. **Type safety** - Errors catch actual defects
