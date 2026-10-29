# Project LLM Schema Integration - Complete Analysis

**Date:** 2026-10-29  
**Issue:** ObjectiveO1 block save operations fail with "Invalid request data" 400 error  
**Root Cause:** Missing `patch_blocks_schema()` function in Project LLM backend  

---

## Executive Summary

The Project LLM integration workflow (Stepper 5-6) successfully places files but **does NOT register the new block schema in the Zod union** at `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`. This causes API validation to reject save/publish operations because `ObjectiveO1BlockSchema` is not a member of `TutorialBlockSchema`.

**Solution:** Implement missing `patch_blocks_schema()` patcher function and integrate it into the placement pipeline.

---

## Files Studied (Complete Backend Analysis)

### ✅ Core Placement System
1. **`services/project-ai/app/placement/patcher.py`** - Contains 6 existing patchers, missing `patch_blocks_schema()`
2. **`services/project-ai/app/placement/executor.py`** - Orchestrates file operations in isolated worktrees
3. **`services/project-ai/app/placement/comparator.py`** - Generates `PlacementFileOperation` list via `derive_file_operations()`
4. **`services/project-ai/app/placement/worktree_manager.py`** - Manages git worktree isolation
5. **`services/project-ai/app/placement/repository_adapter.py`** - Safe repository mutations

### ✅ Data Models
6. **`services/project-ai/app/models/candidate.py`** - Defines `PlacementFileAction` enum and `PlacementFileOperation` model

### ✅ API & Orchestration
7. **`services/project-ai/app/api/routes/candidate.py`** - Entry point for candidate upload, calls `derive_file_operations()`
8. **`services/project-ai/app/intake/placement_manifest.py`** - Legacy manifest generator (Wave 3C superseded by comparator)

### ✅ Frontend TypeScript Targets
9. **`packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`** - **CRITICAL TARGET** - Union definition
10. **`packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`** - Example versioned schema pattern
11. **`packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema.ts`** - Example versioned schema pattern
12. **`packages/ui/src/tutorial/types/objective-o1.schema.ts`** - **WRONG LOCATION** - Should be in packages/types

---

## Current Flow (Stepper 5-6)

```
User uploads ZIP → POST /api/candidate/upload
  ↓
Backend extracts + validates files
  ↓
Reads block.integration.json (family, version, component, schemas)
  ↓
comparator.derive_file_operations() generates PlacementFileOperation[]
  ↓
Operations include:
  ✅ CREATE - Component file (ObjectiveO1Block.tsx)
  ✅ CREATE - Test file
  ✅ CREATE - JSON schema
  ✅ CREATE - TypeScript schema/types
  ✅ PATCH_RENDERER - generatedBlockRenderers.tsx
  ✅ PATCH_GENERATED_REGISTRY - generatedBlockRegistries.ts
  ✅ PATCH_COMPOSER_DEFINITION - generatedBlockVersionDefinitions.ts
  ❌ MISSING - PATCH_BLOCKS_SCHEMA (blocks.schema.ts)
  ↓
executor._execute_manifest_operations() in isolated worktree
  ↓
Phase 1: Preflight validation (all operations)
Phase 2: Atomic execution (write all files + patches)
  ↓
Git commit in worktree
  ↓
SUCCESS - but schema union never updated
```

---

## Existing Patcher Functions (Reference)

### 1. `patch_tutorial_block_renderer()`
**Target:** `packages/ui/src/tutorial/generatedBlockRenderers.tsx`  
**Pattern:**
- Adds import: `import { ObjectiveO1Block } from './blocks/ObjectiveO1Block';`
- Adds entry before marker: `{ family: 'objective', version: 'O1', component: ObjectiveO1Block },`
- Marker: `// PROJECT_LLM_GENERATED_RENDERERS`
- Idempotent: Updates in place if entry exists

### 2. `patch_generated_block_registry()`
**Target:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts`  
**Pattern:**
- Appends family block with version OR appends version to existing family
- Uses balanced bracket scanning for nested arrays
- Marker: `// PROJECT_LLM_GENERATED_REGISTRIES`
- Handles UPDATE_IN_PLACE vs ADD_NEW_VERSION

### 3. `patch_generated_block_version_definitions()`
**Target:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/generatedBlockVersionDefinitions.ts`  
**Pattern:**
- Adds entry: `{ type: 'objective', version: 'O1', payloadFormat: 'canonical' },`
- Marker: `// PROJECT_LLM_GENERATED_DEFINITIONS`
- Keyed by (type, version) pair with duplicate detection

### 4. `patch_tutorial_page_content_types()`
**Target:** Legacy types file (less critical)  
**Pattern:**
- Adds type to union: `'objective'`

### 5. `patch_family_registry()` + `create_family_registry()`
**Target:** Family-specific registry files  
**Pattern:**
- Appends version to family's versions array

---

## Missing Patcher: `patch_blocks_schema()`

### Target File Structure

**File:** `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`

```typescript
// Import section (alphabetically sorted by family)
import { IntroductionI1BlockSchema } from './introduction-i1.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema'; // ← ADD THIS

// Re-export section
export * from './introduction-i1.schema';
export * from './objective-o1.schema'; // ← ADD THIS

// Union definition
export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    HeadingBlockSchema,
    IntroductionI1BlockSchema,
    ObjectiveO1BlockSchema, // ← ADD THIS
    // ... other schemas
  ])
);
```

### Required Operations

1. **Add import statement**
   - Pattern: `import { <SchemaName> } from './<filename>';`
   - Location: After last versioned schema import (alphabetically)
   - Example: `import { ObjectiveO1BlockSchema } from './objective-o1.schema';`

2. **Add re-export statement**
   - Pattern: `export * from './<filename>';`
   - Location: In re-export section (alphabetically)
   - Example: `export * from './objective-o1.schema';`

3. **Add schema to union array**
   - Pattern: Add `<SchemaName>,` inside `z.union([...])`
   - Location: Alphabetically sorted position
   - Idempotent: Check if already present

### Patcher Function Signature

```python
def patch_blocks_schema(
    content: str,
    schema_filename: str,  # e.g., "objective-o1.schema.ts"
    schema_export_name: str,  # e.g., "ObjectiveO1BlockSchema"
) -> str:
    """
    Add block schema to Zod union in blocks.schema.ts.
    
    Operations:
    1. Add import statement (if not present)
    2. Add re-export statement (if not present)
    3. Add schema to z.union([...]) array (if not present)
    
    Idempotent: Safe to call multiple times.
    Duplicate detection: Raises PatchError if multiple entries exist.
    """
```

---

## Implementation Requirements

### 1. Add `PATCH_BLOCKS_SCHEMA` to `PlacementFileAction` enum

**File:** `services/project-ai/app/models/candidate.py`

```python
class PlacementFileAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    PATCH_RENDERER = "PATCH_RENDERER"
    PATCH_FAMILY_REGISTRY = "PATCH_FAMILY_REGISTRY"
    PATCH_REGISTRY = "PATCH_REGISTRY"
    PATCH_TYPES = "PATCH_TYPES"
    PATCH_COMPOSER_DEFINITION = "PATCH_COMPOSER_DEFINITION"
    PATCH_GENERATED_REGISTRY = "PATCH_GENERATED_REGISTRY"
    PATCH_BLOCKS_SCHEMA = "PATCH_BLOCKS_SCHEMA"  # ← ADD THIS
    SKIP = "SKIP"
```

### 2. Implement `patch_blocks_schema()` function

**File:** `services/project-ai/app/placement/patcher.py`

- Add function after existing patchers
- Follow same pattern: idempotent, duplicate detection, fail-closed
- Use regex patterns for surgical insertion
- Handle import sorting (alphabetically by filename)
- Handle union array insertion (alphabetically by schema name)

### 3. Generate `PATCH_BLOCKS_SCHEMA` operation in comparator

**File:** `services/project-ai/app/placement/comparator.py`  
**Method:** `derive_file_operations()`

Add operation generation after `PATCH_COMPOSER_DEFINITION`:

```python
# Add PATCH_BLOCKS_SCHEMA operation
blocks_schema_rel_path = "packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts"
schema_filename = integration_metadata.get("typeSchemaFile")  # e.g., "objective-o1.schema.ts"
schema_export_name = f"{family_name}{version_upper}BlockSchema"

operations.append(PlacementFileOperation(
    action=PlacementFileAction.PATCH_BLOCKS_SCHEMA,
    source_filename=integration_filename,
    source_sha256=compute_sha256(json.dumps(integration_metadata, sort_keys=True)),
    target_path=blocks_schema_rel_path,
    expected_pre_hash=get_pre_hash(blocks_schema_rel_path),
    patch_strategy="UNION_MEMBER",
    description=f"Register {schema_export_name} in TutorialBlockSchema Zod union"
))
```

### 4. Handle `PATCH_BLOCKS_SCHEMA` in executor

**File:** `services/project-ai/app/placement/executor.py`  
**Method:** `_execute_manifest_operations()` Phase 1 (Preflight)

Add elif handler after `PATCH_COMPOSER_DEFINITION`:

```python
elif op.action == PlacementFileAction.PATCH_BLOCKS_SCHEMA:
    if not target_file_path.exists():
        raise PlacementExecutionError(f"Preflight failed: Target blocks schema '{op.target_path}' does not exist")
    current_content = target_file_path.read_text(encoding='utf-8')
    current_hash = compute_sha256(current_content)
    if op.expected_pre_hash and current_hash != op.expected_pre_hash:
        raise PlacementExecutionError(
            f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
        )
    
    # Extract schema metadata from integration_metadata
    schema_filename = integration_metadata.get("typeSchemaFile")
    schema_export_name = f"{manifest.blockFamily.value}{manifest.blockVersion.upper()}BlockSchema"
    
    patched = patch_blocks_schema(
        current_content,
        schema_filename=schema_filename,
        schema_export_name=schema_export_name,
    )
    staged_writes.append((target_file_path, patched))
```

### 5. Import `patch_blocks_schema` in executor

**File:** `services/project-ai/app/placement/executor.py`

Add to imports:

```python
from app.placement.patcher import (
    compute_sha256,
    create_family_registry,
    patch_family_registry,
    patch_tutorial_block_renderer,
    patch_tutorial_composer_registry,
    patch_tutorial_page_content_types,
    patch_generated_block_registry,
    patch_generated_block_version_definitions,
    patch_blocks_schema,  # ← ADD THIS
)
```

---

## Schema File Location Issue

**Current (Wrong):** `packages/ui/src/tutorial/types/objective-o1.schema.ts`  
**Correct:** `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts`

### Why This Matters

1. **Import path resolution** - `blocks.schema.ts` imports from `'./objective-o1.schema'` (same directory)
2. **Package architecture** - Types package is source of truth for schemas
3. **Existing pattern** - All versioned schemas (code-c1, introduction-i1) are in `packages/types/src/tutorial-rich-document/schemas/`

### Fix Required in `comparator.py`

Update schema file placement logic in `derive_file_operations()`:

```python
# TypeScript Schema / Types
elif filename.endswith('.schema.ts') or filename.endswith('.types.ts'):
    # Place in packages/types, not packages/ui
    operations.append(make_candidate_file_op(
        filename, 
        source_sha, 
        f"packages/types/src/tutorial-rich-document/schemas/{filename}",  # ← CORRECTED PATH
        "TypeScript Zod schema"
    ))
```

---

## Testing Strategy

### Unit Test: `test_patch_blocks_schema()`

**File:** `services/project-ai/tests/test_patcher.py`

Test cases:
1. ✅ Add schema to empty union (first schema)
2. ✅ Add schema to existing union (alphabetical insertion)
3. ✅ Idempotency (schema already present)
4. ✅ Duplicate detection (fails closed)
5. ✅ Import statement insertion
6. ✅ Re-export statement insertion
7. ✅ Handles comments and whitespace

### Integration Test: End-to-End Flow

**File:** `services/project-ai/tests/test_file_operations_placement.py`

Test:
1. Upload ObjectiveO1 ZIP with valid `block.integration.json`
2. Verify `PATCH_BLOCKS_SCHEMA` operation generated
3. Verify operation executes successfully
4. Verify `blocks.schema.ts` contains import, export, and union entry

---

## Re-Upload Process (After Implementation)

1. **Implement all 5 changes above** (enum, patcher, comparator, executor, imports)
2. **Fix schema file path** in comparator (packages/types not packages/ui)
3. **Run unit tests** to verify patcher logic
4. **Re-upload ObjectiveO1 ZIP** via Project LLM UI
5. **Execute Stepper 5** (Upload candidate)
6. **Execute Stepper 6** (Place candidate) - This will now patch blocks.schema.ts
7. **Verify in blocks.schema.ts**:
   - Import statement added
   - Re-export statement added
   - ObjectiveO1BlockSchema in union array
8. **Test save operation** in Tutorial Composer - Should return 200 OK

---

## Estimated Effort

- **Patcher function implementation:** 30 minutes
- **Enum + comparator updates:** 15 minutes
- **Executor integration:** 20 minutes
- **Schema path fix:** 10 minutes
- **Unit tests:** 30 minutes
- **Integration testing:** 20 minutes
- **Re-upload and verification:** 15 minutes

**Total:** ~2.5 hours for complete implementation and testing

---

## Risk Assessment

### Low Risk ✅
- Patcher uses same pattern as existing functions
- Regex-based patching is proven approach
- Idempotent and fail-closed design
- Isolated worktree prevents main branch corruption

### Medium Risk ⚠️
- Schema file in wrong location (fixable)
- TypeScript union syntax changes could break regex (unlikely)

### Mitigation
- Pre-image hash verification catches unexpected file changes
- Unit tests catch regex edge cases
- Preflight validation fails before any writes

---

## Success Criteria

✅ `PATCH_BLOCKS_SCHEMA` enum value exists  
✅ `patch_blocks_schema()` function implemented with tests  
✅ Comparator generates PATCH_BLOCKS_SCHEMA operation  
✅ Executor handles PATCH_BLOCKS_SCHEMA action  
✅ Schema files placed in correct location (packages/types)  
✅ Re-upload ObjectiveO1 → Stepper 6 completes successfully  
✅ `blocks.schema.ts` contains ObjectiveO1BlockSchema  
✅ Tutorial Composer save/publish returns 200 OK  

---

## Conclusion

The root cause is definitively identified: **missing `patch_blocks_schema()` function**. All other integration points (renderer, registry, definitions) work correctly. Implementation is straightforward following existing patterns. Re-uploading the ZIP after implementing this fix will complete the integration automatically via Stepper 5-6.
