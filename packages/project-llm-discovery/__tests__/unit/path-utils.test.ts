import { describe, it, expect } from 'vitest';
import { normalizePath, generateDeterministicEvidenceId } from '../../src/utils/path-utils.js';

describe('normalizePath', () => {
  it('should convert backslashes to forward slashes', () => {
    expect(normalizePath('apps\\admin\\package.json')).toBe('apps/admin/package.json');
  });

  it('should lowercase drive letters', () => {
    expect(normalizePath('E:\\apps\\admin')).toBe('e:/apps/admin');
    expect(normalizePath('C:\\projects\\test')).toBe('c:/projects/test');
  });

  it('should trim leading slashes', () => {
    expect(normalizePath('/apps/admin')).toBe('apps/admin');
    expect(normalizePath('//apps/admin')).toBe('apps/admin');
  });

  it('should trim trailing slashes', () => {
    expect(normalizePath('apps/admin/')).toBe('apps/admin');
    expect(normalizePath('apps/admin//')).toBe('apps/admin');
  });

  it('should handle mixed paths', () => {
    expect(normalizePath('E:\\apps\\admin/')).toBe('e:/apps/admin');
  });

  it('should return same result for Windows and Unix paths to same location', () => {
    const windowsPath = 'apps\\admin\\package.json';
    const unixPath = 'apps/admin/package.json';
    expect(normalizePath(windowsPath)).toBe(normalizePath(unixPath));
  });
});

describe('generateDeterministicEvidenceId', () => {
  it('should produce same ID for same inputs', () => {
    const id1 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'abc123def456'
    );
    const id2 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'abc123def456'
    );
    expect(id1).toBe(id2);
  });

  it('should produce different IDs for different paths', () => {
    const id1 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'abc123'
    );
    const id2 = generateDeterministicEvidenceId(
      'package',
      'apps/other/package.json',
      'abc123'
    );
    expect(id1).not.toBe(id2);
  });

  it('should produce different IDs for different content hashes', () => {
    const id1 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'hash1'
    );
    const id2 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'hash2'
    );
    expect(id1).not.toBe(id2);
  });

  it('should produce different IDs for different kinds', () => {
    const id1 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'abc123'
    );
    const id2 = generateDeterministicEvidenceId(
      'file',
      'apps/admin/package.json',
      'abc123'
    );
    expect(id1).not.toBe(id2);
  });

  it('should produce same ID for Windows and Unix paths to same file', () => {
    const id1 = generateDeterministicEvidenceId(
      'package',
      'apps\\admin\\package.json',
      'abc123'
    );
    const id2 = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'abc123'
    );
    expect(id1).toBe(id2);
  });

  it('should produce different IDs when symbol parameter differs', () => {
    const id1 = generateDeterministicEvidenceId(
      'component',
      'src/blocks/doc.md',
      'abc123',
      'BlockV1'
    );
    const id2 = generateDeterministicEvidenceId(
      'component',
      'src/blocks/doc.md',
      'abc123',
      'BlockV2'
    );
    expect(id1).not.toBe(id2);
  });

  it('should produce different IDs when symbol is present vs absent', () => {
    const id1 = generateDeterministicEvidenceId(
      'component',
      'src/blocks/doc.md',
      'abc123'
    );
    const id2 = generateDeterministicEvidenceId(
      'component',
      'src/blocks/doc.md',
      'abc123',
      'BlockV1'
    );
    expect(id1).not.toBe(id2);
  });

  it('should return ID with evidence- prefix and 16 hex characters', () => {
    const id = generateDeterministicEvidenceId(
      'package',
      'apps/admin/package.json',
      'abc123'
    );
    expect(id).toMatch(/^evidence-[0-9a-f]{16}$/);
  });
});
