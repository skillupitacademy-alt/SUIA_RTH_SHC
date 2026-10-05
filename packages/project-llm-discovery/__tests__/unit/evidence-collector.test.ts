import { describe, it, expect } from 'vitest';
import { EvidenceCollector } from '../../src/evidence/collector.js';
import type { Evidence } from '../../src/contracts/evidence.js';

describe('EvidenceCollector', () => {
  it('should add a single evidence record', () => {
    const collector = new EvidenceCollector();
    const evidence: Evidence = {
      evidenceId: 'test-id',
      scannerName: 'test-scanner',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: 'test/path',
      kind: 'file',
      claim: 'Test claim',
      locator: 'file:test/path',
      contentHash: 'abc123',
    };

    collector.add(evidence);
    const result = collector.getAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(evidence);
  });

  it('should add multiple evidence records at once', () => {
    const collector = new EvidenceCollector();
    const evidence: Evidence[] = [
      {
        evidenceId: 'test-id-1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'test/path1',
        kind: 'file',
        claim: 'Test claim 1',
        locator: 'file:test/path1',
        contentHash: 'abc123',
      },
      {
        evidenceId: 'test-id-2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:01.000Z',
        path: 'test/path2',
        kind: 'directory',
        claim: 'Test claim 2',
        locator: 'directory:test/path2',
        contentHash: 'def456',
      },
    ];

    collector.addAll(evidence);
    const result = collector.getAll();

    expect(result).toHaveLength(2);
    expect(result).toEqual(evidence);
  });

  it('should combine add and addAll operations', () => {
    const collector = new EvidenceCollector();
    
    const evidence1: Evidence = {
      evidenceId: 'test-id-1',
      scannerName: 'test-scanner',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: 'test/path1',
      kind: 'file',
      claim: 'Test claim 1',
      locator: 'file:test/path1',
      contentHash: 'abc123',
    };

    const evidence2: Evidence[] = [
      {
        evidenceId: 'test-id-2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:01.000Z',
        path: 'test/path2',
        kind: 'file',
        claim: 'Test claim 2',
        locator: 'file:test/path2',
        contentHash: 'def456',
      },
      {
        evidenceId: 'test-id-3',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:02.000Z',
        path: 'test/path3',
        kind: 'file',
        claim: 'Test claim 3',
        locator: 'file:test/path3',
        contentHash: 'ghi789',
      },
    ];

    collector.add(evidence1);
    collector.addAll(evidence2);
    const result = collector.getAll();

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(evidence1);
    expect(result[1]).toEqual(evidence2[0]);
    expect(result[2]).toEqual(evidence2[1]);
  });

  it('should return a copy of evidence array (immutability)', () => {
    const collector = new EvidenceCollector();
    const evidence: Evidence = {
      evidenceId: 'test-id',
      scannerName: 'test-scanner',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: 'test/path',
      kind: 'file',
      claim: 'Test claim',
      locator: 'file:test/path',
      contentHash: 'abc123',
    };

    collector.add(evidence);
    const result1 = collector.getAll();
    const result2 = collector.getAll();

    expect(result1).not.toBe(result2); // Different array instances
    expect(result1).toEqual(result2); // Same content
  });

  describe('createEvidence', () => {
    it('should create evidence with deterministic ID for same inputs', () => {
      const collector = new EvidenceCollector();

      const evidence1 = collector.createEvidence(
        'D1-scanner',
        'package',
        'apps/admin/package.json',
        'abc123def456',
        'Package discovered',
        'file:apps/admin/package.json'
      );

      const evidence2 = collector.createEvidence(
        'D1-scanner',
        'package',
        'apps/admin/package.json',
        'abc123def456',
        'Package discovered',
        'file:apps/admin/package.json'
      );

      expect(evidence1.evidenceId).toBe(evidence2.evidenceId);
      expect(evidence1.evidenceId).toMatch(/^evidence-[0-9a-f]{16}$/);
    });

    it('should create different IDs for different content hashes', () => {
      const collector = new EvidenceCollector();

      const evidence1 = collector.createEvidence(
        'D1-scanner',
        'package',
        'apps/admin/package.json',
        'hash1',
        'Package discovered',
        'file:apps/admin/package.json'
      );

      const evidence2 = collector.createEvidence(
        'D1-scanner',
        'package',
        'apps/admin/package.json',
        'hash2',
        'Package discovered',
        'file:apps/admin/package.json'
      );

      expect(evidence1.evidenceId).not.toBe(evidence2.evidenceId);
    });

    it('should create different IDs when symbol parameter differs', () => {
      const collector = new EvidenceCollector();

      const evidence1 = collector.createEvidence(
        'D3-scanner',
        'component',
        'src/blocks/doc.md',
        'abc123',
        'Block discovered',
        'file:src/blocks/doc.md',
        'BlockV1'
      );

      const evidence2 = collector.createEvidence(
        'D3-scanner',
        'component',
        'src/blocks/doc.md',
        'abc123',
        'Block discovered',
        'file:src/blocks/doc.md',
        'BlockV2'
      );

      expect(evidence1.evidenceId).not.toBe(evidence2.evidenceId);
    });

    it('should create evidence with all required fields', () => {
      const collector = new EvidenceCollector();

      const evidence = collector.createEvidence(
        'D1-scanner',
        'package',
        'apps/admin/package.json',
        'abc123',
        'Package discovered',
        'file:apps/admin/package.json'
      );

      expect(evidence.evidenceId).toBeDefined();
      expect(evidence.scannerName).toBe('D1-scanner');
      expect(evidence.timestamp).toBeDefined();
      expect(evidence.path).toBe('apps/admin/package.json');
      expect(evidence.kind).toBe('package');
      expect(evidence.claim).toBe('Package discovered');
      expect(evidence.locator).toBe('file:apps/admin/package.json');
      expect(evidence.contentHash).toBe('abc123');
    });

    it('should include metadata when provided', () => {
      const collector = new EvidenceCollector();
      const metadata = { version: '1.0.0', type: 'library' };

      const evidence = collector.createEvidence(
        'D1-scanner',
        'package',
        'packages/ui/package.json',
        'abc123',
        'Package discovered',
        'file:packages/ui/package.json',
        undefined,
        metadata
      );

      expect(evidence.metadata).toEqual(metadata);
    });

    it('should not include metadata field when not provided', () => {
      const collector = new EvidenceCollector();

      const evidence = collector.createEvidence(
        'D1-scanner',
        'directory',
        'apps/admin',
        '',
        'Directory discovered',
        'directory:apps/admin'
      );

      expect(evidence.metadata).toBeUndefined();
    });

    it('should set timestamp to current ISO time', () => {
      const collector = new EvidenceCollector();
      const before = new Date().toISOString();

      const evidence = collector.createEvidence(
        'D1-scanner',
        'package',
        'apps/admin/package.json',
        'abc123',
        'Package discovered',
        'file:apps/admin/package.json'
      );

      const after = new Date().toISOString();

      expect(evidence.timestamp).toBeDefined();
      expect(evidence.timestamp >= before && evidence.timestamp <= after).toBe(true);
    });
  });
});
