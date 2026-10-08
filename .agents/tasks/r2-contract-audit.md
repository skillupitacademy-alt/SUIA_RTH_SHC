# R2 Engineering Contract Audit

## Purpose
This audit documents which fields in the `create_engineering_contract()` function (services/project-ai/app/api/routes/contract.py) are currently hardcoded versus derived from snapshot evidence. This establishes the baseline before implementing evidence-backed field tracking in Wave 2 (R2).

## Audit Date
Generated during FEAT-001 implementation

## Function Location
File: `services/project-ai/app/api/routes/contract.py`  
Function: `create_engineering_contract()`  
Lines: 327-437 (EngineeringContract construction)

---

## HARDCODED FIELDS (Currently Not Evidence-Backed)

### Educational Contract (Lines 334-337)
- **Line 335**: `difficulty_level='intermediate'` - HARDCODED
  - Current: Static string literal
  - Should derive from: Snapshot metadata or learning objective complexity analysis
  
- **Line 336**: `content_type=target.block_type` - DERIVED from request parameter
  - This is passed through from the workflow target, not snapshot evidence

### Implementation Contract (Lines 338-347)
- **Line 339**: `language='TypeScript'` - HARDCODED
  - Current: Static string literal
  - Should derive from: Snapshot file extension analysis or project metadata

- **Line 340**: `framework='React'` - HARDCODED
  - Current: Static string literal
  - Should derive from: package.json dependencies or import statement analysis

- **Line 341**: `style='CSS Modules'` - HARDCODED
  - Current: Static string literal
  - Should derive from: File pattern analysis or style configuration detection

- **Lines 342-346**: `file_structure` paths - HARDCODED
  - `component`: Template string with target.family/version interpolation
  - `schema`: Template string with target.family/version interpolation
  - `types`: Template string with target.family/version interpolation
  - `tests`: Template string with target.family/version interpolation
  - Current: Assumes fixed directory structure
  - Should derive from: Snapshot file evidence or directory pattern discovery

### Type Contract (Lines 348-352)
- **Line 349**: `strict_mode=True` - HARDCODED
  - Current: Static boolean
  - Should derive from: tsconfig.json analysis

- **Line 350**: `no_any=True` - HARDCODED
  - Current: Static boolean
  - Should derive from: tsconfig.json or ESLint rule analysis

- **Line 351**: `no_implicit_any=True` - HARDCODED
  - Current: Static boolean
  - Should derive from: tsconfig.json compilerOptions

### UBRC Contract (Lines 354-359)
- **Line 355**: `required=True` - HARDCODED
  - Should derive from: Interface analysis or prop type inspection

- **Line 356**: `props=["ubrc"]` - HARDCODED
  - Should derive from: Component props signature analysis

- **Line 357**: `type="UniversalBlockRuntimeContext"` - HARDCODED
  - Should derive from: Type definition evidence

- **Line 358**: `validation="strict"` - HARDCODED
  - Should derive from: Validation logic analysis

### Theme Contract (Lines 366-370)
- **All fields HARDCODED**: `theme_independent`, `props`, `required_theme_props`, `no_hardcoded_colors`
- Should derive from: Component implementation analysis

### Brand Contract (Lines 371-376)
- **All fields HARDCODED**: `brand_independent`, `no_hardcoded_logos`, `no_hardcoded_brand_names`, `brand_via_props_only`
- Should derive from: Static analysis of string literals and imports

### ILS Contract (Lines 377-382)
- **All fields HARDCODED**: `passive_integration`, `props`, `no_direct_api_calls`, `page_level_only`
- Should derive from: API call analysis and component hierarchy inspection

### LSNB Contract (Lines 383-387)
- **All fields HARDCODED**: `page_level_only`, `no_block_level_nav`, `props`
- Should derive from: Component hierarchy and navigation element analysis

### RSSB Contract (Lines 388-392)
- **All fields HARDCODED**: `page_level_only`, `no_block_level_status`, `props`
- Should derive from: Component hierarchy and status element analysis

### Tests Required (Lines 420-426)
- **Lines 421-426**: All test requirement strings - HARDCODED
  - Current: Static list of test categories
  - Should derive from: Test coverage analysis or test file evidence

---

## SNAPSHOT-DERIVED FIELDS (Currently Evidence-Backed)

### From RepositoryBlockContract (`repo_contract`)
These fields are already derived from snapshot evidence via `build_repo_contract()`:

- **Line 333**: `canonical_references=repo_contract.references` - DERIVED
  - Source: Snapshot evidence array, filtered by `kind='canonical_block'`
  - Evidence tracking: RepositoryEvidence includes sha256 and evidence_id

- **Line 353**: `schema_contract=repo_contract.schema_contract` - DERIVED
  - Source: Built by repository_intelligence.py from snapshot

- **Line 360**: `renderer_contract=repo_contract.renderer_contract` - DERIVED
  - Source: Built by repository_intelligence.py from snapshot

- **Line 361**: `composer_contract=repo_contract.composer_contract` - DERIVED
  - Source: Built by repository_intelligence.py from snapshot

- **Line 362**: `runtime_contract=repo_contract.runtime` - DERIVED
  - Source: Built by repository_intelligence.py from snapshot (RuntimeContract model)

- **Line 394**: `required_artifacts=repo_contract.required_artifacts` - DERIVED
  - Source: Built by repository_intelligence.py from snapshot

- **Line 428**: `acceptance_criteria=repo_contract.acceptance_criteria` - DERIVED
  - Source: Built by repository_intelligence.py from snapshot

---

## METADATA FIELDS (Not From Snapshot)

- **Line 319**: `contract_id` - Generated using workflow_id + UUID
- **Line 320**: `workflow_id` - Passed from request parameter
- **Line 321**: `target` - Passed from request parameter (WorkflowTarget)
- **Line 322**: `contract_version="1.0"` - Static version identifier
- **Line 323**: `repository_snapshot_id` - From target.source_snapshot_id
- **Line 324**: `repository_snapshot_sha256` - Calculated from snapshot file
- **Line 431**: `prohibited_behaviors=PROHIBITED_BEHAVIORS` - Module constant
- **Line 434**: `contract_hash=""` - Generated after contract creation

---

## SUMMARY

**Total Hardcoded Field Groups**: 11
- Educational contract (1 field)
- Implementation contract (4 fields)
- Type contract (3 fields)
- UBRC contract (4 fields)
- Theme contract (4 fields)
- Brand contract (4 fields)
- ILS contract (4 fields)
- LSNB contract (3 fields)
- RSSB contract (3 fields)
- Tests required (6 items)

**Total Evidence-Backed Field Groups**: 7
- canonical_references
- schema_contract
- renderer_contract
- composer_contract
- runtime_contract
- required_artifacts
- acceptance_criteria

**Evidence Coverage**: ~39% of contract fields are currently evidence-backed.

---

## NEXT STEPS (R2 Features)

1. **FEAT-001**: Add ContractFieldEvidence model and evidence tracking infrastructure (this feature)
2. **FEAT-002**: Derive language/framework from snapshot package.json and imports
3. **FEAT-003**: Derive TypeScript config from snapshot tsconfig.json
4. **FEAT-004**: Derive file structure from snapshot directory patterns
5. **FEAT-005**: Derive theme/brand/ILS/LSNB/RSSB contracts from component analysis
6. **FEAT-006**: Derive difficulty level from learning objective complexity
7. **FEAT-007**: Derive test requirements from existing test files

**Goal**: Achieve 100% evidence-backed fields with full provenance tracking.
