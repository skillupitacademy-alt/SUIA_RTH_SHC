# M1 Phase 2 — Repository Adapter Error Handling Hardening Implementation Plan

## Context

The FilesystemRepositoryAdapter currently has proper error handling (commit: `ba25e9caa6`) that throws typed errors for different failure modes. However, the scanners (D1-D6) need to be updated to handle these errors correctly:
- **FileNotFoundError**: should be caught and logged as info findings for optional files, then continue
- **PermissionError**: should propagate upward as a critical infrastructure failure
- **RepositoryAccessError**: should propagate upward as a critical infrastructure failure

The adapter already implements the contract correctly. The scanners need hardening to distinguish "file not found" (which is often acceptable) from "infrastructure failure" (which must stop execution).

## Discovered State

**Package**: `@quiz/project-llm-discovery` at `packages/project-llm-discovery`

**Build system**: 
- Package manager: pnpm workspace
- Test framework: vitest (command: `pnpm --filter @quiz/project-llm-discovery test`)
- Type check: `pnpm --filter @quiz/project-llm-discovery type-check`
- Project has 24 test files with good coverage (70%+ thresholds)

**Error classes** (already implemented at `src/contracts/errors.ts`):
- `RepositoryAccessError` (base): message, repositoryPath, originalError
- `FileNotFoundError extends RepositoryAccessError`: adds filePath
- `PermissionError extends RepositoryAccessError`: adds requiredPermission

**Adapter** (`src/adapters/filesystem-repository-adapter.ts`):
- Already implements correct error handling (throws FileNotFoundError for ENOENT, PermissionError for EACCES/EPERM, RepositoryAccessError for others)
- `fileExists()` returns false for ENOENT (does not throw), throws PermissionError for access issues
- `listFiles()` has a catch-and-continue pattern for subdirectories that may need review

**Scanners requiring updates**:
1. `src/scanners/d1-structure-scanner.ts` - uses `fileExists` checks (good), no try-catch around adapter calls
2. `src/scanners/d2-runtime-scanner.ts` - uses `fileExists` checks (good), no try-catch around adapter calls
3. `src/scanners/d3-blocks-scanner.ts` - **ALREADY CORRECT**: has try-catch blocks with FileNotFoundError → warning, RepositoryAccessError → error
4. `src/scanners/d4-composer-scanner.ts` - uses `fileExists` checks (good), no try-catch around adapter calls
5. `src/scanners/d5-dependencies-scanner.ts` - no error handling around adapter calls
6. `src/scanners/d6-tests-scanner.ts` - **ALREADY CORRECT**: has try-catch blocks with FileNotFoundError → info/warning, RepositoryAccessError → error

**Contract documentation**: `src/contracts/repository-adapter.ts` already has JSDoc with error contract

**Export point**: `src/adapters/index.ts` only exports FilesystemRepositoryAdapter (not error classes)

**Existing tests**: `__tests__/unit/filesystem-repository-adapter.test.ts` has 13 test cases covering all error scenarios

---

## Implementation Plan

- [ ] 1. **Export error classes from adapters index**
      
      The error classes are defined in `src/contracts/errors.ts` but need to be exported from `src/adapters/index.ts` so scanners can import them.
      
      **Files**: 
      - `packages/project-llm-discovery/src/adapters/index.ts`
      
      **Changes**: Add export for error classes:
      ```typescript
      export { FilesystemRepositoryAdapter } from './filesystem-repository-adapter.js';
      export { 
        RepositoryAccessError, 
        FileNotFoundError, 
        PermissionError 
      } from '../contracts/errors.js';
      ```
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery type-check` — no type errors

- [ ] 2. **Update D1 structure scanner error handling**
      
      Add try-catch blocks around adapter calls in `scanRepositoryStructure()` to handle FileNotFoundError for optional directories (log info finding, return empty array) and propagate PermissionError/RepositoryAccessError.
      
      **Files**: 
      - `packages/project-llm-discovery/src/scanners/d1-structure-scanner.ts`
      
      **Changes**:
      - Import error classes: `import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';`
      - Wrap the three directory scans (apps/, packages/, services/) in try-catch blocks
      - For FileNotFoundError: add info finding like `findings.push({ findingId: randomUUID(), severity: 'info', category: 'structure-discovery', message: 'Directory not found: {path}' });` then continue
      - For RepositoryAccessError: add error finding and propagate: `findings.push({ findingId: randomUUID(), severity: 'error', category: 'structure-discovery', message: 'Failed to access directory: {error.message}' }); throw error;`
      - Keep existing `fileExists()` checks as they are (they correctly return false for ENOENT)
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test` — unit tests pass (existing tests continue to work)

- [ ] 3. **Update D2 runtime scanner error handling**
      
      Add try-catch blocks around adapter calls in `scanRuntime()` for optional config files (pnpm-workspace.yaml, turbo.json, package.json) and the `getAppDirectories()` helper.
      
      **Files**: 
      - `packages/project-llm-discovery/src/scanners/d2-runtime-scanner.ts`
      
      **Changes**:
      - Import error classes: `import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';`
      - Wrap each config file read (pnpm-workspace.yaml, turbo.json, package.json) in try-catch
      - For FileNotFoundError: add info finding, continue (config is optional)
      - For RepositoryAccessError: add error finding and propagate
      - Wrap the app package.json loop's `listFiles()` call in try-catch
      - In `getAppDirectories()` helper: wrap `adapter.listFiles()` in try-catch, propagate non-ENOENT errors
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test` — unit tests pass

- [ ] 4. **Update D4 composer scanner error handling**
      
      Add try-catch blocks around adapter calls in `scanComposer()` for optional composer files (service, APIs, schemas, UI).
      
      **Files**: 
      - `packages/project-llm-discovery/src/scanners/d4-composer-scanner.ts`
      
      **Changes**:
      - Import error classes: `import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';`
      - Wrap service file read in try-catch (FileNotFoundError → warning finding "Composer service not found", continue)
      - Wrap API directory `listFiles()` in try-catch (FileNotFoundError → info, continue)
      - Wrap schema directory `listFiles()` in try-catch (FileNotFoundError → info, continue)
      - Wrap UI directory `listFiles()` in try-catch (FileNotFoundError → info, continue)
      - For all: RepositoryAccessError → error finding + propagate
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test` — unit tests pass

- [ ] 5. **Update D5 dependencies scanner error handling**
      
      Add try-catch blocks around adapter calls in `scanDependencies()` when reading package.json files. Missing package.json is already handled by `fileExists()` check, but read failures need proper error propagation.
      
      **Files**: 
      - `packages/project-llm-discovery/src/scanners/d5-dependencies-scanner.ts`
      
      **Changes**:
      - Import error classes: `import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';`
      - Wrap the `readFile()` and `getFileHash()` calls inside the package loop in try-catch
      - For FileNotFoundError: add warning finding (package.json should exist if fileExists returned true), continue
      - For RepositoryAccessError: add error finding and propagate
      - The existing JSON.parse try-catch remains (handles malformed JSON separately)
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test` — unit tests pass

- [ ] 6. **Review and harden listFiles() recursive error handling in adapter**
      
      The adapter's `listFiles()` has a catch-and-continue pattern for subdirectories (`try { subFiles = ... } catch { continue; }`). This currently swallows all errors including PermissionError. Update to propagate PermissionError and RepositoryAccessError, only continue for FileNotFoundError (rare edge case where directory disappears during scan).
      
      **Files**: 
      - `packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts`
      
      **Changes**:
      - In `listFiles()` method, replace the subdirectory catch block (currently `try { ... } catch { continue; }`) with:
      ```typescript
      try {
        const subFiles = await this.listFiles(relativePath, pattern);
        files.push(...subFiles);
      } catch (error) {
        // FileNotFoundError: directory disappeared during scan, skip it
        if (error instanceof FileNotFoundError) {
          continue;
        }
        // PermissionError or RepositoryAccessError: propagate upward
        throw error;
      }
      ```
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test` — adapter tests pass, including the recursive listFiles test

- [ ] 7. **Add comprehensive error handling tests for adapters**
      
      Create new test file covering error propagation scenarios: FileNotFoundError for missing files, PermissionError for inaccessible files, RepositoryAccessError for unexpected failures, and recursive listFiles error propagation.
      
      **Files**: 
      - `packages/project-llm-discovery/__tests__/unit/adapter-errors.test.ts` (new file)
      
      **Test cases** (8 total):
      1. `readFile()` throws FileNotFoundError for ENOENT
      2. `readFile()` throws PermissionError for EACCES
      3. `readFile()` throws RepositoryAccessError for other errors
      4. `listFiles()` throws FileNotFoundError for missing directory
      5. `listFiles()` propagates PermissionError from subdirectory (not caught and continued)
      6. `listFiles()` continues past FileNotFoundError in subdirectory (race condition)
      7. `getFileHash()` throws FileNotFoundError for missing file
      8. `fileExists()` returns false for ENOENT but throws PermissionError for EACCES
      
      Use vitest mocking pattern from existing `filesystem-repository-adapter.test.ts` (mock node:fs/promises, node:crypto).
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test __tests__/unit/adapter-errors.test.ts` — all 8 tests pass

- [ ] 8. **Add integration tests for scanner error handling**
      
      Create integration tests that verify scanners handle FileNotFoundError gracefully (log finding, continue) and propagate PermissionError/RepositoryAccessError.
      
      **Files**: 
      - `packages/project-llm-discovery/__tests__/integration/scanner-error-handling.test.ts` (new file)
      
      **Test cases** (6 total):
      1. D1 scanner: missing apps/ directory logs info finding, returns empty applications array
      2. D2 scanner: missing pnpm-workspace.yaml logs info finding, continues with unknown workspace
      3. D3 scanner: missing block corpus doc logs warning finding, continues (already implemented, verify behavior)
      4. D4 scanner: missing composer service logs warning finding, returns empty services array
      5. D5 scanner: missing package.json logs warning finding, skips that package
      6. D6 scanner: missing vitest config logs info finding, continues (already implemented, verify behavior)
      
      Mock the RepositoryAdapter to return specific errors (FileNotFoundError, PermissionError) and verify scanner responses.
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery test __tests__/integration/scanner-error-handling.test.ts` — all 6 tests pass

- [ ] 9. **Update main index.ts to export error classes**
      
      Export error classes from the package's main entry point so consumers can handle errors properly.
      
      **Files**: 
      - `packages/project-llm-discovery/src/index.ts`
      
      **Changes**: Add error class exports:
      ```typescript
      export {
        RepositoryAccessError,
        FileNotFoundError,
        PermissionError,
      } from './contracts/errors.js';
      ```
      
      **Verify**: `pnpm --filter @quiz/project-llm-discovery type-check` — no type errors

- [ ] 10. **Update README with error handling guidance**
      
      Add a new "Error Handling" section to the README explaining the three error types, when each is thrown, and how consumers should handle them.
      
      **Files**: 
      - `packages/project-llm-discovery/README.md`
      
      **Changes**: Add new section after "Usage" and before "Architecture":
      ```markdown
      ## Error Handling
      
      The discovery system uses typed errors to distinguish between different failure modes:
      
      ### Error Types
      
      - **FileNotFoundError**: Thrown when a requested file or directory does not exist (ENOENT). Scanners typically log this as an info or warning finding and continue, since many files are optional.
      
      - **PermissionError**: Thrown when file system access is denied (EACCES/EPERM). This indicates an infrastructure problem that must be resolved. Scanners propagate this upward and fail the scan.
      
      - **RepositoryAccessError**: Thrown for other I/O failures (network issues, corrupted files, etc.). This is a critical error that scanners propagate upward.
      
      ### Handling Errors
      
      ```typescript
      import { 
        buildSnapshot, 
        FileNotFoundError, 
        PermissionError, 
        RepositoryAccessError 
      } from '@quiz/project-llm-discovery';
      
      try {
        const snapshot = await buildSnapshot(repositoryRoot, adapter);
      } catch (error) {
        if (error instanceof PermissionError) {
          console.error('Access denied:', error.filePath);
          console.error('Required permission:', error.requiredPermission);
        } else if (error instanceof RepositoryAccessError) {
          console.error('Repository access failed:', error.message);
          console.error('Original error:', error.originalError);
        } else {
          throw error;
        }
      }
      ```
      
      Note: `FileNotFoundError` is rarely thrown from `buildSnapshot()` because scanners treat missing optional files as warnings, not errors. It may appear when calling adapter methods directly.
      ```
      
      **Verify**: Visual inspection — section is clear and examples are correct

- [ ] 11. **Run full test suite and verify no regressions**
      
      Run the complete test suite to ensure all existing tests pass and new error handling doesn't break existing functionality.
      
      **Files**: N/A (validation step)
      
      **Commands**:
      - `pnpm --filter @quiz/project-llm-discovery type-check` — no type errors
      - `pnpm --filter @quiz/project-llm-discovery test` — all tests pass (should be 24 original + 2 new = 26 test files)
      - `pnpm --filter @quiz/project-llm-discovery test:coverage` — coverage remains above 70% thresholds
      
      **Expected**: All tests pass, no regressions, error handling improves robustness

- [ ] 12. **Document changes in a brief completion note**
      
      Create a brief summary of changes for the M1 Phase 2 completion record.
      
      **Files**: 
      - `packages/project-llm-discovery/.agents/m1-phase2-error-hardening-completion.md` (new file)
      
      **Content** (summary):
      - Error classes already existed and were correctly implemented
      - Adapter already had correct error handling
      - Scanners D3 and D6 already had correct patterns
      - Updated scanners D1, D2, D4, D5 to match D3/D6 patterns
      - Hardened adapter's `listFiles()` to propagate PermissionError from subdirectories
      - Added comprehensive error handling tests (14 new test cases)
      - Exported error classes from package index
      - Updated README with error handling guidance
      - All tests pass, no regressions
      
      **Verify**: Visual inspection — summary is accurate

---

## Verification Strategy

**Build command**: `pnpm --filter @quiz/project-llm-discovery type-check`

**Test command**: `pnpm --filter @quiz/project-llm-discovery test`

**Coverage command**: `pnpm --filter @quiz/project-llm-discovery test:coverage`

**Coverage thresholds** (from vitest.config.ts):
- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

**Key verification points**:
1. Type checking passes (no `any` types, strict boolean expressions)
2. All 26+ test files pass (24 original + 2 new)
3. Coverage remains above thresholds
4. No regressions in existing scanner behavior
5. New error handling tests cover all three error types
6. Integration tests verify scanner resilience

---

## Notes

**Patterns to follow**:
- D3 blocks scanner already implements the correct pattern (try-catch with FileNotFoundError → warning, RepositoryAccessError → error)
- D6 tests scanner also implements the correct pattern
- Use these as templates for updating D1, D2, D4, D5

**CRITICAL**: Never catch and swallow PermissionError or RepositoryAccessError. These indicate infrastructure failures that must propagate upward.

**FileNotFoundError handling**:
- Config files (pnpm-workspace.yaml, turbo.json): info finding, continue with defaults
- Optional directories (apps/, packages/, services/): info finding, return empty array
- Documentation files (block corpus): warning finding, continue with empty data
- Required files in a loop (package.json for existing packages): warning finding, skip that item

**Test file locations**:
- Unit tests: `__tests__/unit/` (individual component testing)
- Integration tests: `__tests__/integration/` (full pipeline testing)
- Follow existing naming: `{module-name}.test.ts`

**Import pattern** (from CONTRIBUTING.md):
- Use `import type { ... } from '...'` for type-only imports
- Use `import { ... } from '...'` for value imports
- Never use `any` type (strict lint rule)
- Handle null/undefined explicitly in boolean expressions
