/**
 * Discovery Adapter Integration Test
 *
 * Phase 7: Validates that the transformSnapshotToIntelligence function
 * correctly transforms a live RepositorySnapshot into the intelligence
 * format consumed by Project LLM UI pages.
 */

import { describe, it, expect } from 'vitest';
import { transformSnapshotToIntelligence } from '../../../src/lib/project-llm/discoveryAdapter';

const MOCK_SNAPSHOT = {
  schemaVersion: '1.1.0',
  repository: {
    owner: 'onlinewebsites',
    name: 'quiz-platform',
    commitSha: 'abc123def456',
    scanTimestamp: '2026-10-24T03:52:42.605Z',
  },
  structure: {
    applications: [],
    packages: [],
    services: [],
  },
  blocks: {
    verified: [
      {
        blockType: 'introduction',
        version: 'I1',
        documented: true,
        implemented: true,
        rendered: true,
        registered: true,
        tested: false,
        verificationLevel: 'REGISTERED',
        ubrcStatus: 'UBRC_VERSION_MISMATCH',
      },
      {
        blockType: 'code',
        version: 'C1',
        documented: true,
        implemented: true,
        rendered: true,
        registered: true,
        tested: false,
        verificationLevel: 'REGISTERED',
        ubrcStatus: 'UBRC_VALID',
      },
      {
        blockType: 'definition',
        version: 'D1',
        documented: true,
        implemented: true,
        rendered: true,
        registered: true,
        tested: false,
        verificationLevel: 'REGISTERED',
        ubrcStatus: 'UBRC_VERSION_MISMATCH',
      },
      {
        blockType: 'summary',
        version: 'S1',
        documented: true,
        implemented: true,
        rendered: true,
        registered: true,
        tested: false,
        verificationLevel: 'REGISTERED',
        ubrcStatus: 'UBRC_VALID',
      },
      {
        blockType: 'heading',
        documented: false,
        implemented: true,
        rendered: true,
        registered: true,
        tested: false,
        verificationLevel: 'REGISTERED',
        ubrcStatus: 'UBRC_VALID',
      },
      {
        blockType: 'paragraph',
        documented: false,
        implemented: true,
        rendered: true,
        registered: true,
        tested: false,
        verificationLevel: 'REGISTERED',
        ubrcStatus: 'UBRC_VALID',
      },
    ],
    rendered: [],
  },
  canonicalHash: '2a49ce986149f55643c65abf752735061b1920d2f182c47f06239606e84ec221',
};

describe('transformSnapshotToIntelligence', () => {
  it('should correctly identify verified versioned blocks', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    expect(result.runtime.verifiedImplementations).toHaveLength(4); // I1, C1, D1, S1
    expect(result.runtime.status.verifiedImplementations).toBe(4);
  });

  it('should correctly identify structural primitives', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    expect(result.primitives.count).toBe(2); // heading, paragraph
    expect(result.primitives.list.map((p: any) => p.name)).toEqual(
      expect.arrayContaining(['heading', 'paragraph'])
    );
  });

  it('should map UBRC_VALID to FULL compliance', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    const codeBlock = result.runtime.verifiedImplementations.find(
      (v: any) => v.versionId === 'C1'
    );
    expect(codeBlock?.ubrcCompliance).toBe('FULL');
  });

  it('should map UBRC_VERSION_MISMATCH to PARTIAL compliance', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    const introBlock = result.runtime.verifiedImplementations.find(
      (v: any) => v.versionId === 'I1'
    );
    expect(introBlock?.ubrcCompliance).toBe('PARTIAL');
  });

  it('should set lifecycle status to RUNTIME_INTEGRATED for REGISTERED blocks', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    result.runtime.verifiedImplementations.forEach((impl: any) => {
      expect(impl.lifecycleStatus).toBe('RUNTIME_INTEGRATED');
    });
  });

  it('should include source documents with commit SHA and scan timestamp', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    expect(result.sourceDocuments).toEqual(
      expect.arrayContaining([
        expect.stringContaining('abc123def456'),
        expect.stringContaining('2026-10-24'),
        expect.stringContaining('1.1.0'),
      ])
    );
  });

  it('should calculate planned families correctly', () => {
    const result = transformSnapshotToIntelligence(MOCK_SNAPSHOT as any);

    // I, C, D, S are discovered; the rest should be planned
    expect(result.runtime.plannedFamilyIds.length).toBeGreaterThan(0);
    expect(result.runtime.plannedFamilyIds).not.toContain('I');
    expect(result.runtime.plannedFamilyIds).not.toContain('C');
    expect(result.runtime.plannedFamilyIds).not.toContain('D');
    expect(result.runtime.plannedFamilyIds).not.toContain('S');
    expect(result.runtime.plannedFamilyIds).toContain('O');
    expect(result.runtime.plannedFamilyIds).toContain('V');
  });

  it('should handle empty blocks gracefully', () => {
    const emptySnapshot = {
      ...MOCK_SNAPSHOT,
      blocks: { verified: [], rendered: [] },
    };

    const result = transformSnapshotToIntelligence(emptySnapshot as any);

    expect(result.runtime.verifiedImplementations).toHaveLength(0);
    expect(result.runtime.incompleteImplementations).toHaveLength(0);
    expect(result.primitives.count).toBe(0);
  });
});
