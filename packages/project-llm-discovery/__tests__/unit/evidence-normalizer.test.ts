import { describe, it, expect } from 'vitest';
import { normalizeEvidence } from '../../src/evidence/normalizer.js';
import type { Evidence } from '../../src/contracts/evidence.js';

describe('normalizeEvidence', () => {
  it('should sort evidence by evidenceId', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'id-c',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/c/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/c/file.ts',
        contentHash: 'hash1',
      },
      {
        evidenceId: 'id-a',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash2',
      },
      {
        evidenceId: 'id-b',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/b/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/b/file.ts',
        contentHash: 'hash3',
      },
    ];

    const result = normalizeEvidence(evidence);

    expect(result).toHaveLength(3);
    expect(result[0]?.evidenceId).toBe('id-a');
    expect(result[1]?.evidenceId).toBe('id-b');
    expect(result[2]?.evidenceId).toBe('id-c');
  });

  it('should sort by evidenceId deterministically (not timestamp-dependent)', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'id-3',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:02.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
      {
        evidenceId: 'id-1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash2',
      },
      {
        evidenceId: 'id-2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:01.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash3',
      },
    ];

    const result = normalizeEvidence(evidence);

    expect(result).toHaveLength(3);
    // Sorted by evidenceId, not timestamp
    expect(result[0]?.evidenceId).toBe('id-1');
    expect(result[1]?.evidenceId).toBe('id-2');
    expect(result[2]?.evidenceId).toBe('id-3');
  });

  it('should throw error on duplicate evidenceId', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'duplicate-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim 1',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
      {
        evidenceId: 'unique-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:01.000Z',
        path: 'packages/b/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim 2',
        locator: 'file:packages/b/file.ts',
        contentHash: 'hash2',
      },
      {
        evidenceId: 'duplicate-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:02.000Z',
        path: 'packages/c/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim 3',
        locator: 'file:packages/c/file.ts',
        contentHash: 'hash3',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('Duplicate evidenceId detected: duplicate-id');
  });

  it('should validate required field: evidenceId', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: '',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('Evidence missing required field: evidenceId');
  });

  it('should validate required field: path', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'test-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('missing required field: path');
  });

  it('should validate required field: kind', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'test-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: '' as 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('missing required field: kind');
  });

  it('should validate required field: claim', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'test-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: '',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('missing required field: claim');
  });

  it('should validate required field: lifecycle', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'test-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: '' as 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('missing required field: lifecycle');
  });

  it('should handle empty array', () => {
    const result = normalizeEvidence([]);
    expect(result).toEqual([]);
  });

  it('should not mutate original array', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'id-2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/b/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/b/file.ts',
        contentHash: 'hash2',
      },
      {
        evidenceId: 'id-1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        lifecycle: 'current',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    const original = [...evidence];
    normalizeEvidence(evidence);

    expect(evidence).toEqual(original); // Original unchanged
  });
});
