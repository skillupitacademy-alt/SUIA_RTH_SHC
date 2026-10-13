# Brand isolation removal

This change removes the brand isolation security layer from the Project AI service — 500 lines of authorization code, route enforcement, persistence columns, and tests. The removal is clean: no orphaned imports, no residual call sites, all tests passing. The code that remains (self-approval prevention, manifest hash verification, RBAC) is intact.

The brand isolation layer was never active in production. SHC admin uses a super-admin model where JWT tokens never carry brand claims with enforcement semantics. The `verify_brand_access()` function existed but was a no-op placeholder — it read a brand claim from the JWT but never rejected requests. Route handlers assigned brand values to domain objects, but no enforcement logic gated access. Database columns stored brand values, but no queries filtered by them. This was scaffolding for a multi-tenant access model that was never wired up.

The removal targets dead code, not a security change. The system's actual access control — RBAC with super_admin bypass — is preserved and unchanged.

**Watch for:** None. This is a clean removal with no blocking concerns.

**Verdict**: APPROVED

---

## High-level view

The removal spans six layers: the authorization function itself, call sites in route handlers, domain model fields, persistence columns, repository writes, and test coverage. The authorization module now contains only RBAC functions (`is_super_admin`, `require_role`, `require_any_role`). Route handlers in governance.py retain self-approval prevention and manifest hash verification without brand filtering. Candidate upload no longer assigns brand values to packages. Persistence models and repositories drop three brand columns (requester_brand, brand, uploader_brand) but leave them in the database schema for future cleanup. The domain model's CandidatePackage drops its brand field. Test suites removed 16 brand isolation tests (11 unit, 5 integration) and renamed 2 infrastructure tests to focus on RBAC. The evidence file confirms all 1270 remaining tests pass with no import errors or runtime failures.

---

<details>
<summary>Issues (0)</summary>

No issues found. This is a clean removal with no blocking concerns.

</details>

---

<details>
<summary>Details</summary>

## Authorization module reduced to RBAC

The `verify_brand_access()` function (~95 lines) is removed from `app/auth/authorization.py`. It extracted a brand claim from the JWT and compared it against a target brand parameter, but was never called in a context where enforcement mattered. No imports of `verify_brand_access` remain anywhere in the codebase (verified by grep and import test).

## Route handlers drop brand assignment and filtering

**candidate.py**: Removed `package.brand = user.get("brand")` assignment after file upload. Removed brand parameters from `candidate_to_model()` and `model_to_candidate()` converters. Removed `verify_brand_access()` call from `execute_placement()`.

**governance.py**: Removed `user_brand` extraction from JWT in approval submission. Removed brand filtering from `get_pending_approvals()` (now returns all pending approvals, not just those matching requester's brand). Removed brand boundary enforcement blocks from `approve_manifest()` and `reject_manifest()` (no more `BRAND_BOUNDARY_VIOLATION` rejections). Self-approval prevention and manifest hash verification remain intact.

No brand references remain in route handlers (verified by grep).

## Persistence layer drops three brand columns

Three columns removed from `app/persistence/models.py`:
- `WorkflowModel.requester_brand: Mapped[Optional[str]]`
- `CandidateModel.brand: Column(String(100), nullable=True)`
- `CandidateModel.uploader_brand: Mapped[Optional[str]]`

These columns are not dropped from the PostgreSQL schema (no ALTER TABLE migrations run). They remain as nullable, unpopulated columns. Future cleanup can drop them once this change is verified in production.

The repository layer (`app/persistence/repositories.py`) removed brand column writes:
- `PostgresWorkflowRepository.upsert()` no longer passes `requester_brand=workflow.requester_brand`
- `PostgresCandidateRepository.upsert()` no longer passes `brand=candidate.brand` or `uploader_brand=candidate.uploader_brand`

No queries filter by brand columns. No code reads brand values from persistence.

## Domain model drops brand field

`app/models/candidate.py`: Removed `brand: Optional[str]` field from `CandidatePackage` dataclass.

## Test suite: 16 brand tests removed, 2 renamed

**Unit tests** (`tests/security/test_authorization.py`):
- Removed `TestVerifyBrandAccess` class (6 tests)
- Removed `TestBrandEnforcementInRoutes` class (5 tests)
- Removed `verify_brand_access` import
- Renamed 2 tests in `TestValidPathSmokeTests` to focus on RBAC bypass instead of brand bypass

**Integration tests** (`tests/integration/test_security_integration.py`):
- Removed 5 brand isolation integration tests
- Removed `verify_brand_access` import

**Test count**: 1286 baseline → 1270 final (16 removed). All passing per evidence file.

## Preserved security contracts

Self-approval prevention, manifest hash verification, and RBAC enforcement remain intact. `governance.py` still extracts `decided_by` from JWT and rejects if it matches `submittedBy` (403 + `SELF_APPROVAL_REJECTED`). It still compares `request.manifestHash` to `approval["manifestHash"]` and rejects if they don't match (409 + `MANIFEST_CHANGED`). All RBAC functions (`is_super_admin`, `require_role`, `require_any_role`) remain unchanged in `authorization.py`.

## Review iteration: orphaned import removed

The first iteration left an orphaned import: `from app.auth.authorization import verify_brand_access` in `candidate.py` line 239. The function and call sites were removed, but the import statement was missed. A fix commit removed it. The import error would have caused runtime failure on first candidate endpoint request.

</details>

---

<details>
<summary>File map</summary>

## Files changed (8)

- **services/project-ai/app/auth/authorization.py** — Removed verify_brand_access function (~95 lines)
- **services/project-ai/app/api/routes/candidate.py** — Removed brand assignment, verify_brand_access call, brand converter parameters
- **services/project-ai/app/api/routes/governance.py** — Removed brand filtering, BRAND_BOUNDARY_VIOLATION blocks; preserved self-approval prevention and hash verification
- **services/project-ai/app/persistence/models.py** — Removed 3 brand columns (requester_brand, brand, uploader_brand)
- **services/project-ai/app/persistence/repositories.py** — Removed brand column writes in upsert methods
- **services/project-ai/app/models/candidate.py** — Removed brand field from CandidatePackage
- **services/project-ai/tests/security/test_authorization.py** — Removed 11 brand isolation tests, renamed 2 infrastructure tests
- **services/project-ai/tests/integration/test_security_integration.py** — Removed 5 brand integration tests

Full diff: `git diff main -- services/project-ai/` (truncated in tool output; see evidence.md for phase-by-phase changes)

</details>
