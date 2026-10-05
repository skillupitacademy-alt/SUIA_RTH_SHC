import { describe, it, expect } from 'vitest';
import { normalizeEvidence } from '../../src/evidence/normalizer.js';
import type { Evidence } from '../../src/contracts/evidence.js';

describe('normalizeEvidence', () => {
  it('should sort evidence by path', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'id-1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/c/file.ts',
        kind: 'file',
        claim: 'Test claim',
        locator: 'file:packages/c/file.ts',
        contentHash: 'hash1',
      },
      {
        evidenceId: 'id-2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash2',
      },
      {
        evidenceId: 'id-3',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/b/file.ts',
        kind: 'file',
        claim: 'Test claim',
        locator: 'file:packages/b/file.ts',
        contentHash: 'hash3',
      },
    ];

    const result = normalizeEvidence(evidence);

    expect(result).toHaveLength(3);
    expect(result[0]?.path).toBe('packages/a/file.ts');
    expect(result[1]?.path).toBe('packages/b/file.ts');
    expect(result[2]?.path).toBe('packages/c/file.ts');
  });

  it('should sort by timestamp when paths are the same', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'id-1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:02.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
      {
        evidenceId: 'id-2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash2',
      },
      {
        evidenceId: 'id-3',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:01.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
        claim: 'Test claim',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash3',
      },
    ];

    const result = normalizeEvidence(evidence);

    expect(result).toHaveLength(3);
    expect(result[0]?.timestamp).toBe('2024-01-01T00:00:00.000Z');
    expect(result[1]?.timestamp).toBe('2024-01-01T00:00:01.000Z');
    expect(result[2]?.timestamp).toBe('2024-01-01T00:00:02.000Z');
  });

  it('should deduplicate by evidenceId', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'duplicate-id',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
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
        claim: 'Test claim 3',
        locator: 'file:packages/c/file.ts',
        contentHash: 'hash3',
      },
    ];

    const result = normalizeEvidence(evidence);

    expect(result).toHaveLength(2);
    expect(result[0]?.evidenceId).toBe('duplicate-id');
    expect(result[0]?.claim).toBe('Test claim 1'); // First occurrence kept
    expect(result[1]?.evidenceId).toBe('unique-id');
  });

  it('should validate required field: evidenceId', () => {
    const evidence: Evidence[] = [
      {
        evidenceId: '',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/a/file.ts',
        kind: 'file',
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
        claim: '',
        locator: 'file:packages/a/file.ts',
        contentHash: 'hash1',
      },
    ];

    expect(() => normalizeEvidence(evidence)).toThrow('missing required field: claim');
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
