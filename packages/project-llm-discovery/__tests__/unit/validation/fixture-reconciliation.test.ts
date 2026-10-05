import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reconcileWithLegacyFixture } from '../../../src/validation/fixture-reconciliation.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';
import type { RepositoryAdapter } from '../../../src/contracts/repository-adapter.js';

describe('Fixture Reconciliation', () => {
  let mockAdapter: RepositoryAdapter;

  beforeEach(() => {
    mockAdapter = {
      readFile: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
      getFileHash: vi.fn(),
      getGitCommit: vi.fn(),
      getGitRoot: vi.fn(),
    };
  });

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

  const mockLegacyFixture = `
const VERIFIED_IMPLEMENTATIONS = [
  { versionId: 'I1', familyId: 'I', lifecycleStatus: 'RUNTIME_INTEGRATED' },
  { versionId: 'C1', familyId: 'C', lifecycleStatus: 'RUNTIME_INTEGRATED' },
  { versionId: 'D1', familyId: 'D', lifecycleStatus: 'RUNTIME_INTEGRATED' },
];

const INCOMPLETE_IMPLEMENTATIONS = [
  { versionId: 'S1', familyId: 'S', lifecycleStatus: 'IMPLEMENTED' },
];

const PLANNED_FAMILY_IDS = ['O', 'V', 'CP', 'E', 'M', 'MT', 'BP', 'Q', 'EX', 'T', 'INT', 'QZ', 'IV', 'P'];
`;

  it('should match when verified implementations align with snapshot', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.verified = [
      { blockType: 'I1', documented: true, implemented: true, rendered: true, tested: true },
      { blockType: 'C1', documented: true, implemented: true, rendered: true, tested: true },
      { blockType: 'D1', documented: true, implemented: true, rendered: true, tested: true },
    ];

    vi.mocked(mockAdapter.readFile).mockResolvedValue(mockLegacyFixture);

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    const i1Result = results.find((r) => r.claim.includes('I1'));
    expect(i1Result?.status).toBe('MATCH');

    const c1Result = results.find((r) => r.claim.includes('C1'));
    expect(c1Result?.status).toBe('MATCH');

    const d1Result = results.find((r) => r.claim.includes('D1'));
    expect(d1Result?.status).toBe('MATCH');
  });

  it('should detect discrepancy when verified implementation missing in snapshot', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.verified = [
      { blockType: 'I1', documented: true, implemented: true, rendered: true, tested: true },
      // C1 and D1 missing
    ];

    vi.mocked(mockAdapter.readFile).mockResolvedValue(mockLegacyFixture);

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    const c1Result = results.find((r) => r.claim.includes('C1'));
    expect(c1Result?.status).toBe('DISCREPANCY');

    const d1Result = results.find((r) => r.claim.includes('D1'));
    expect(d1Result?.status).toBe('DISCREPANCY');
  });

  it('should match when incomplete implementation is still incomplete', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [
      { type: 'S1', path: 'test/S1.tsx', exported: true },
    ];
    snapshot.blocks.verified = []; // S1 not verified

    vi.mocked(mockAdapter.readFile).mockResolvedValue(mockLegacyFixture);

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    const s1Result = results.find((r) => r.claim.includes('S1'));
    expect(s1Result?.status).toBe('MATCH');
    expect(s1Result?.notes).toContain('implemented but not verified');
  });

  it('should detect discrepancy when incomplete is now verified', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.verified = [
      { blockType: 'S1', documented: true, implemented: true, rendered: true, tested: true },
    ];

    vi.mocked(mockAdapter.readFile).mockResolvedValue(mockLegacyFixture);

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    const s1Result = results.find((r) => r.claim.includes('S1'));
    expect(s1Result?.status).toBe('DISCREPANCY');
    expect(s1Result?.notes).toContain('incomplete in legacy but is now verified');
  });

  it('should match planned families that remain unimplemented', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.documented = [
      { family: 'O', versions: ['O1'], documentationPath: 'docs/O.md' },
      { family: 'V', versions: ['V1'], documentationPath: 'docs/V.md' },
    ];
    snapshot.blocks.implemented = []; // Not implemented

    vi.mocked(mockAdapter.readFile).mockResolvedValue(mockLegacyFixture);

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    const oResult = results.find((r) => r.claim.includes('Planned family: O'));
    expect(oResult?.status).toBe('MATCH');

    const vResult = results.find((r) => r.claim.includes('Planned family: V'));
    expect(vResult?.status).toBe('MATCH');
  });

  it('should handle missing fixture file gracefully', async () => {
    const snapshot = createBaseSnapshot();

    vi.mocked(mockAdapter.readFile).mockResolvedValue('');

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.status).toBe('UNKNOWN');
    expect(results[0]?.notes).toContain('Could not read');
  });

  it('should include reconciliation summary', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.verified = [
      { blockType: 'I1', documented: true, implemented: true, rendered: true, tested: true },
      { blockType: 'C1', documented: true, implemented: true, rendered: true, tested: true },
      { blockType: 'D1', documented: true, implemented: true, rendered: true, tested: true },
    ];

    vi.mocked(mockAdapter.readFile).mockResolvedValue(mockLegacyFixture);

    const results = await reconcileWithLegacyFixture(snapshot, mockAdapter);

    const summary = results.find((r) => r.claim === 'Reconciliation summary');
    expect(summary).toBeDefined();
    expect(summary?.notes).toContain('New snapshot is source of truth');
  });
});
