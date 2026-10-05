import { describe, it, expect, vi } from 'vitest';
import { scanBlocks } from '../../src/scanners/d3-blocks-scanner.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';

describe('D3 Blocks Scanner', () => {
  it('should discover documented block families from registry', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md')) {
          return `
## 18-Family Registry Table

| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | IntroductionBlock | I | 6 | I1-I6 | VERIFIED (I1) | I1 implemented |
| 2 | ObjectiveBlock | O | 5 | O1-O5 | PLANNED | Learning goals |
| 3 | DefinitionBlock | D | 6 | D1-D6 | VERIFIED (D1) | D1 implemented |
          `;
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    expect(result.data.documented).toHaveLength(3);
    expect(result.data.documented[0]?.family).toBe('I');
    expect(result.data.documented[0]?.versions).toEqual(['I1', 'I2', 'I3', 'I4', 'I5', 'I6']);
    expect(result.data.documented[1]?.family).toBe('O');
    expect(result.data.documented[1]?.versions).toEqual(['O1', 'O2', 'O3', 'O4', 'O5']);
    expect(result.data.documented[2]?.family).toBe('D');
    expect(result.data.documented[2]?.versions).toEqual(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']);
  });

  it('should discover implemented block types from TypeScript definitions', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('content-blocks.ts')) {
          return `
export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
}

export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
}

export interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
}
          `;
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    expect(result.data.implemented.length).toBeGreaterThan(0);
    
    const versionedBlocks = result.data.implemented.filter(b => b.version !== undefined);
    expect(versionedBlocks).toHaveLength(3);
    
    const introBlock = versionedBlocks.find(b => b.type === 'introduction' && b.version === 'I1');
    expect(introBlock).toBeDefined();
    
    const codeBlock = versionedBlocks.find(b => b.type === 'code' && b.version === 'C1');
    expect(codeBlock).toBeDefined();
    
    const defBlock = versionedBlocks.find(b => b.type === 'definition' && b.version === 'D1');
    expect(defBlock).toBeDefined();
  });

  it('should discover rendered block components', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('tutorial/blocks')) {
          return [
            'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
            'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
            'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx',
            'packages/ui/src/tutorial/blocks/HeadingBlock.tsx',
          ];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    expect(result.data.rendered.length).toBeGreaterThan(0);
    
    const introRenderer = result.data.rendered.find(r => r.blockType === 'introduction');
    expect(introRenderer).toBeDefined();
    
    const codeRenderer = result.data.rendered.find(r => r.blockType === 'code');
    expect(codeRenderer).toBeDefined();
  });

  it('should detect discrepancies between documented and implemented blocks', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md')) {
          return `
## 18-Family Registry Table

| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | ObjectiveBlock | O | 5 | O1-O5 | PLANNED | Not implemented |
          `;
        }
        if (path.includes('content-blocks.ts')) {
          return 'export interface HeadingBlock extends BaseBlock {}';
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    expect(result.data.discrepancies.length).toBeGreaterThan(0);
    
    const o1Discrepancy = result.data.discrepancies.find(
      d => d.version === 'O1' && d.issue === 'DOCUMENTED but not IMPLEMENTED'
    );
    expect(o1Discrepancy).toBeDefined();
    expect(o1Discrepancy?.severity).toBe('warning');
  });

  it('should maintain 4 separate block states (never collapse)', async () => {
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
          return 'export interface IntroductionI1Block extends BaseBlock {}';
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('tutorial/blocks')) {
          return ['packages/ui/src/tutorial/blocks/IntroductionBlock.tsx'];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    // Verify all 4 states are present and separate
    expect(result.data.documented).toBeDefined();
    expect(result.data.implemented).toBeDefined();
    expect(result.data.rendered).toBeDefined();
    expect(result.data.verified).toBeDefined();

    // Verify states are not collapsed
    expect(result.data.documented.length).toBeGreaterThan(0);
    expect(result.data.implemented.length).toBeGreaterThan(0);
    expect(result.data.rendered.length).toBeGreaterThan(0);
  });

  it('should generate evidence for all discoveries', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    expect(result.evidence.length).toBeGreaterThan(0);
    
    const docEvidence = result.evidence.find(e => e.kind === 'documentation');
    expect(docEvidence).toBeDefined();
    expect(docEvidence?.path).toContain('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md');
  });
});
