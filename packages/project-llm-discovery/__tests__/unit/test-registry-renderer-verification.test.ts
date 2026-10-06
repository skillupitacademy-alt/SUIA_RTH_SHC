/**
 * Wave 3: Registry/Renderer Verification Tests
 * 
 * Tests for runtime verification that blocks are:
 * 1. Registered in the active block registry
 * 2. Discoverable via registry lookup
 * 3. Have resolvable renderer
 * 4. Have compatible version
 * 5. Have compatible type signature
 */

import { describe, it, expect, vi } from 'vitest';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';
import type { BlockVerification } from '../../src/contracts/snapshot.js';
import { verifyRegistryRendererRuntime } from '../../src/verification/registry-renderer-verification.js';

describe('Wave 3: Registry/Renderer Runtime Verification', () => {
  const createMockAdapter = (files: Record<string, string>): RepositoryAdapter => {
    return {
      fileExists: vi.fn(async (path: string) => path in files),
      readFile: vi.fn(async (path: string) => {
        if (!(path in files)) {
          throw new Error(`File not found: ${path}`);
        }
        return files[path] as string;
      }),
      getFileHash: vi.fn(async () => 'mock-hash'),
      listFiles: vi.fn(async () => []),
      getRepositoryRoot: vi.fn(() => '/mock/repo'),
    };
  };

  describe('Registry Entry Verification', () => {
    it('should verify block has registry entry', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            heading: { type: 'heading', label: 'Heading' },
            paragraph: { type: 'paragraph', label: 'Paragraph' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'heading':
              return <HeadingBlock />;
            case 'paragraph':
              return <ParagraphBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'heading',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results.length).toBe(1);
      expect(results[0]?.status).toBe('PASS');
      expect(results[0]?.registryEntry).toBe(true);
      expect(results[0]?.runtimeDispatchCase).toBe(true);
      expect(results[0]?.issues.length).toBe(0);
    });

    it('should fail when block has no registry entry', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            heading: { type: 'heading', label: 'Heading' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'heading':
              return <HeadingBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'unknown',
          documented: false,
          implemented: true,
          rendered: true,
          registered: false,
          tested: false,
          verificationLevel: 'RENDERED',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results.length).toBe(1);
      expect(results[0]?.status).toBe('FAIL');
      expect(results[0]?.registryEntry).toBe(false);
      expect(results[0]?.issues.length).toBeGreaterThan(0);
      expect(results[0]?.issues.some(i => i.includes('registry entry'))).toBe(true);
    });
  });

  describe('Runtime Dispatch Case Verification', () => {
    it('should verify block has runtime dispatch case', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            code: { type: 'code', label: 'Code' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'code':
              return <CodeBlock block={block} />;
            default:
              return null;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'code',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.runtimeDispatchCase).toBe(true);
      expect(results[0]?.status).toBe('PASS');
    });

    it('should fail when block has no runtime dispatch case', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            quiz: { type: 'quiz', label: 'Quiz' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'heading':
              return <HeadingBlock />;
            default:
              return null;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'quiz',
          documented: true,
          implemented: true,
          rendered: true,
          registered: false,
          tested: false,
          verificationLevel: 'RENDERED',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.runtimeDispatchCase).toBe(false);
      expect(results[0]?.status).toBe('FAIL');
      expect(results[0]?.issues.some(i => i.includes('dispatch case'))).toBe(true);
    });
  });

  describe('Version Compatibility Verification', () => {
    it('should verify versioned blocks have compatible registry entry', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            introduction: { type: 'introduction', label: 'Introduction', version: 'I1' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'introduction':
              return <IntroductionBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'introduction',
          version: 'I1',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.versionCompatible).toBe(true);
      expect(results[0]?.status).toBe('PASS');
    });

    it('should fail when registry entry missing version for versioned block', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            code: { type: 'code', label: 'Code' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'code':
              return <CodeBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
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
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.versionCompatible).toBe(false);
      expect(results[0]?.status).toBe('FAIL');
      expect(results[0]?.issues.some(i => i.includes('version'))).toBe(true);
    });
  });

  describe('Type Compatibility Verification', () => {
    it('should verify registry type matches block type', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            definition: { type: 'definition', label: 'Definition' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'definition':
              return <DefinitionBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'definition',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.typeCompatible).toBe(true);
      expect(results[0]?.status).toBe('PASS');
    });

    it('should fail when registry type does not match block type', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            heading: { type: 'title', label: 'Heading' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'heading':
              return <HeadingBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'heading',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.typeCompatible).toBe(false);
      expect(results[0]?.status).toBe('FAIL');
      expect(results[0]?.issues.some(i => i.toLowerCase().includes('type mismatch'))).toBe(true);
    });
  });

  describe('Renderer Resolvability Verification', () => {
    it('should verify renderer is resolvable', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            summary: { type: 'summary', label: 'Summary' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'summary':
              return <SummaryBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'summary',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.rendererResolvable).toBe(true);
      expect(results[0]?.status).toBe('PASS');
    });

    it('should fail when renderer is not resolvable', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            exercise: { type: 'exercise', label: 'Exercise' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'exercise':
              return <ExerciseBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'exercise',
          documented: true,
          implemented: true,
          rendered: false,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results[0]?.rendererResolvable).toBe(false);
      expect(results[0]?.status).toBe('FAIL');
      expect(results[0]?.issues.some(i => i.toLowerCase().includes('renderer component'))).toBe(true);
    });
  });

  describe('Multiple Blocks Verification', () => {
    it('should verify multiple blocks and report individual results', async () => {
      const mockAdapter = createMockAdapter({
        'packages/types/src/tutorial-rich-document/registry.ts': `
          export const BLOCK_REGISTRY = {
            heading: { type: 'heading', label: 'Heading' },
            paragraph: { type: 'paragraph', label: 'Paragraph' },
          };
        `,
        'packages/ui/src/tutorial/TutorialBlockRenderer.tsx': `
          switch (block.type) {
            case 'heading':
              return <HeadingBlock />;
            case 'paragraph':
              return <ParagraphBlock />;
          }
        `,
      });

      const blocks: BlockVerification[] = [
        {
          blockType: 'heading',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
        {
          blockType: 'paragraph',
          documented: true,
          implemented: true,
          rendered: true,
          registered: true,
          tested: false,
          verificationLevel: 'REGISTERED',
          ubrcStatus: 'UBRC_VALID',
        },
      ];

      const results = await verifyRegistryRendererRuntime(blocks, mockAdapter);

      expect(results.length).toBe(2);
      expect(results[0]?.status).toBe('PASS');
      expect(results[1]?.status).toBe('PASS');
    });
  });
});
