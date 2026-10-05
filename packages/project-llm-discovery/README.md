# @quiz/project-llm-discovery

Automated, deterministic repository discovery system for the Quiz Platform monorepo. Generates evidence-based snapshots of repository structure, runtime configuration, Educational Block Families, Tutorial Composer, dependencies, and test infrastructure with SHA-256 determinism guarantees.

## Purpose

This package provides automated discovery and validation of the Quiz Platform repository architecture. It eliminates manual inventory maintenance by scanning the repository to discover:

- **Structure**: Applications, packages, and services
- **Runtime**: Frameworks, workspace configuration, and build systems
- **Educational Blocks**: 18 documented families, implementation and verification status
- **Tutorial Composer**: Service, APIs, schemas, and UI components
- **Dependencies**: Workspace dependency graph
- **Tests**: Unit, integration, and E2E test infrastructure

Every discovery claim is backed by cryptographic evidence (file path + SHA-256 content hash), making snapshots auditable and enabling differential analysis.

## Features

- **Deterministic Snapshots**: Same repository commit → same `canonicalHash` (SHA-256)
- **Evidence Traceability**: Every claim backed by file path + content hash
- **5-State Block Model**: Tracks DOCUMENTED, IMPLEMENTED, RENDERED, VERIFIED, DISCREPANCIES separately
- **Repository Adapter Abstraction**: Extensible to remote repositories (GitHub, GitLab, etc.)
- **9 Validation Checks**: Schema, reference integrity, evidence paths, block consistency, single Composer, acyclic dependencies, test references, evidence completeness, determinism
- **Fixture Reconciliation**: Compares against legacy `projectLlmRepositoryIntelligence.ts` for migration verification

## Installation

```bash
pnpm add @quiz/project-llm-discovery
```

## Usage

### Basic Snapshot Generation

```typescript
import { FilesystemRepositoryAdapter, buildSnapshot, validateSnapshot } from '@quiz/project-llm-discovery';

const adapter = new FilesystemRepositoryAdapter('e:\\onlinewebsites\\quiz-platform');
const snapshot = await buildSnapshot('e:\\onlinewebsites\\quiz-platform', adapter);
const validation = await validateSnapshot(snapshot, adapter);

console.log(`Apps: ${snapshot.structure.applications.length}`);
console.log(`Packages: ${snapshot.structure.packages.length}`);
console.log(`Services: ${snapshot.structure.services.length}`);
console.log(`Valid: ${validation.valid}`);
```

### Accessing Discovery Data

```typescript
// Structure
console.log('Applications:', snapshot.structure.applications.map(a => a.name));
console.log('Packages:', snapshot.structure.packages.map(p => p.name));
console.log('Services:', snapshot.structure.services.map(s => s.name));

// Blocks
console.log('Block families documented:', snapshot.blocks.documented.length);
console.log('Block types implemented:', snapshot.blocks.implemented.length);
console.log('Block renderers:', snapshot.blocks.rendered.length);
console.log('Blocks verified:', snapshot.blocks.verified.length);

// Composer
console.log('Composer service:', snapshot.composer.services[0]?.name);
console.log('Composer APIs:', snapshot.composer.apis.length);

// Dependencies
console.log('Dependency nodes:', snapshot.dependencies.nodes.length);
console.log('Dependency edges:', snapshot.dependencies.edges.length);

// Tests
console.log('Unit test suites:', snapshot.tests.unit.length);
console.log('Integration test suites:', snapshot.tests.integration.length);
console.log('E2E test suites:', snapshot.tests.e2e.length);
```

### Validation

```typescript
import { validateSnapshot } from '@quiz/project-llm-discovery';

const validation = await validateSnapshot(snapshot, adapter);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}

// Validation runs 9 checks (V1-V9):
// V1: Schema validation
// V2: Reference integrity
// V3: Evidence paths exist
// V4: Block consistency (4 states present)
// V5: Single Composer
// V6: Dependency graph is acyclic
// V7: Test references valid
// V8: Evidence completeness
// V9: Determinism (can be skipped for performance)
```

### Fixture Reconciliation

```typescript
import { reconcileWithLegacyFixture } from '@quiz/project-llm-discovery';

const reconciliation = await reconcileWithLegacyFixture(snapshot, adapter);

for (const result of reconciliation) {
  console.log(`${result.claim}: ${result.status}`);
  if (result.status === 'DISCREPANCY') {
    console.log(`  Legacy: ${result.legacyValue}`);
    console.log(`  Snapshot: ${result.snapshotValue}`);
  }
}
```

### Determinism Verification

```typescript
// Run snapshot twice
const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
const snapshot2 = await buildSnapshot(repositoryRoot, adapter);

// Assert same hash
console.assert(snapshot1.canonicalHash === snapshot2.canonicalHash);
console.log('DETERMINISM PROVEN: Same repository state → same canonicalHash');
```

## Architecture

### Scanner Pipeline (D1-D6)

The discovery system runs six scanners in sequence:

1. **D1 (Structure)**: Discovers applications, packages, and services from `package.json` files
2. **D2 (Runtime)**: Extracts workspace config, build system, and framework versions
3. **D3 (Blocks)**: Discovers Educational Block Families from documentation, types, and renderers
4. **D4 (Composer)**: Locates Tutorial Composer service, APIs, schemas, and UI
5. **D5 (Dependencies)**: Builds workspace dependency graph
6. **D6 (Tests)**: Discovers unit, integration, and E2E test infrastructure

Each scanner returns:
- **Data**: Structured discovery results
- **Evidence**: File paths + content hashes backing each claim
- **Findings**: Warnings or errors encountered during scanning

### Snapshot Builder (D7)

Aggregates scanner results into a deterministic `RepositorySnapshot`:

```typescript
{
  schemaVersion: '1.0.0',
  repository: { owner, name, commitSha, scanTimestamp },
  structure: { applications, packages, services },
  runtime: { frameworks, workspace, buildSystem },
  blocks: { documented, implemented, rendered, verified, discrepancies },
  composer: { services, apis, schemas, ui },
  dependencies: { nodes, edges },
  tests: { unit, integration, e2e },
  evidence: Evidence[],
  findings: Finding[],
  canonicalHash: string // SHA-256 of snapshot (excluding scanTimestamp)
}
```

### Validator (D8)

Runs 9 validation checks (V1-V9) against the snapshot. Returns `ValidationResult` with errors and warnings.

### Repository Adapter

All file access goes through the `RepositoryAdapter` interface:

```typescript
interface RepositoryAdapter {
  readFile(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  listFiles(directory: string, pattern: string): Promise<string[]>;
  getFileHash(path: string): Promise<string>;
  getGitCommit(): Promise<string>;
}
```

Current implementation: `FilesystemRepositoryAdapter` for local repositories.

Future extensions: `GitRepositoryAdapter`, `GitHubAPIAdapter`, etc.

## Scanner Overview (D1-D8)

| Scanner | Purpose | Key Outputs |
|---------|---------|-------------|
| **D1: Structure** | Discover apps/packages/services | `ApplicationInfo[]`, `PackageInfo[]`, `ServiceInfo[]` |
| **D2: Runtime** | Extract workspace/build config | `FrameworkInfo[]`, `WorkspaceInfo`, `BuildSystemInfo` |
| **D3: Blocks** | Discover Educational Blocks | `BlockFamilyDoc[]`, `BlockImplementation[]`, `BlockRenderer[]`, `BlockVerification[]` |
| **D4: Composer** | Locate Tutorial Composer | `ComposerService[]`, `ComposerAPI[]`, `ComposerSchema[]`, `ComposerUI[]` |
| **D5: Dependencies** | Build dependency graph | `DependencyNode[]`, `DependencyEdge[]` |
| **D6: Tests** | Discover test infrastructure | `TestSuite[]` (unit, integration, e2e) |
| **D7: Snapshot** | Aggregate + hash | `RepositorySnapshot` with `canonicalHash` |
| **D8: Validation** | Run V1-V9 checks | `ValidationResult` (errors, warnings) |

## Testing

```bash
# Run all tests
pnpm --filter @quiz/project-llm-discovery test

# Run with coverage
pnpm --filter @quiz/project-llm-discovery test:coverage

# Run in watch mode
pnpm --filter @quiz/project-llm-discovery test:watch

# Type check
pnpm --filter @quiz/project-llm-discovery type-check
```

### Test Structure

- **Unit tests** (`__tests__/unit/`): Test individual scanners, validators, and utilities
- **Integration tests** (`__tests__/integration/`): Test full pipeline (build → validate → reconcile)
- **Determinism tests** (`__tests__/determinism/`): Prove snapshot hash stability

## Snapshot Schema

The snapshot follows a versioned schema (currently `1.0.0`). Key fields:

### Repository Metadata
- `owner`, `name`: Repository identification
- `commitSha`: Git commit at scan time (for determinism tracking)
- `scanTimestamp`: ISO timestamp (excluded from hash calculation)

### Structure Data
- `applications`: Apps in `apps/` directory
- `packages`: Packages in `packages/` directory
- `services`: Services in `services/` directory

### Runtime Data
- `frameworks`: Detected frameworks (Next.js, Node.js, etc.)
- `workspace`: pnpm workspace configuration
- `buildSystem`: Turbo configuration

### Blocks Data (5-State Model)
- `documented`: Block families in `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md`
- `implemented`: Block type interfaces in `packages/types/src/tutorial-rich-document/blocks/`
- `rendered`: Block renderers in `packages/ui/src/tutorial/blocks/`
- `verified`: Blocks with complete implementation + rendering + UBRC versioning
- `discrepancies`: Documented blocks not yet implemented (tracked as warnings for migration planning)

### Composer Data
- `services`: Tutorial Composer service class (should be exactly 1)
- `apis`: Composer API routes
- `schemas`: Tutorial document schemas
- `ui`: UI components using Composer

### Dependencies Data
- `nodes`: All workspace packages (apps, packages, services)
- `edges`: Dependency relationships between packages

### Tests Data
- `unit`: Unit test suites (vitest)
- `integration`: Integration test suites (vitest)
- `e2e`: End-to-end test suites (Playwright)

### Evidence
Array of `Evidence` records backing each claim:
```typescript
{
  evidenceId: string;      // Unique identifier
  scannerName: string;     // Which scanner generated this
  kind: 'package' | 'config' | 'block' | 'composer' | 'test';
  claim: string;           // Human-readable claim
  path: string;            // File path relative to repository root
  contentHash: string;     // SHA-256 of file content
  timestamp: string;       // When evidence was collected
}
```

### Findings
Array of warnings/errors encountered during scanning:
```typescript
{
  severity: 'info' | 'warning' | 'error';
  code: string;            // Machine-readable code
  message: string;         // Human-readable message
  path?: string;           // File path if applicable
  recommendation?: string; // Suggested fix
}
```

### Canonical Hash
SHA-256 hash of the entire snapshot (excluding `scanTimestamp`). Used for determinism verification and differential analysis.

## Determinism Guarantee

**Property**: For any given repository commit, `buildSnapshot()` produces the same `canonicalHash`.

**Mechanism**:
1. Exclude `scanTimestamp` from hash calculation (timestamps vary)
2. Include `commitSha` in hash calculation (tracks repository state)
3. Sort all object keys before JSON serialization (stable order)
4. Use SHA-256 for cryptographic integrity

**Verification**: Run `buildSnapshot()` twice on the same repository commit. Assert `hash1 === hash2`.

**Use Cases**:
- Detect repository changes: different `commitSha` → different `canonicalHash`
- Enable caching: same `commitSha` → reuse cached snapshot
- Support differential analysis: compare `snapshot1` vs `snapshot2` by hash first

## Extension Points

### Custom Adapters
Implement `RepositoryAdapter` for non-filesystem sources:
```typescript
class GitHubAPIAdapter implements RepositoryAdapter {
  async readFile(path: string): Promise<string> { /* ... */ }
  async fileExists(path: string): Promise<boolean> { /* ... */ }
  // ... implement remaining methods
}
```

### Custom Scanners
Add new scanners for additional discovery dimensions:
```typescript
export async function scanArchitecture(
  adapter: RepositoryAdapter
): Promise<ScannerResult<ArchitectureData>> {
  // Implement scanner logic
  return { data, evidence, findings };
}
```

### Custom Validators
Add new validation checks beyond V1-V9:
```typescript
export async function validateSecurity(
  snapshot: RepositorySnapshot,
  adapter: RepositoryAdapter
): Promise<ValidationError[]> {
  // Implement validation logic
}
```

## License

MIT

## Contributing

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for coding standards and development workflow.

## Related Documentation

- [M1 Plan](./.agents/tasks/m1-plan.md): Full M1 milestone specification
- [M1 Completion Report](./.agents/tasks/m1-completion-report.md): Verification results
- [Block Corpus Registry](../../ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md): Educational Block documentation
- [Legacy Fixture](../../apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts): Original manual inventory
