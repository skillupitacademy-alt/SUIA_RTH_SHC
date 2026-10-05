# Implementation Plan: M1 P0 Defect Corrections

This plan addresses four P0 defects identified in the forensic audit of PR #23 (branch: m1-repository-discovery).

## Overview

The four P0 defects are:
1. **P0-4**: Repository error handling — silent failures hide infrastructure problems
2. **P0-3**: D6 integration test discovery — reports 0 suites when 6 files exist
3. **P0-2**: V1 schema strength — z.any() everywhere provides no validation
4. **P0-1**: D3 VERIFIED semantics — assumes documented: true, weak verification criteria

These are ordered by dependency: error handling first (affects all scanners), then specific scanner fixes (D6, D3), then validation (V1 depends on clean data from scanners).

---

## P0-4: Repository Error Handling (CRITICAL)

### Files
- `packages/project-llm-discovery/src/contracts/errors.ts` (create)
- `packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts`
- `packages/project-llm-discovery/src/contracts/repository-adapter.ts`
- `packages/project-llm-discovery/src/scanners/d1-structure-scanner.ts`
- `packages/project-llm-discovery/src/scanners/d2-runtime-scanner.ts`
- `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts`
- `packages/project-llm-discovery/src/scanners/d4-composer-scanner.ts`
- `packages/project-llm-discovery/src/scanners/d5-dependencies-scanner.ts`
- `packages/project-llm-discovery/src/scanners/d6-tests-scanner.ts`
- `packages/project-llm-discovery/__tests__/unit/adapters/filesystem-repository-adapter.test.ts` (create)
- All existing scanner unit tests

### Changes

**1. Create error classes (src/contracts/errors.ts)**
```typescript
export class RepositoryAccessError extends Error {
  constructor(
    message: string,
    public readonly repositoryPath: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'RepositoryAccessError';
  }
}

export class FileNotFoundError extends RepositoryAccessError {
  constructor(
    public readonly filePath: string,
    repositoryPath: string
  ) {
    super(`File not found: ${filePath}`, repositoryPath);
    this.name = 'FileNotFoundError';
  }
}

export class PermissionError extends RepositoryAccessError {
  constructor(
    filePath: string,
    repositoryPath: string,
    public readonly requiredPermission: string
  ) {
    super(`Permission denied: ${filePath}`, repositoryPath);
    this.name = 'PermissionError';
  }
}
```

**2. Update FilesystemRepositoryAdapter.readFile**

Replace:
```typescript
async readFile(path: string): Promise<string> {
  try {
    const fullPath = resolve(this.rootPath, path);
    return await readFile(fullPath, 'utf-8');
  } catch {
    return '';
  }
}
```

With:
```typescript
async readFile(path: string): Promise<string> {
  try {
    const fullPath = resolve(this.rootPath, path);
    return await readFile(fullPath, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(path, this.rootPath);
      }
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new PermissionError(path, this.rootPath, 'read');
      }
    }
    throw new RepositoryAccessError(
      `Failed to read file: ${path}`,
      this.rootPath,
      error
    );
  }
}
```

**3. Update FilesystemRepositoryAdapter.fileExists**

Keep false return for ENOENT, throw for other errors:
```typescript
async fileExists(path: string): Promise<boolean> {
  try {
    const fullPath = resolve(this.rootPath, path);
    await access(fullPath, constants.F_OK);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new PermissionError(path, this.rootPath, 'access');
      }
    }
    throw new RepositoryAccessError(
      `Failed to check file existence: ${path}`,
      this.rootPath,
      error
    );
  }
}
```

**4. Update FilesystemRepositoryAdapter.listFiles**

Remove catch block that returns [], propagate errors with proper types.

**5. Update FilesystemRepositoryAdapter.getFileHash**

Remove redundant catch — readFile now throws explicit errors.

**6. Update FilesystemRepositoryAdapter.getGitCommit and getGitRoot**

Wrap execSync in try/catch, throw RepositoryAccessError with stderr details.

**7. Update RepositoryAdapter interface JSDoc**

Document error semantics for each method.

**8. Update all scanners (d1-d6)**

Add try/catch around critical adapter calls:
- Wrap fileExists, readFile, listFiles calls
- On FileNotFoundError for optional paths: add info-severity finding
- On RepositoryAccessError: add error-severity finding, continue scanner
- On PermissionError: add error-severity finding with permission details

**9. Create filesystem-repository-adapter.test.ts**

Test cases:
- FileNotFoundError thrown on missing file read
- PermissionError thrown on EACCES (mock fs methods)
- RepositoryAccessError thrown on other fs errors
- fileExists returns false for ENOENT without throwing
- fileExists throws PermissionError for EACCES
- listFiles throws on permission denied

**10. Update existing scanner tests**

Mock adapter methods to throw new error types, verify scanners handle gracefully.

### Verify
```bash
pnpm --filter @quiz/project-llm-discovery type-check
pnpm --filter @quiz/project-llm-discovery test
```
Expected: Type check passes, all tests pass including new adapter error tests.

---

## P0-3: D6 Integration Test Discovery (HIGH)

### Files
- `packages/project-llm-discovery/src/scanners/d6-tests-scanner.ts`
- `packages/project-llm-discovery/__tests__/unit/d6-tests-scanner.test.ts`
- `packages/project-llm-discovery/__tests__/integration/test-d3-d6.ts`

### Changes

**1. Fix test file grouping logic (d6-tests-scanner.ts lines 52-89)**

Current problem: Code checks `if (testDir.includes('integration'))` but testDir is a file path, not a directory name.

Replace the __tests__ directory discovery section with:
```typescript
// Step 2: Discover test files and group by type
const allFiles = await adapter.listFiles('.');
const testFiles = allFiles.filter(f => 
  (f.endsWith('.test.ts') || f.endsWith('.spec.ts')) && 
  !f.includes('node_modules')
);

const unitDirs = new Set<string>();
const integrationDirs = new Set<string>();
const testFileCounts = new Map<string, number>();

for (const testFile of testFiles) {
  // Skip e2e tests (handled separately)
  if (testFile.includes('/e2e/') || testFile.includes('\\e2e\\')) {
    continue;
  }

  // Determine type based on path
  const isIntegration = testFile.includes('/__tests__/integration/') || 
                        testFile.includes('\\__tests__\\integration\\');
  const isUnit = testFile.includes('/__tests__/unit/') || 
                 testFile.includes('\\__tests__\\unit\\') ||
                 (testFile.includes('__tests__') && !isIntegration);

  if (isIntegration) {
    // Extract directory path
    const dirMatch = testFile.match(/^(.+\/__tests__\/integration)/);
    if (dirMatch && dirMatch[1]) {
      const dir = dirMatch[1];
      integrationDirs.add(dir);
      testFileCounts.set(dir, (testFileCounts.get(dir) ?? 0) + 1);
    }
  } else if (isUnit) {
    // Extract package or component directory
    const dirMatch = testFile.match(/^(.+\/__tests__)/);
    if (dirMatch && dirMatch[1]) {
      const dir = dirMatch[1];
      unitDirs.add(dir);
      testFileCounts.set(dir, (testFileCounts.get(dir) ?? 0) + 1);
    }
  }

  // Generate evidence for each test file
  const contentHash = await adapter.getFileHash(testFile);
  evidence.push({
    evidenceId: randomUUID(),
    scannerName,
    timestamp,
    path: testFile,
    kind: 'test-file',
    claim: 'Test file discovered',
    locator: `file:${testFile}`,
    contentHash,
  });
}

// Convert sets to TestSuite arrays
for (const dir of integrationDirs) {
  integration.push({
    name: dir.split('/').pop() ?? dir,
    path: dir,
    testCount: testFileCounts.get(dir) ?? 0,
  });
}

for (const dir of unitDirs) {
  unit.push({
    name: dir.split('/').pop() ?? dir,
    path: dir,
    testCount: testFileCounts.get(dir) ?? 0,
  });
}
```

**2. Update finding message (line 108)**

Change to show actual discovered counts properly.

**3. Add unit test for integration discovery**

In `__tests__/unit/d6-tests-scanner.test.ts`, add:
```typescript
it('should discover integration tests from __tests__/integration/ directories', async () => {
  const mockAdapter: RepositoryAdapter = {
    readFile: vi.fn().mockResolvedValue(''),
    fileExists: vi.fn().mockResolvedValue(true),
    listFiles: vi.fn().mockImplementation(async (path: string) => {
      if (path === '.') {
        return [
          'packages/project-llm-discovery/__tests__/integration/test-d3-d6.ts',
          'packages/project-llm-discovery/__tests__/integration/test-full-m1-pipeline.test.ts',
          'packages/project-llm-discovery/__tests__/integration/test-determinism.ts',
          'packages/project-llm-discovery/__tests__/unit/d1-structure-scanner.test.ts',
        ];
      }
      return [];
    }),
    getFileHash: vi.fn().mockResolvedValue('mockhash'),
    getGitCommit: vi.fn().mockResolvedValue('abc123'),
    getGitRoot: vi.fn().mockResolvedValue('/repo'),
  };

  const result = await scanTests(mockAdapter);

  expect(result.data.integration.length).toBeGreaterThanOrEqual(1);
  expect(result.data.unit.length).toBeGreaterThanOrEqual(1);
  
  const integrationSuite = result.data.integration.find(s => 
    s.path.includes('integration')
  );
  expect(integrationSuite).toBeDefined();
  expect(integrationSuite?.testCount).toBeGreaterThan(0);
});
```

**4. Update integration test assertion (test-d3-d6.ts line 113)**

Change:
```typescript
{
  name: 'D6: Integration test suites discovered',
  condition: testsResult.data.integration.length >= 1,
  actual: testsResult.data.integration.length,
  expected: '>=1',
},
```

### Verify
```bash
pnpm --filter @quiz/project-llm-discovery test
node packages/project-llm-discovery/__tests__/integration/test-d3-d6.ts
```
Expected: Integration test discovers >= 1 integration suite, test-d3-d6.ts reports integration suites >= 1 and exits 0.

---

## P0-2: V1 Schema Strength (HIGH)

### Files
- `packages/project-llm-discovery/src/validation/v1-schema-validator.ts`
- `packages/project-llm-discovery/__tests__/unit/validation/v1-schema-validator.test.ts` (create)

### Changes

**1. Define Zod schemas for all snapshot interfaces**

Add before SnapshotSchema definition:
```typescript
const ApplicationInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  framework: z.string(),
  entrypoint: z.string(),
});

const PackageInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  version: z.string(),
  dependencies: z.array(z.string()),
  exports: z.array(z.string()),
});

const ServiceInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  port: z.number().optional(),
  entrypoint: z.string(),
});

const FrameworkInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  packages: z.array(z.string()),
});

const WorkspaceInfoSchema = z.object({
  manager: z.string(),
  version: z.string(),
  packages: z.array(z.string()),
});

const BuildSystemInfoSchema = z.object({
  tool: z.string(),
  version: z.string(),
  config: z.string(),
});

const BlockFamilyDocSchema = z.object({
  family: z.string(),
  versions: z.array(z.string()),
  documentationPath: z.string(),
});

const BlockImplementationSchema = z.object({
  type: z.string(),
  version: z.string().optional(),
  path: z.string(),
  exported: z.boolean(),
});

const BlockRendererSchema = z.object({
  blockType: z.string(),
  componentPath: z.string(),
  registeredInRenderer: z.boolean(),
});

const BlockVerificationSchema = z.object({
  blockType: z.string(),
  version: z.string().optional(),
  documented: z.boolean(),
  implemented: z.boolean(),
  rendered: z.boolean(),
  tested: z.boolean(),
});

const BlockDiscrepancySchema = z.object({
  blockType: z.string(),
  version: z.string().optional(),
  issue: z.string(),
  severity: z.enum(['warning', 'error']),
  recommendation: z.string(),
});

const ComposerServiceSchema = z.object({
  name: z.string(),
  path: z.string(),
  methods: z.array(z.string()),
});

const ComposerAPISchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  handler: z.string(),
});

const ComposerSchemaObjSchema = z.object({
  name: z.string(),
  path: z.string(),
  tables: z.array(z.string()),
});

const ComposerUISchema = z.object({
  component: z.string(),
  path: z.string(),
  blocksUsed: z.array(z.string()),
});

const DependencyNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(['package', 'app', 'service']),
});

const DependencyEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['dependency', 'devDependency', 'peerDependency']),
});

const TestSuiteSchema = z.object({
  name: z.string(),
  path: z.string(),
  testCount: z.number(),
  coverage: z.object({
    statements: z.number(),
    branches: z.number(),
    functions: z.number(),
    lines: z.number(),
  }).optional(),
});
```

**2. Replace z.any() in SnapshotSchema**

Line 41-43:
```typescript
applications: z.array(ApplicationInfoSchema),
packages: z.array(PackageInfoSchema),
services: z.array(ServiceInfoSchema),
```

Line 47-49:
```typescript
frameworks: z.array(FrameworkInfoSchema),
workspace: WorkspaceInfoSchema,
buildSystem: BuildSystemInfoSchema,
```

Line 52-56:
```typescript
documented: z.array(BlockFamilyDocSchema),
implemented: z.array(BlockImplementationSchema),
rendered: z.array(BlockRendererSchema),
verified: z.array(BlockVerificationSchema),
discrepancies: z.array(BlockDiscrepancySchema),
```

Line 59-62:
```typescript
services: z.array(ComposerServiceSchema),
apis: z.array(ComposerAPISchema),
schemas: z.array(ComposerSchemaObjSchema),
ui: z.array(ComposerUISchema),
```

Line 65-66:
```typescript
nodes: z.array(DependencyNodeSchema),
edges: z.array(DependencyEdgeSchema),
```

Line 69-71:
```typescript
unit: z.array(TestSuiteSchema),
integration: z.array(TestSuiteSchema),
e2e: z.array(TestSuiteSchema),
```

Line 74 (findings): Add TODO comment:
```typescript
findings: z.array(z.any()), // TODO: Define FindingSchema for strict validation
```

**3. Create v1-schema-validator.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { validateSchema } from '../../../src/validation/v1-schema-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V1 Schema Validator', () => {
  it('should pass valid snapshot with properly typed fields', async () => {
    const snapshot: RepositorySnapshot = {
      schemaVersion: '1.0.0',
      repository: {
        owner: 'test-owner',
        name: 'test-repo',
        commitSha: 'abc123',
        scanTimestamp: '2024-01-01T00:00:00Z',
      },
      structure: {
        applications: [{
          name: 'test-app',
          path: 'apps/test-app',
          type: 'web',
          framework: 'next',
          entrypoint: 'app/page.tsx',
        }],
        packages: [],
        services: [],
      },
      runtime: {
        frameworks: [],
        workspace: {
          manager: 'pnpm',
          version: '9.0.0',
          packages: [],
        },
        buildSystem: {
          tool: 'turbo',
          version: '2.0.0',
          config: 'turbo.json',
        },
      },
      blocks: {
        documented: [],
        implemented: [],
        rendered: [],
        verified: [],
        discrepancies: [],
      },
      composer: {
        services: [],
        apis: [],
        schemas: [],
        ui: [],
      },
      dependencies: {
        nodes: [],
        edges: [],
      },
      tests: {
        unit: [],
        integration: [],
        e2e: [],
      },
      evidence: [],
      findings: [],
      canonicalHash: 'hash123',
    };

    const result = await validateSchema(snapshot);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when application missing required field', async () => {
    const snapshot = {
      schemaVersion: '1.0.0',
      repository: {
        owner: 'test',
        name: 'test',
        commitSha: 'abc',
        scanTimestamp: '2024-01-01T00:00:00Z',
      },
      structure: {
        applications: [{
          name: 'test-app',
          // missing path, type, framework, entrypoint
        }],
        packages: [],
        services: [],
      },
      runtime: { frameworks: [], workspace: {}, buildSystem: {} },
      blocks: { documented: [], implemented: [], rendered: [], verified: [], discrepancies: [] },
      composer: { services: [], apis: [], schemas: [], ui: [] },
      dependencies: { nodes: [], edges: [] },
      tests: { unit: [], integration: [], e2e: [] },
      evidence: [],
      findings: [],
      canonicalHash: 'hash',
    } as unknown as RepositorySnapshot;

    const result = await validateSchema(snapshot);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.code).toBe('SCHEMA_VALIDATION_FAILED');
  });

  it('should fail when workspace is wrong type', async () => {
    const snapshot = {
      schemaVersion: '1.0.0',
      repository: {
        owner: 'test',
        name: 'test',
        commitSha: 'abc',
        scanTimestamp: '2024-01-01T00:00:00Z',
      },
      structure: { applications: [], packages: [], services: [] },
      runtime: {
        frameworks: [],
        workspace: 'invalid', // should be object
        buildSystem: { tool: 'turbo', version: '1.0', config: 'turbo.json' },
      },
      blocks: { documented: [], implemented: [], rendered: [], verified: [], discrepancies: [] },
      composer: { services: [], apis: [], schemas: [], ui: [] },
      dependencies: { nodes: [], edges: [] },
      tests: { unit: [], integration: [], e2e: [] },
      evidence: [],
      findings: [],
      canonicalHash: 'hash',
    } as unknown as RepositorySnapshot;

    const result = await validateSchema(snapshot);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

### Verify
```bash
pnpm --filter @quiz/project-llm-discovery type-check
pnpm --filter @quiz/project-llm-discovery test
grep -c 'z\.any()' packages/project-llm-discovery/src/validation/v1-schema-validator.ts
```
Expected: Type check passes, tests pass, grep returns 1 (only findings array) or 0.

---

## P0-1: D3 VERIFIED Semantics (CRITICAL)

### Files
- `packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts`
- `packages/project-llm-discovery/__tests__/unit/d3-blocks-scanner.test.ts`
- `packages/project-llm-discovery/__tests__/integration/test-d3-d6.ts`
- `packages/project-llm-discovery/src/contracts/snapshot.ts` (optional: add registered field)

### Changes

**1. Update crossReferenceBlocks signature (line 256)**

Change from:
```typescript
function crossReferenceBlocks(
  implemented: BlockImplementation[],
  rendered: BlockRenderer[]
): BlockVerification[]
```

To:
```typescript
function crossReferenceBlocks(
  implemented: BlockImplementation[],
  rendered: BlockRenderer[],
  documented: BlockFamilyDoc[]
): BlockVerification[]
```

**2. Update crossReferenceBlocks call (line 131)**

Change from:
```typescript
const verifiedBlocks = crossReferenceBlocks(implemented, rendered);
```

To:
```typescript
const verifiedBlocks = crossReferenceBlocks(implemented, rendered, documented);
```

**3. Build documented versions map (after line 268)**

Add:
```typescript
// Build set of documented versions for cross-reference
const documentedVersions = new Set<string>();
for (const doc of documented) {
  for (const version of doc.versions) {
    documentedVersions.add(version);
  }
}
```

**4. Update VERIFIED criteria comment (lines 273-277)**

Change from:
```
VERIFIED = type definition + renderer exists + UBRC compliant
```

To:
```
VERIFIED = documented + type definition + renderer + registered in TutorialBlockRenderer + UBRC compliant + test coverage

Current implementation checks: documented (in registry) + type (implemented) + renderer (component exists).
Future work: REGISTERED (check TutorialBlockRenderer registry), UBRC (data-block-version attribute), TESTED (test coverage).
```

**5. Update verification logic (lines 278-294)**

Replace:
```typescript
for (const impl of implemented) {
  // Skip incomplete blocks
  if (impl.version !== undefined && incompleteBlocks.has(impl.version)) {
    continue;
  }

  // Check if renderer exists for this block type
  const hasRenderer = rendered.some(r => r.blockType === impl.type);

  const isVerified = hasRenderer;

  // Only add to verified list if criteria met
  if (isVerified && impl.version !== undefined) {
    verified.push({
      blockType: impl.type,
      version: impl.version,
      documented: true, // Assume documented if implemented
      implemented: true,
      rendered: hasRenderer,
      tested: false,
    });
  }
}
```

With:
```typescript
for (const impl of implemented) {
  // Check if renderer exists for this block type
  const hasRenderer = rendered.some(r => r.blockType === impl.type);
  
  // Check if documented in registry
  const isDocumented = impl.version !== undefined && documentedVersions.has(impl.version);
  
  // VERIFIED requires both documented AND rendered
  // Future: add REGISTERED, UBRC, TESTED checks
  const isVerified = isDocumented && hasRenderer;

  // Only add to verified list if criteria met
  if (isVerified && impl.version !== undefined) {
    verified.push({
      blockType: impl.type,
      version: impl.version,
      documented: isDocumented,
      implemented: true,
      rendered: hasRenderer,
      tested: false,
    });
  }
}
```

**6. Update JSDoc comment (lines 16-22)**

Change:
```
VERIFIED: Cross-referenced complete implementations (type + renderer + UBRC compliant)
```

To:
```
VERIFIED: Cross-referenced complete implementations (documented + type + renderer).
Future: add REGISTERED (in TutorialBlockRenderer registry), UBRC (data-block-version attribute), TESTED (test coverage) checks.
```

**7. Update d3-blocks-scanner.test.ts**

Add test case:
```typescript
it('should mark block as verified only when documented AND rendered', async () => {
  const mockAdapter: RepositoryAdapter = {
    readFile: vi.fn().mockImplementation(async (path: string) => {
      if (path.includes('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md')) {
        return `
| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | IntroductionBlock | I | 6 | I1-I6 | VERIFIED (I1) | I1 implemented |
        `;
      }
      if (path.includes('content-blocks.ts')) {
        return `
export interface IntroductionI1Block extends BaseBlock {}
export interface ObjectiveO1Block extends BaseBlock {}
        `;
      }
      return '';
    }),
    fileExists: vi.fn().mockResolvedValue(true),
    listFiles: vi.fn().mockImplementation(async (path: string) => {
      if (path.includes('tutorial/blocks')) {
        return [
          'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
          'packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx',
        ];
      }
      return [];
    }),
    getFileHash: vi.fn().mockResolvedValue('mockhash'),
    getGitCommit: vi.fn().mockResolvedValue('abc123'),
    getGitRoot: vi.fn().mockResolvedValue('/repo'),
  };

  const result = await scanBlocks(mockAdapter);

  // I1 is documented AND rendered → verified
  const i1Verified = result.data.verified.find(v => v.version === 'I1');
  expect(i1Verified).toBeDefined();
  expect(i1Verified?.documented).toBe(true);
  expect(i1Verified?.rendered).toBe(true);

  // O1 is NOT documented (not in registry) → not verified even though rendered
  const o1Verified = result.data.verified.find(v => v.version === 'O1');
  expect(o1Verified).toBeUndefined();
});
```

**8. Update test-d3-d6.ts (optional)**

If verified block count changes based on actual documented state, update expected count on line 104-107.

### Verify
```bash
pnpm --filter @quiz/project-llm-discovery type-check
pnpm --filter @quiz/project-llm-discovery test
node packages/project-llm-discovery/__tests__/integration/test-d3-d6.ts
```
Expected: Type check passes, unit tests pass including new documented field test, integration test passes (may need count adjustment).

---

## Integration Verification

After all four P0 fixes:

```bash
# Type check entire package
pnpm --filter @quiz/project-llm-discovery type-check

# Run all unit tests
pnpm --filter @quiz/project-llm-discovery test

# Run integration tests
node packages/project-llm-discovery/__tests__/integration/test-d3-d6.ts
node packages/project-llm-discovery/__tests__/integration/test-full-m1-pipeline.test.ts

# Verify no z.any() violations (should return 0 or 1)
grep -c 'z\.any()' packages/project-llm-discovery/src/validation/v1-schema-validator.ts
```

All commands should succeed before marking PR #23 ready for re-review.
