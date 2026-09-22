/**
 * Phase 2B.13: Direct Unit Tests for resolveRequiredBlocks()
 * 
 * PURPOSE: Verify generic progressRole contract operates correctly
 * 
 * TEST COVERAGE:
 * 1. Single versioned block types (D1, C1, I1, S1)
 * 2. Multiple versioned blocks (D1+C1, I1+D1+C1, I1+D1+C1+S1)
 * 3. Assessment block exclusion (progressRole='assessment')
 * 4. Structural block exclusion (progressRole='structural')
 * 5. Unversioned block exclusion (no version field)
 * 6. Fail-open default behavior (missing progressRole defaults to 'instructional')
 * 7. Future instructional block extensibility (hypothetical O1, T1, R1)
 * 8. Empty content cases (no section, no blocks, no content)
 * 9. Mixed content (instructional + assessment + structural + unversioned)
 * 
 * ARCHITECTURE INVARIANTS:
 * - Does NOT hard-code version names (D1, C1, I1, S1)
 * - Uses progressRole field for eligibility determination
 * - expectedTimeSec NOT used for eligibility (it's analytics metadata)
 * - Assessment blocks explicitly declare progressRole='assessment'
 * - Structural blocks explicitly declare progressRole='structural'
 * - Future instructional UBRC versions work automatically
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveRequiredBlocks } from '../learning-progress.hierarchy-resolution';
import type { TutorialSectionRepository } from '../../repositories/tutorial-section.repository';
import type { AuthenticatedIdentity } from '../learning-progress.types';
import type { TutorialDocument } from '@quiz/types';
import {
  createD1Fixture,
  createC1Fixture,
  createI1Fixture,
  createS1Fixture,
  createAssessmentFixture,
  createStructuralFixture,
  createUnversionedFixture,
  createTutorialDocument
} from './test-fixtures';

// Mock repository
class MockTutorialSectionRepository implements Partial<TutorialSectionRepository> {
  private mockContent: TutorialDocument | null = null;

  setMockContent(content: TutorialDocument | null) {
    this.mockContent = content;
  }

  async getTutorialByPageIdentity(
    subtopicId: string,
    navigationNodeId: string,
    brandId?: string
  ): Promise<any> {
    if (!this.mockContent) {
      return undefined;
    }
    return {
      id: 'test-section-id',
      content: this.mockContent
    };
  }
}

describe('resolveRequiredBlocks() - Direct Unit Tests', () => {
  let mockRepo: MockTutorialSectionRepository;
  let identity: AuthenticatedIdentity;

  beforeEach(() => {
    mockRepo = new MockTutorialSectionRepository();
    identity = {
      userId: 'test-user',
      brand: 'rth'
    };
  });

  describe('Single Versioned Block Types', () => {
    it('should include D1 block with default progressRole=instructional', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([d1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should include C1 block with default progressRole=instructional', async () => {
      const c1Block = createC1Fixture({ id: 'c1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([c1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'c1-block-1', blockVersion: 'C1' }
      ]);
    });

    it('should include I1 block with default progressRole=instructional', async () => {
      const i1Block = createI1Fixture({ id: 'i1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([i1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'i1-block-1', blockVersion: 'I1' }
      ]);
    });

    it('should include S1 block with default progressRole=instructional', async () => {
      const s1Block = createS1Fixture({ id: 's1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([s1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 's1-block-1', blockVersion: 'S1' }
      ]);
    });
  });

  describe('Multiple Versioned Blocks', () => {
    it('should include D1+C1 blocks in document order', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const c1Block = createC1Fixture({ id: 'c1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([d1Block, c1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' },
        { blockId: 'c1-block-1', blockVersion: 'C1' }
      ]);
    });

    it('should include I1+D1+C1 blocks in document order', async () => {
      const i1Block = createI1Fixture({ id: 'i1-block-1' });
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const c1Block = createC1Fixture({ id: 'c1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([i1Block, d1Block, c1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'i1-block-1', blockVersion: 'I1' },
        { blockId: 'd1-block-1', blockVersion: 'D1' },
        { blockId: 'c1-block-1', blockVersion: 'C1' }
      ]);
    });

    it('should include I1+D1+C1+S1 blocks (full page composition)', async () => {
      const i1Block = createI1Fixture({ id: 'i1-block-1' });
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const c1Block = createC1Fixture({ id: 'c1-block-1' });
      const s1Block = createS1Fixture({ id: 's1-block-1' });

      mockRepo.setMockContent(createTutorialDocument([i1Block, d1Block, c1Block, s1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'i1-block-1', blockVersion: 'I1' },
        { blockId: 'd1-block-1', blockVersion: 'D1' },
        { blockId: 'c1-block-1', blockVersion: 'C1' },
        { blockId: 's1-block-1', blockVersion: 'S1' }
      ]);
    });
  });

  describe('Assessment Block Exclusion', () => {
    it('should exclude assessment blocks (progressRole=assessment)', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const assessmentBlock = createAssessmentFixture('assessment-1');

      mockRepo.setMockContent(createTutorialDocument([d1Block, assessmentBlock]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Only D1 included, assessment excluded
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should handle page with multiple assessment blocks', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const q1Block = createAssessmentFixture('q1');
      const ex1Block = createAssessmentFixture('ex1');

      mockRepo.setMockContent(createTutorialDocument([q1Block, d1Block, ex1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Only D1 included
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Structural Block Exclusion', () => {
    it('should exclude structural blocks (progressRole=structural)', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const structuralBlock = createStructuralFixture('heading-1');

      mockRepo.setMockContent(createTutorialDocument([structuralBlock, d1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Only D1 included, structural excluded
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Unversioned Block Exclusion', () => {
    it('should exclude unversioned blocks (no version field)', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      const unversionedBlock = createUnversionedFixture('paragraph-1');

      mockRepo.setMockContent(createTutorialDocument([unversionedBlock, d1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Only D1 included, unversioned excluded
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Fail-Open Default Behavior', () => {
    it('should default missing progressRole to instructional (backward compatibility)', async () => {
      const blockWithoutProgressRole = createD1Fixture({ 
        id: 'd1-legacy',
        progressRole: undefined // Simulate legacy block without progressRole
      });

      mockRepo.setMockContent(createTutorialDocument([blockWithoutProgressRole]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should be included with fail-open default
      expect(result).toEqual([
        { blockId: 'd1-legacy', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Expected Time Separation', () => {
    it('should include blocks with expectedTimeSec (metadata, not eligibility)', async () => {
      const d1WithTime = createD1Fixture({ 
        id: 'd1-with-time',
        expectedTimeSec: 120
      });

      mockRepo.setMockContent(createTutorialDocument([d1WithTime]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-with-time', blockVersion: 'D1' }
      ]);
    });

    it('should include blocks without expectedTimeSec (field is optional)', async () => {
      const d1WithoutTime = createD1Fixture({ 
        id: 'd1-no-time',
        expectedTimeSec: undefined
      });

      mockRepo.setMockContent(createTutorialDocument([d1WithoutTime]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-no-time', blockVersion: 'D1' }
      ]);
    });

    it('should treat expectedTimeSec independently from progressRole', async () => {
      const d1WithTime = createD1Fixture({ 
        id: 'd1-with-time',
        progressRole: 'instructional',
        expectedTimeSec: 180
      });
      
      const d1WithoutTime = createD1Fixture({ 
        id: 'd1-no-time',
        progressRole: 'instructional',
        expectedTimeSec: undefined
      });

      mockRepo.setMockContent(createTutorialDocument([d1WithTime, d1WithoutTime]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Both included regardless of expectedTimeSec
      expect(result).toEqual([
        { blockId: 'd1-with-time', blockVersion: 'D1' },
        { blockId: 'd1-no-time', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Future Instructional Block Extensibility', () => {
    it('should include hypothetical future instructional block (O1) without resolver changes', async () => {
      const d1Block = createD1Fixture({ id: 'd1-block-1' });
      
      // Hypothetical future versioned block
      const o1Block = {
        id: 'o1-future-1',
        type: 'objective',
        version: 'O1',
        progressRole: 'instructional',
        content: {
          page: {
            title: 'Learning Objective',
            description: 'Future block type'
          }
        }
      };

      mockRepo.setMockContent(createTutorialDocument([o1Block as any, d1Block]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Both should be included - resolver is generic
      expect(result).toEqual([
        { blockId: 'o1-future-1', blockVersion: 'O1' },
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should handle mixed current and future instructional blocks', async () => {
      const d1Block = createD1Fixture({ id: 'd1-current' });
      const t1Block = {
        id: 't1-future',
        type: 'task',
        version: 'T1',
        progressRole: 'instructional',
        content: { page: { title: 'Task Block' } }
      };
      const r1Block = {
        id: 'r1-future',
        type: 'reference',
        version: 'R1',
        progressRole: 'instructional',
        content: { page: { title: 'Reference Block' } }
      };

      mockRepo.setMockContent(createTutorialDocument([d1Block, t1Block as any, r1Block as any]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // All should be included
      expect(result).toEqual([
        { blockId: 'd1-current', blockVersion: 'D1' },
        { blockId: 't1-future', blockVersion: 'T1' },
        { blockId: 'r1-future', blockVersion: 'R1' }
      ]);
    });
  });

  describe('Empty Content Cases', () => {
    it('should return empty array when section does not exist', async () => {
      mockRepo.setMockContent(null);

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when blocks array is empty', async () => {
      mockRepo.setMockContent(createTutorialDocument([]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when all blocks are non-instructional', async () => {
      const assessmentBlock = createAssessmentFixture('q1');
      const structuralBlock = createStructuralFixture('heading-1');

      mockRepo.setMockContent(createTutorialDocument([assessmentBlock, structuralBlock]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([]);
    });
  });

  describe('Mixed Content Scenarios', () => {
    it('should handle page with instructional + assessment + structural blocks', async () => {
      const i1Block = createI1Fixture({ id: 'i1-1' });
      const headingBlock = createStructuralFixture('heading-1');
      const d1Block = createD1Fixture({ id: 'd1-1' });
      const quizBlock = createAssessmentFixture('quiz-1');
      const c1Block = createC1Fixture({ id: 'c1-1' });
      const paragraphBlock = createUnversionedFixture('para-1');

      mockRepo.setMockContent(createTutorialDocument([i1Block, headingBlock, d1Block, quizBlock, c1Block, paragraphBlock]));

      const result = await resolveRequiredBlocks(
        mockRepo as any,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Only instructional blocks included
      expect(result).toEqual([
        { blockId: 'i1-1', blockVersion: 'I1' },
        { blockId: 'd1-1', blockVersion: 'D1' },
        { blockId: 'c1-1', blockVersion: 'C1' }
      ]);
    });
  });
});

