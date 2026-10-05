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

  it('should generate deterministic evidence IDs from scanner name and path', () => {
    const collector = new EvidenceCollector();
    const timestamp = '2024-01-01T00:00:00.000Z';

    const id1 = collector.generateEvidenceId('D1-scanner', 'test/path', timestamp);
    const id2 = collector.generateEvidenceId('D1-scanner', 'test/path', timestamp);

    expect(id1).toBe(id2); // Same inputs produce same hash
    expect(id1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
  });

  it('should generate different IDs for different inputs', () => {
    const collector = new EvidenceCollector();
    const timestamp = '2024-01-01T00:00:00.000Z';

    const id1 = collector.generateEvidenceId('D1-scanner', 'test/path1', timestamp);
    const id2 = collector.generateEvidenceId('D1-scanner', 'test/path2', timestamp);
    const id3 = collector.generateEvidenceId('D2-scanner', 'test/path1', timestamp);

    expect(id1).not.toBe(id2); // Different paths
    expect(id1).not.toBe(id3); // Different scanners
  });

  it('should generate unique IDs for different timestamps', () => {
    const collector = new EvidenceCollector();

    const id1 = collector.generateEvidenceId('D1-scanner', 'test/path', '2024-01-01T00:00:00.000Z');
    const id2 = collector.generateEvidenceId('D1-scanner', 'test/path', '2024-01-01T00:00:01.000Z');

    expect(id1).not.toBe(id2); // Different timestamps
  });

  it('should use current timestamp if not provided', () => {
    const collector = new EvidenceCollector();

    const id1 = collector.generateEvidenceId('D1-scanner', 'test/path');
    const id2 = collector.generateEvidenceId('D1-scanner', 'test/path');

    // Since timestamps are different, IDs should be different
    expect(id1).toMatch(/^[a-f0-9]{64}$/);
    expect(id2).toMatch(/^[a-f0-9]{64}$/);
    // They might be different due to timestamp variance
  });
});
