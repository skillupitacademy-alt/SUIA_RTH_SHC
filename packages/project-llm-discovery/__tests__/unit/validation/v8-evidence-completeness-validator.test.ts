import { describe, it, expect } from 'vitest';
import { validateEvidenceCompleteness } from '../../../src/validation/v8-evidence-completeness-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V8 Evidence Completeness Validator', () => {
  const createBaseSnapshot = (): RepositorySnapshot => ({
    schemaVersion: '1.0.0',
    repository: {
      owner: 'test-owner',
      name: 'test-repo',
      commitSha: 'abc123',
      scanTimestamp: '2024-01-01T00:00:00Z',
    },
    structure: { applications: [], packages: [], services: [] },
    runtime: {
      frameworks: [],
      workspace: { manager: 'pnpm', version: '9.0.0', packages: [] },
      buildSystem: { tool: 'turbo', version: '2.0.0', config: 'turbo.json' },
    },
    blocks: {
      documented: [],
      implemented: [],
      rendered: [],
      verified: [],
      discrepancies: [],
    },
    composer: { services: [], apis: [], schemas: [], ui: [] },
    dependencies: { nodes: [], edges: [] },
    tests: { unit: [], integration: [], e2e: [] },
    evidence: [],
    findings: [],
    canonicalHash: 'hash123',
  });

  it('should pass when all applications have evidence', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.structure.applications = [
      { name: '@quiz/app1', path: 'apps/app1', type: 'app', framework: 'next', entrypoint: 'src/index.ts' },
    ];
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'apps/app1',
        kind: 'directory',
        claim: 'Application discovered: @quiz/app1',
        locator: 'apps/app1',
        contentHash: 'hash123',
      },
    ];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when application has no evidence', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.structure.applications = [
      { name: '@quiz/app1', path: 'apps/app1', type: 'app', framework: 'next', entrypoint: 'src/index.ts' },
    ];
    snapshot.evidence = [];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings.length).toBeGreaterThan(0);
    const warning = result.warnings.find((w) => w.code === 'MISSING_APPLICATION_EVIDENCE');
    expect(warning).toBeDefined();
    expect(warning?.message).toContain('@quiz/app1');
  });

  it('should warn when package has no evidence', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.structure.packages = [
      { name: '@quiz/pkg1', path: 'packages/pkg1', version: '1.0.0', dependencies: [], exports: [] },
    ];
    snapshot.evidence = [];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings.length).toBeGreaterThan(0);
    const warning = result.warnings.find((w) => w.code === 'MISSING_PACKAGE_EVIDENCE');
    expect(warning).toBeDefined();
  });

  it('should warn when service has no evidence', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.structure.services = [
      { name: '@quiz/service1', path: 'services/service1', type: 'service', entrypoint: 'src/index.ts' },
    ];
    snapshot.evidence = [];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings.length).toBeGreaterThan(0);
    const warning = result.warnings.find((w) => w.code === 'MISSING_SERVICE_EVIDENCE');
    expect(warning).toBeDefined();
  });

  it('should warn when block implementation has no evidence', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [
      { type: 'introduction', path: 'packages/ui/blocks/IntroBlock.tsx', exported: true },
    ];
    snapshot.evidence = [];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings.length).toBeGreaterThan(0);
    const warning = result.warnings.find((w) => w.code === 'MISSING_BLOCK_IMPLEMENTATION_EVIDENCE');
    expect(warning).toBeDefined();
  });

  it('should warn when composer service has no evidence', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.composer.services = [
      { name: 'TutorialComposerService', path: 'services/composer.ts', methods: [] },
    ];
    snapshot.evidence = [];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings.length).toBeGreaterThan(0);
    const warning = result.warnings.find((w) => w.code === 'MISSING_COMPOSER_EVIDENCE');
    expect(warning).toBeDefined();
  });

  it('should match evidence by claim keywords', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.structure.applications = [
      { name: '@quiz/app1', path: 'apps/app1', type: 'app', framework: 'next', entrypoint: 'src/index.ts' },
    ];
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'apps/app1/package.json',
        kind: 'package',
        claim: 'Found application app1 with next framework',
        locator: 'apps/app1',
        contentHash: 'hash123',
      },
    ];

    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.warnings).toHaveLength(0);
  });
});
