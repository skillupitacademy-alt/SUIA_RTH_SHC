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
import type { 
  TutorialDocument,
  DefinitionD1Block,
  CodeC1Block,
  IntroductionI1Block,
  SummaryS1Block
} from '@quiz/types';

// Mock repository
class MockTutorialSectionRepository implements Partial<TutorialSectionRepository> {
  private mockContent: TutorialDocument | null = null;

  setMockContent(content: TutorialDocument | null) {
    this.mockContent = content;
  }

  async getTutorialByPageIdentity(
    subtopicId: string,
    navigationNodeId: string,
    brand: string
  ): Promise<{ id: string; content: TutorialDocument } | null> {
    if (!this.mockContent) {
      return null;
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
      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Test Term',
          definition: 'Test definition',
          showAsCallout: true
        }
        // No explicit progressRole - should default to 'instructional'
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [d1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should include C1 block with default progressRole=instructional', async () => {
      const c1Block: CodeC1Block = {
        id: 'c1-block-1',
        type: 'code',
        version: 'C1',
        authorContent: {
          language: 'typescript',
          code: 'const x = 1;',
          showLineNumbers: true,
          highlightedLines: []
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [c1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'c1-block-1', blockVersion: 'C1' }
      ]);
    });

    it('should include I1 block with default progressRole=instructional', async () => {
      const i1Block: IntroductionI1Block = {
        id: 'i1-block-1',
        type: 'introduction',
        version: 'I1',
        authorContent: {
          heading: 'Test Introduction',
          description: 'Test description',
          icon: 'book'
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [i1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'i1-block-1', blockVersion: 'I1' }
      ]);
    });

    it('should include S1 block with default progressRole=instructional', async () => {
      const s1Block: SummaryS1Block = {
        id: 's1-block-1',
        type: 'summary',
        version: 'S1',
        authorContent: {
          heading: 'Test Summary',
          keyPoints: ['Point 1', 'Point 2']
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [s1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
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
      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Test Term',
          definition: 'Test definition',
          showAsCallout: true
        }
      };

      const c1Block: CodeC1Block = {
        id: 'c1-block-1',
        type: 'code',
        version: 'C1',
        authorContent: {
          language: 'typescript',
          code: 'const x = 1;',
          showLineNumbers: true,
          highlightedLines: []
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [d1Block, c1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
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
      const i1Block: IntroductionI1Block = {
        id: 'i1-block-1',
        type: 'introduction',
        version: 'I1',
        authorContent: {
          heading: 'Introduction',
          description: 'Description',
          icon: 'book'
        }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      const c1Block: CodeC1Block = {
        id: 'c1-block-1',
        type: 'code',
        version: 'C1',
        authorContent: {
          language: 'typescript',
          code: 'const x = 1;',
          showLineNumbers: true,
          highlightedLines: []
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [i1Block, d1Block, c1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
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

    it('should include I1+D1+C1+S1 blocks in document order', async () => {
      const i1Block: IntroductionI1Block = {
        id: 'i1-block-1',
        type: 'introduction',
        version: 'I1',
        authorContent: {
          heading: 'Introduction',
          description: 'Description',
          icon: 'book'
        }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      const c1Block: CodeC1Block = {
        id: 'c1-block-1',
        type: 'code',
        version: 'C1',
        authorContent: {
          language: 'typescript',
          code: 'const x = 1;',
          showLineNumbers: true,
          highlightedLines: []
        }
      };

      const s1Block: SummaryS1Block = {
        id: 's1-block-1',
        type: 'summary',
        version: 'S1',
        authorContent: {
          heading: 'Summary',
          keyPoints: ['Point 1']
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [i1Block, d1Block, c1Block, s1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
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
    it('should exclude block with progressRole=assessment', async () => {
      const assessmentBlock = {
        id: 'q1-block-1',
        type: 'question',
        version: 'Q1',
        progressRole: 'assessment' as const,
        authorContent: {
          question: 'What is 2+2?',
          answers: [
            { id: 'a1', text: '3', correct: false },
            { id: 'a2', text: '4', correct: true }
          ]
        }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [d1Block, assessmentBlock]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should only include D1, not the assessment block
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should exclude multiple assessment blocks', async () => {
      const q1Block = {
        id: 'q1-block-1',
        type: 'question',
        version: 'Q1',
        progressRole: 'assessment' as const,
        authorContent: { question: 'Question 1' }
      };

      const ex1Block = {
        id: 'ex1-block-1',
        type: 'exercise',
        version: 'EX1',
        progressRole: 'assessment' as const,
        authorContent: { title: 'Exercise 1' }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [q1Block, d1Block, ex1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should only include D1, not the assessment blocks
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Structural Block Exclusion', () => {
    it('should exclude block with progressRole=structural', async () => {
      const structuralBlock = {
        id: 'heading-1',
        type: 'heading',
        version: 'H1',
        progressRole: 'structural' as const,
        authorContent: {
          text: 'Section Heading',
          level: 2
        }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [structuralBlock, d1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should only include D1, not the structural block
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Unversioned Block Exclusion', () => {
    it('should exclude blocks without version field', async () => {
      const unversionedBlock = {
        id: 'paragraph-1',
        type: 'paragraph',
        // No version field
        content: 'This is a paragraph'
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [unversionedBlock, d1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should only include D1, not the unversioned block
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Fail-Open Default Behavior', () => {
    it('should default to instructional when progressRole is missing', async () => {
      const blockWithoutProgressRole = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        // No progressRole field - should default to 'instructional'
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [blockWithoutProgressRole]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should include the block because it defaults to 'instructional'
      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should respect explicit progressRole=instructional', async () => {
      const blockWithExplicitRole: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        progressRole: 'instructional', // Explicit
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [blockWithExplicitRole]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });
  });

  describe('Future Instructional Block Extensibility', () => {
    it('should include hypothetical O1 (observation) block', async () => {
      const o1Block = {
        id: 'o1-block-1',
        type: 'observation',
        version: 'O1',
        progressRole: 'instructional' as const,
        authorContent: {
          title: 'Key Observation',
          description: 'Important point to notice'
        }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [o1Block, d1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should include both - demonstrates future extensibility
      expect(result).toEqual([
        { blockId: 'o1-block-1', blockVersion: 'O1' },
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should include hypothetical T1 (tip) block with default progressRole', async () => {
      const t1Block = {
        id: 't1-block-1',
        type: 'tip',
        version: 'T1',
        // No progressRole - should default to 'instructional'
        authorContent: {
          title: 'Pro Tip',
          content: 'Helpful advice'
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [t1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should include - demonstrates fail-open default works for future blocks
      expect(result).toEqual([
        { blockId: 't1-block-1', blockVersion: 'T1' }
      ]);
    });

    it('should work with mixed future and current instructional blocks', async () => {
      const r1Block = {
        id: 'r1-block-1',
        type: 'resource',
        version: 'R1',
        progressRole: 'instructional' as const,
        authorContent: {
          title: 'Additional Resource',
          url: 'https://example.com'
        }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      const t1Block = {
        id: 't1-block-1',
        type: 'tip',
        version: 'T1',
        progressRole: 'instructional' as const,
        authorContent: {
          title: 'Tip',
          content: 'Content'
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [r1Block, d1Block, t1Block]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should include all instructional blocks regardless of version name
      expect(result).toEqual([
        { blockId: 'r1-block-1', blockVersion: 'R1' },
        { blockId: 'd1-block-1', blockVersion: 'D1' },
        { blockId: 't1-block-1', blockVersion: 'T1' }
      ]);
    });
  });

  describe('Empty Content Cases', () => {
    it('should return empty array when section not found', async () => {
      mockRepo.setMockContent(null);

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when blocks array is empty', async () => {
      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: []
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when no instructional blocks present', async () => {
      const assessmentBlock = {
        id: 'q1-block-1',
        type: 'question',
        version: 'Q1',
        progressRole: 'assessment' as const,
        authorContent: { question: 'Question?' }
      };

      const structuralBlock = {
        id: 'heading-1',
        type: 'heading',
        version: 'H1',
        progressRole: 'structural' as const,
        authorContent: { text: 'Heading', level: 2 }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [assessmentBlock, structuralBlock]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([]);
    });
  });

  describe('Mixed Content Scenarios', () => {
    it('should filter correctly with instructional + assessment + structural + unversioned', async () => {
      const i1Block: IntroductionI1Block = {
        id: 'i1-block-1',
        type: 'introduction',
        version: 'I1',
        progressRole: 'instructional',
        authorContent: {
          heading: 'Introduction',
          description: 'Description',
          icon: 'book'
        }
      };

      const structuralBlock = {
        id: 'heading-1',
        type: 'heading',
        version: 'H1',
        progressRole: 'structural' as const,
        authorContent: { text: 'Heading', level: 2 }
      };

      const d1Block: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        // No progressRole - defaults to instructional
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      const unversionedBlock = {
        id: 'paragraph-1',
        type: 'paragraph',
        content: 'Paragraph content'
      };

      const assessmentBlock = {
        id: 'q1-block-1',
        type: 'question',
        version: 'Q1',
        progressRole: 'assessment' as const,
        authorContent: { question: 'Question?' }
      };

      const c1Block: CodeC1Block = {
        id: 'c1-block-1',
        type: 'code',
        version: 'C1',
        progressRole: 'instructional',
        authorContent: {
          language: 'typescript',
          code: 'const x = 1;',
          showLineNumbers: true,
          highlightedLines: []
        }
      };

      const s1Block: SummaryS1Block = {
        id: 's1-block-1',
        type: 'summary',
        version: 'S1',
        // No progressRole - defaults to instructional
        authorContent: {
          heading: 'Summary',
          keyPoints: ['Point 1']
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [
          i1Block,
          structuralBlock,
          d1Block,
          unversionedBlock,
          assessmentBlock,
          c1Block,
          s1Block
        ]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Should only include instructional blocks: I1, D1, C1, S1
      // Should exclude: structural (H1), unversioned (paragraph), assessment (Q1)
      expect(result).toEqual([
        { blockId: 'i1-block-1', blockVersion: 'I1' },
        { blockId: 'd1-block-1', blockVersion: 'D1' },
        { blockId: 'c1-block-1', blockVersion: 'C1' },
        { blockId: 's1-block-1', blockVersion: 'S1' }
      ]);
    });
  });

  describe('expectedTimeSec Independence', () => {
    it('should include blocks with expectedTimeSec (analytics metadata)', async () => {
      const d1BlockWithTime: DefinitionD1Block & { expectedTimeSec: number } = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        progressRole: 'instructional',
        expectedTimeSec: 120, // Analytics metadata - does NOT affect eligibility
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [d1BlockWithTime]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should include blocks without expectedTimeSec (missing analytics)', async () => {
      const d1BlockNoTime: DefinitionD1Block = {
        id: 'd1-block-1',
        type: 'definition',
        version: 'D1',
        progressRole: 'instructional',
        // No expectedTimeSec - still eligible because progressRole=instructional
        authorContent: {
          term: 'Term',
          definition: 'Definition',
          showAsCallout: true
        }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [d1BlockNoTime]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      expect(result).toEqual([
        { blockId: 'd1-block-1', blockVersion: 'D1' }
      ]);
    });

    it('should treat expectedTimeSec as independent from progressRole determination', async () => {
      const blockWithTime = {
        id: 'block-1',
        type: 'tip',
        version: 'T1',
        progressRole: 'instructional' as const,
        expectedTimeSec: 60,
        authorContent: { title: 'Tip', content: 'Content' }
      };

      const blockWithoutTime = {
        id: 'block-2',
        type: 'tip',
        version: 'T1',
        progressRole: 'instructional' as const,
        // No expectedTimeSec
        authorContent: { title: 'Tip 2', content: 'Content 2' }
      };

      mockRepo.setMockContent({
        version: '1.0',
        brand: 'rth',
        blocks: [blockWithTime, blockWithoutTime]
      });

      const result = await resolveRequiredBlocks(
        mockRepo as TutorialSectionRepository,
        'subtopic-1',
        'nav-node-1',
        identity
      );

      // Both should be included - expectedTimeSec does NOT affect eligibility
      expect(result).toEqual([
        { blockId: 'block-1', blockVersion: 'T1' },
        { blockId: 'block-2', blockVersion: 'T1' }
      ]);
    });
  });
});
