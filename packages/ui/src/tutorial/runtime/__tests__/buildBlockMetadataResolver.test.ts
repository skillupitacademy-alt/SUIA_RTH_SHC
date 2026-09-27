/**
 * Block Metadata Resolver Unit Tests - Phase 2B.18
 * 
 * Tests the buildBlockMetadataResolver function in isolation.
 * 
 * Coverage:
 * 1. Resolver creation from TutorialDocument blocks
 * 2. O(1) lookup performance verification
 * 3. Missing progressRole (defaults to 'instructional')
 * 4. Missing expectedTimeSec (returns undefined)
 * 5. Unknown block identity (returns null)
 * 6. Duplicate block identity handling
 */

import { describe, it, expect } from 'vitest';
import { buildBlockMetadataResolver } from '../buildBlockMetadataResolver';
import type { TutorialBlock } from '@quiz/types';

describe('buildBlockMetadataResolver - Phase 2B.18', () => {
  describe('Resolver creation', () => {
    it('should create resolver from tutorial blocks', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'block-1',
          version: 'D1',
          type: 'definition',
          progressRole: 'instructional',
          expectedTimeSec: 180,
        } as TutorialBlock,
        {
          id: 'block-2',
          version: 'C1',
          type: 'code',
          progressRole: 'instructional',
          expectedTimeSec: 240,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);

      expect(resolver).toBeInstanceOf(Function);
    });

    it('should resolve metadata for known blocks', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'test-block',
          version: 'D1',
          type: 'definition',
          progressRole: 'instructional',
          expectedTimeSec: 180,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('test-block', 'D1');

      expect(metadata).not.toBeNull();
      expect(metadata?.progressRole).toBe('instructional');
      expect(metadata?.expectedTimeSec).toBe(180);
    });

    it('should return null for unknown blocks', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'known-block',
          version: 'D1',
          type: 'definition',
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('unknown-block', 'D1');

      expect(metadata).toBeNull();
    });

    it('should return null for wrong version', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'test-block',
          version: 'D1',
          type: 'definition',
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('test-block', 'D2'); // Wrong version

      expect(metadata).toBeNull();
    });
  });

  describe('Default values', () => {
    it('should default progressRole to "instructional" when missing', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'block-without-role',
          version: 'D1',
          type: 'definition',
          // progressRole: undefined (missing)
          expectedTimeSec: 180,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('block-without-role', 'D1');

      expect(metadata?.progressRole).toBe('instructional');
    });

    it('should return undefined for expectedTimeSec when missing', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'block-without-time',
          version: 'D1',
          type: 'definition',
          progressRole: 'instructional',
          // expectedTimeSec: undefined (missing)
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('block-without-time', 'D1');

      expect(metadata?.expectedTimeSec).toBeUndefined();
    });

    it('should preserve explicit progressRole values', () => {
      const progressRoles = ['structural', 'assessment', 'media'] as const;

      for (const role of progressRoles) {
        const blocks: TutorialBlock[] = [
          {
            id: 'test-block',
            version: 'D1',
            type: 'definition',
            progressRole: role,
          } as TutorialBlock,
        ];

        const resolver = buildBlockMetadataResolver(blocks);
        const metadata = resolver('test-block', 'D1');

        expect(metadata?.progressRole).toBe(role);
      }
    });
  });

  describe('Multiple blocks', () => {
    it('should handle multiple different blocks', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'block-1',
          version: 'D1',
          type: 'definition',
          progressRole: 'instructional',
          expectedTimeSec: 180,
        } as TutorialBlock,
        {
          id: 'block-2',
          version: 'C1',
          type: 'code',
          progressRole: 'instructional',
          expectedTimeSec: 240,
        } as TutorialBlock,
        {
          id: 'block-3',
          version: 'S1',
          type: 'summary',
          progressRole: 'instructional',
          expectedTimeSec: 120,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);

      const metadata1 = resolver('block-1', 'D1');
      const metadata2 = resolver('block-2', 'C1');
      const metadata3 = resolver('block-3', 'S1');

      expect(metadata1?.expectedTimeSec).toBe(180);
      expect(metadata2?.expectedTimeSec).toBe(240);
      expect(metadata3?.expectedTimeSec).toBe(120);
    });

    it('should handle same blockId with different versions', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'same-block',
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 180,
        } as TutorialBlock,
        {
          id: 'same-block',
          version: 'D2',
          type: 'definition',
          expectedTimeSec: 200,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);

      const metadataD1 = resolver('same-block', 'D1');
      const metadataD2 = resolver('same-block', 'D2');

      expect(metadataD1?.expectedTimeSec).toBe(180);
      expect(metadataD2?.expectedTimeSec).toBe(200);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty blocks array', () => {
      const blocks: TutorialBlock[] = [];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('any-block', 'D1');

      expect(metadata).toBeNull();
    });

    it('should skip blocks with missing id', () => {
      const blocks: TutorialBlock[] = [
        {
          // id: undefined (missing)
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 180,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('undefined', 'D1');

      expect(metadata).toBeNull();
    });

    it('should skip blocks with missing version', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'test-block',
          // version: undefined (missing)
          type: 'definition',
          expectedTimeSec: 180,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('test-block', 'undefined');

      expect(metadata).toBeNull();
    });

    it('should handle duplicate block identity (last wins)', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'duplicate',
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 100,
        } as TutorialBlock,
        {
          id: 'duplicate',
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 200, // Last value
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('duplicate', 'D1');

      // Map overwrites earlier entry, last value wins
      expect(metadata?.expectedTimeSec).toBe(200);
    });
  });

  describe('Performance characteristics', () => {
    it('should provide O(1) lookup for large block arrays', () => {
      // Create 1000 blocks
      const blocks: TutorialBlock[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `block-${i}`,
        version: 'D1',
        type: 'definition',
        progressRole: 'instructional',
        expectedTimeSec: 180,
      })) as TutorialBlock[];

      const resolver = buildBlockMetadataResolver(blocks);

      // Lookup should be fast (O(1) via Map)
      const start = performance.now();
      const metadata = resolver('block-999', 'D1'); // Last block
      const elapsed = performance.now() - start;

      expect(metadata).not.toBeNull();
      expect(elapsed).toBeLessThan(1); // Should be <1ms for Map lookup
    });
  });

  describe('Integration with completion evaluator', () => {
    it('should provide metadata in format expected by evaluator', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'test-block',
          version: 'D1',
          type: 'definition',
          progressRole: 'instructional',
          expectedTimeSec: 180,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);
      const metadata = resolver('test-block', 'D1');

      // Verify shape matches InstructionalBlockMetadata requirements
      expect(metadata).toHaveProperty('progressRole');
      expect(metadata).toHaveProperty('expectedTimeSec');
      expect(metadata?.progressRole).toMatch(/^(instructional|structural|assessment|media)$/);
      expect(typeof metadata?.expectedTimeSec).toBe('number');
    });

    it('should handle all block versions generically (D1, C1, I1, S1)', () => {
      const versions = ['D1', 'C1', 'I1', 'S1'];
      const blocks: TutorialBlock[] = versions.map(version => ({
        id: 'test-block',
        version,
        type: 'definition',
        progressRole: 'instructional',
        expectedTimeSec: 180,
      })) as TutorialBlock[];

      const resolver = buildBlockMetadataResolver(blocks);

      for (const version of versions) {
        const metadata = resolver('test-block', version);
        expect(metadata).not.toBeNull();
        expect(metadata?.progressRole).toBe('instructional');
        expect(metadata?.expectedTimeSec).toBe(180);
      }
    });
  });

  describe('Closure behavior', () => {
    it('should create independent resolvers for different block arrays', () => {
      const blocks1: TutorialBlock[] = [
        {
          id: 'block-1',
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 100,
        } as TutorialBlock,
      ];

      const blocks2: TutorialBlock[] = [
        {
          id: 'block-1',
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 200, // Different value
        } as TutorialBlock,
      ];

      const resolver1 = buildBlockMetadataResolver(blocks1);
      const resolver2 = buildBlockMetadataResolver(blocks2);

      const metadata1 = resolver1('block-1', 'D1');
      const metadata2 = resolver2('block-1', 'D1');

      expect(metadata1?.expectedTimeSec).toBe(100);
      expect(metadata2?.expectedTimeSec).toBe(200);
    });

    it('should not be affected by original array mutation', () => {
      const blocks: TutorialBlock[] = [
        {
          id: 'test-block',
          version: 'D1',
          type: 'definition',
          expectedTimeSec: 180,
        } as TutorialBlock,
      ];

      const resolver = buildBlockMetadataResolver(blocks);

      // Mutate original array
      blocks.push({
        id: 'new-block',
        version: 'C1',
        type: 'code',
        expectedTimeSec: 240,
      } as TutorialBlock);

      // Resolver should not see new block (closure captured snapshot)
      const metadata = resolver('new-block', 'C1');
      expect(metadata).toBeNull();
    });
  });
});
