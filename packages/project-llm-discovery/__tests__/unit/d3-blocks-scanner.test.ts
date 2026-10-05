import { describe, it, expect, vi } from 'vitest';
import { scanBlocks } from '../../src/scanners/d3-blocks-scanner.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';
import type { VerificationLevel } from '../../src/contracts/snapshot.js';

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

  it('should detect documented flag only when block is in registry', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md')) {
          return `
## 18-Family Registry Table

| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | IntroductionBlock | I | 6 | I1-I6 | VERIFIED (I1) | I1 implemented |
          `;
        }
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

    // I1 is documented in registry - should be true
    const introVerification = result.data.verified.find(
      v => v.blockType === 'introduction' && v.version === 'I1'
    );
    expect(introVerification?.documented).toBe(true);

    // C1 is NOT documented in registry - should be false
    const codeVerification = result.data.verified.find(
      v => v.blockType === 'code' && v.version === 'C1'
    );
    expect(codeVerification?.documented).toBe(false);
  });

  it('should detect registered flag only when dispatch case exists in TutorialBlockRenderer', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('TutorialBlockRenderer.tsx')) {
          return `
switch (block.type) {
  case 'heading':
    return <HeadingBlock />;
  case 'introduction':
    return <IntroductionBlock />;
  case 'paragraph':
    return <ParagraphBlock />;
  default:
    return <UnknownBlock />;
}
          `;
        }
        if (path.includes('content-blocks.ts')) {
          return `
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
}

export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
}

export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
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

    // heading and introduction have dispatch cases - should be registered
    const headingVerification = result.data.verified.find(
      v => v.blockType === 'heading'
    );
    expect(headingVerification?.registered).toBe(true);

    const introVerification = result.data.verified.find(
      v => v.blockType === 'introduction'
    );
    expect(introVerification?.registered).toBe(true);

    // code has NO dispatch case - should NOT be registered
    const codeVerification = result.data.verified.find(
      v => v.blockType === 'code'
    );
    expect(codeVerification?.registered).toBe(false);
  });

  it('should derive verification levels correctly from evidence', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md')) {
          return `
| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | IntroductionBlock | I | 6 | I1-I6 | VERIFIED (I1) | I1 implemented |
          `;
        }
        if (path.includes('TutorialBlockRenderer.tsx')) {
          return `
switch (block.type) {
  case 'introduction':
    return <IntroductionBlock />;
  case 'heading':
    return <HeadingBlock />;
}
          `;
        }
        if (path.includes('content-blocks.ts')) {
          return `
export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
}

export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
}
          `;
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('tutorial/blocks')) {
          return [
            'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
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

    // introduction I1: documented + implemented + rendered + registered (+ tested=false in M1)
    // Level should be REGISTERED (not VERIFIED because tested=false in M1 scope)
    const introVerification = result.data.verified.find(
      v => v.blockType === 'introduction' && v.version === 'I1'
    );
    expect(introVerification?.verificationLevel).toBe('REGISTERED');
    expect(introVerification?.documented).toBe(true);
    expect(introVerification?.implemented).toBe(true);
    expect(introVerification?.rendered).toBe(true);
    expect(introVerification?.registered).toBe(true);
    expect(introVerification?.tested).toBe(false);

    // heading: NOT documented, implemented, rendered, registered
    // Level should be REGISTERED
    const headingVerification = result.data.verified.find(
      v => v.blockType === 'heading'
    );
    expect(headingVerification?.verificationLevel).toBe('REGISTERED');
    expect(headingVerification?.documented).toBe(false);

    // code C1: NOT documented, implemented, NOT rendered, NOT registered
    // Level should be IMPLEMENTED
    const codeVerification = result.data.verified.find(
      v => v.blockType === 'code' && v.version === 'C1'
    );
    expect(codeVerification?.verificationLevel).toBe('IMPLEMENTED');
    expect(codeVerification?.implemented).toBe(true);
    expect(codeVerification?.rendered).toBe(false);
    expect(codeVerification?.registered).toBe(false);
  });

  it('should require all predicates for VERIFIED level', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md')) {
          return `
| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | IntroductionBlock | I | 6 | I1-I6 | VERIFIED (I1) | I1 implemented |
          `;
        }
        if (path.includes('TutorialBlockRenderer.tsx')) {
          return `
switch (block.type) {
  case 'introduction':
    return <IntroductionBlock />;
}
          `;
        }
        if (path.includes('content-blocks.ts')) {
          return `
export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
}
          `;
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

    const introVerification = result.data.verified.find(
      v => v.blockType === 'introduction' && v.version === 'I1'
    );

    // M1 scope: tested is always false, so VERIFIED is unattainable
    // Highest level should be REGISTERED
    expect(introVerification?.tested).toBe(false);
    expect(introVerification?.verificationLevel).toBe('REGISTERED');
    // Not 'VERIFIED' because tested=false
  });

  it('should produce intermediate levels for partial evidence', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('content-blocks.ts')) {
          return `
export interface OnlyimplementedBlock extends BaseBlock {
  type: 'onlyimplemented';
}

export interface ImplementedrenderedBlock extends BaseBlock {
  type: 'implementedrendered';
}
          `;
        }
        if (path.includes('TutorialBlockRenderer.tsx')) {
          return `
switch (block.type) {
  default:
    return <UnknownBlock />;
}
          `;
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('tutorial/blocks')) {
          return ['packages/ui/src/tutorial/blocks/ImplementedrenderedBlock.tsx'];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanBlocks(mockAdapter);

    // onlyimplemented: implemented only (not rendered, not registered)
    const onlyImplemented = result.data.verified.find(
      v => v.blockType === 'onlyimplemented'
    );
    expect(onlyImplemented?.verificationLevel).toBe('IMPLEMENTED');
    expect(onlyImplemented?.implemented).toBe(true);
    expect(onlyImplemented?.rendered).toBe(false);
    expect(onlyImplemented?.registered).toBe(false);

    // implementedrendered: implemented + rendered but NOT registered (no dispatch case)
    const implementedRendered = result.data.verified.find(
      v => v.blockType === 'implementedrendered'
    );
    expect(implementedRendered?.verificationLevel).toBe('RENDERED');
    expect(implementedRendered?.implemented).toBe(true);
    expect(implementedRendered?.rendered).toBe(true);
    expect(implementedRendered?.registered).toBe(false);
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
