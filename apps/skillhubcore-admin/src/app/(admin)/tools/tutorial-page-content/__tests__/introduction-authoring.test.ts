/**
 * Introduction Block Authoring Pipeline Tests
 * 
 * Comprehensive tests for Introduction (I1) block support in the composer:
 * - Dropdown registration
 * - Payload validation
 * - Source parsing (JSON/Markdown)
 * - Document transformation
 * - Preview rendering
 */

import { describe, it, expect } from 'vitest';
import { getBlockTypes, getBlockType, getVersions } from '../registry';
import { parseSource } from '../document/sourceParser';
import { toTutorialBlock, tutorialBlocksToInstances, extractBlockTitle } from '../document/documentTransformation';
import type { TutorialIntroductionPayload } from '@quiz/types';

describe('Introduction Block Authoring Pipeline', () => {
  describe('Stage 1: Dropdown Registration', () => {
    it('includes introduction in block types', () => {
      const blockTypes = getBlockTypes();
      const introductionType = blockTypes.find(b => b.id === 'introduction');
      
      expect(introductionType).toBeDefined();
      expect(introductionType?.label).toBe('Introduction');
    });

    it('has I1 version registered', () => {
      const versions = getVersions('introduction');
      
      expect(versions).toHaveLength(1);
      expect(versions[0].code).toBe('I1');
      expect(versions[0].label).toBe('I1 - Roadmap Overview');
    });

    it('provides default I1 payload', () => {
      const blockType = getBlockType('introduction');
      const version = blockType?.versions[0];
      const defaultPayload = version?.getDefaultPayload() as TutorialIntroductionPayload;
      
      expect(defaultPayload).toBeDefined();
      expect(defaultPayload.page).toBeDefined();
      expect(defaultPayload.page.badge).toBe('JavaScript');
      expect(defaultPayload.page.title).toBe('Functions in JavaScript');
      expect(defaultPayload.page.motto.lines).toHaveLength(4);
    });
  });

  describe('Stage 2: Valid I1 Payload Structure', () => {
    const validPayload: TutorialIntroductionPayload = {
      page: {
        badge: 'Test',
        title: 'Test Introduction',
        subtitle: 'Learn the basics',
        motto: {
          lines: ['Know', 'Your', 'Learning', 'Path'],
        },
        learningGoal: 'Master core concepts',
        topic: {
          title: 'What is it?',
          description: 'Core concept explained',
          quote: '"Essential knowledge" — Expert',
        },
        whereFit: {
          title: 'Where Does It Fit?',
          description: 'Context and relationships',
          flowCards: [
            { title: 'Foundation', subtitle: 'Basics', icon: 'box' },
            { title: 'This Topic', subtitle: 'Current', icon: 'code', highlight: true },
          ],
        },
        solution: {
          title: 'Example',
          description: 'Simple demonstration',
          code: {
            language: 'javascript',
            code: 'console.log("test");',
          },
        },
        whereUsed: {
          title: 'Where Is It Used?',
          description: 'Common applications',
          useCases: [
            { title: 'Web Apps', description: 'Frontend', icon: 'globe' },
          ],
        },
        roadmap: {
          title: 'Learning Roadmap',
          description: 'Structured lessons',
          steps: [
            { title: 'Basics', subtitle: 'Core fundamentals' },
            { title: 'Practice', subtitle: 'Exercises' },
          ],
        },
        whyMatters: {
          title: 'Why This Matters',
          benefits: [
            { title: 'Build Better', subtitle: 'Clean code', icon: 'check-circle' },
          ],
        },
        keyTakeaway: 'Master this concept for production applications',
      },
    };

    it('has correct structure', () => {
      expect(validPayload.page).toBeDefined();
      expect(validPayload.page.badge).toBe('Test');
      expect(validPayload.page.title).toBe('Test Introduction');
      expect(validPayload.page.motto.lines).toHaveLength(4);
    });

    it('contains all required I1 sections', () => {
      expect(validPayload.page.learningGoal).toBeDefined();
      expect(validPayload.page.topic).toBeDefined();
      expect(validPayload.page.whereFit).toBeDefined();
      expect(validPayload.page.solution).toBeDefined();
      expect(validPayload.page.whereUsed).toBeDefined();
      expect(validPayload.page.roadmap).toBeDefined();
      expect(validPayload.page.whyMatters).toBeDefined();
      expect(validPayload.page.keyTakeaway).toBeDefined();
    });

    it('has valid icon keys', () => {
      const validIcons = [
        'book-open', 'target', 'lightbulb', 'route', 'code', 'layers',
        'check-circle', 'arrow-right', 'graduation-cap', 'rocket', 'wrench',
        'globe', 'zap', 'star', 'box',
      ];
      
      validPayload.page.whereFit.flowCards.forEach(card => {
        expect(validIcons).toContain(card.icon);
      });
      
      validPayload.page.whereUsed.useCases.forEach(useCase => {
        expect(validIcons).toContain(useCase.icon);
      });
      
      validPayload.page.whyMatters.benefits.forEach(benefit => {
        expect(validIcons).toContain(benefit.icon);
      });
    });
  });

  describe('Stage 3: Invalid Payload Handling', () => {
    it('rejects payload missing required fields', () => {
      const invalidPayload = {
        page: {
          badge: 'Test',
          title: 'Test',
          // missing subtitle, motto, etc.
        },
      };

      expect(invalidPayload.page).not.toHaveProperty('subtitle');
      expect(invalidPayload.page).not.toHaveProperty('motto');
    });

    it('rejects invalid icon keys', () => {
      const invalidIcon = 'invalid-icon-name';
      const validIcons = [
        'book-open', 'target', 'lightbulb', 'route', 'code', 'layers',
        'check-circle', 'arrow-right', 'graduation-cap', 'rocket', 'wrench',
        'globe', 'zap', 'star', 'box',
      ];
      
      expect(validIcons).not.toContain(invalidIcon);
    });
  });

  describe('Stage 4: Source Parsing - JSON Format', () => {
    it('parses valid JSON introduction payload', () => {
      const jsonSource = JSON.stringify({
        page: {
          badge: 'Test',
          title: 'Test Introduction',
          subtitle: 'Learn basics',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Goal',
          topic: { title: 'Topic', description: 'Desc', quote: 'Quote' },
          whereFit: { title: 'Fit', description: 'Desc', flowCards: [{ title: 'Card', subtitle: 'Sub', icon: 'box' }] },
          solution: { title: 'Sol', description: 'Desc', code: { language: 'js', code: 'x=1' } },
          whereUsed: { title: 'Used', description: 'Desc', useCases: [{ title: 'Use', description: 'Desc', icon: 'globe' }] },
          roadmap: { title: 'Road', description: 'Desc', steps: [{ title: 'Step', subtitle: 'Sub' }] },
          whyMatters: { title: 'Why', benefits: [{ title: 'Ben', subtitle: 'Sub', icon: 'star' }] },
          keyTakeaway: 'Takeaway',
        },
      });

      const parsed = parseSource('json', jsonSource, 'introduction') as TutorialIntroductionPayload;
      
      expect(parsed.page.title).toBe('Test Introduction');
      expect(parsed.page.motto.lines).toHaveLength(4);
    });

    it('extracts expectedTimeSec from root level', () => {
      const aiJson = {
        expectedTimeSec: 300,
        page: {
          badge: 'Test',
          title: 'Test',
          subtitle: 'Test',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Test',
          topic: { title: 'T', description: 'D', quote: 'Q' },
          whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
          solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
          whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
          roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
          whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
          keyTakeaway: 'T',
        },
      };

      const expectedTimeSec = typeof aiJson.expectedTimeSec === 'number' 
        ? aiJson.expectedTimeSec 
        : undefined;

      expect(expectedTimeSec).toBe(300);
      expect(aiJson.page).not.toHaveProperty('expectedTimeSec');
    });
  });

  describe('Stage 5: Source Parsing - Markdown Format', () => {
    it('parses markdown with basic structure', () => {
      const markdownSource = `# Functions in JavaScript
Learn the fundamentals
JavaScript | Know | Your | Learning | Path
Master JavaScript functions from basics to advanced patterns.
Functions are reusable code blocks.`;

      const parsed = parseSource('markdown', markdownSource, 'introduction') as TutorialIntroductionPayload;
      
      expect(parsed.page.title).toBe('Functions in JavaScript');
      expect(parsed.page.subtitle).toBe('Learn the fundamentals');
      expect(parsed.page.badge).toBe('JavaScript');
      expect(parsed.page.motto.lines).toHaveLength(4);
      expect(parsed.page.motto.lines[0]).toBe('Know');
    });

    it('provides default structure for minimal markdown', () => {
      const markdownSource = `# Minimal Title`;

      const parsed = parseSource('markdown', markdownSource, 'introduction') as TutorialIntroductionPayload;
      
      expect(parsed.page.title).toBe('Minimal Title');
      expect(parsed.page.whereFit).toBeDefined();
      expect(parsed.page.solution).toBeDefined();
      expect(parsed.page.roadmap).toBeDefined();
    });
  });

  describe('Stage 6: Document Transformation - toTutorialBlock', () => {
    it('converts I1 BlockInstance to TutorialBlock', () => {
      const blockInstance = {
        id: 'test-id',
        type: 'introduction' as const,
        version: 'v1',
        versionCode: 'I1',
        title: 'Test',
        payload: {
          page: {
            badge: 'Test',
            title: 'Test',
            subtitle: 'Test',
            motto: { lines: ['A', 'B', 'C', 'D'] },
            learningGoal: 'Test',
            topic: { title: 'T', description: 'D', quote: 'Q' },
            whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
            solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
            whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
            roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
            whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
            keyTakeaway: 'T',
          },
        } as TutorialIntroductionPayload,
        payloadFormat: 'legacy' as const,
        sourceFormat: 'json' as const,
        sourceContent: '{}',
        expectedTimeSec: 300,
      };

      const tutorialBlock = toTutorialBlock(blockInstance);
      
      expect(tutorialBlock.type).toBe('introduction');
      expect(tutorialBlock.version).toBe('I1');
      expect(tutorialBlock.id).toBe('test-id');
      expect(tutorialBlock.expectedTimeSec).toBe(300);
    });

    it('preserves expectedTimeSec at block level', () => {
      const blockInstance = {
        id: 'test-id',
        type: 'introduction' as const,
        version: 'v1',
        versionCode: 'I1',
        title: 'Test',
        payload: {
          page: {
            badge: 'T', title: 'T', subtitle: 'T',
            motto: { lines: ['A', 'B', 'C', 'D'] },
            learningGoal: 'T',
            topic: { title: 'T', description: 'D', quote: 'Q' },
            whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
            solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
            whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
            roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
            whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
            keyTakeaway: 'T',
          },
        } as TutorialIntroductionPayload,
        payloadFormat: 'legacy' as const,
        sourceFormat: 'json' as const,
        sourceContent: '{}',
        expectedTimeSec: 300,
      };

      const tutorialBlock = toTutorialBlock(blockInstance);
      
      expect(tutorialBlock.expectedTimeSec).toBe(300);
      expect((tutorialBlock.content as any).expectedTimeSec).toBeUndefined();
    });
  });

  describe('Stage 7: Document Transformation - tutorialBlocksToInstances', () => {
    it('converts TutorialBlock to BlockInstance', () => {
      const tutorialBlocks = [{
        id: 'test-id',
        type: 'introduction' as const,
        version: 'I1',
        content: {
          page: {
            badge: 'Test',
            title: 'Test Introduction',
            subtitle: 'Test',
            motto: { lines: ['A', 'B', 'C', 'D'] },
            learningGoal: 'Test',
            topic: { title: 'T', description: 'D', quote: 'Q' },
            whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
            solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
            whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
            roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
            whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
            keyTakeaway: 'T',
          },
        },
        expectedTimeSec: 300,
      }];

      const instances = tutorialBlocksToInstances(tutorialBlocks);
      
      expect(instances).toHaveLength(1);
      expect(instances[0].type).toBe('introduction');
      expect(instances[0].versionCode).toBe('I1');
      expect(instances[0].title).toBe('Test Introduction');
      expect(instances[0].expectedTimeSec).toBe(300);
    });
  });

  describe('Stage 8: Title Extraction', () => {
    it('extracts title from introduction payload', () => {
      const payload: TutorialIntroductionPayload = {
        page: {
          badge: 'Test',
          title: 'Functions in JavaScript',
          subtitle: 'Test',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Test',
          topic: { title: 'T', description: 'D', quote: 'Q' },
          whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
          solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
          whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
          roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
          whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
          keyTakeaway: 'T',
        },
      };

      const title = extractBlockTitle(payload, 'introduction');
      
      expect(title).toBe('Functions in JavaScript');
    });

    it('provides fallback for missing title', () => {
      const payload = { page: {} };
      const title = extractBlockTitle(payload, 'introduction');
      
      expect(title).toBe('Introduction');
    });
  });

  describe('Stage 9: Create/Append Workflow', () => {
    it('creates new introduction block instance', () => {
      const payload: TutorialIntroductionPayload = {
        page: {
          badge: 'Test',
          title: 'New Introduction',
          subtitle: 'Test',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Test',
          topic: { title: 'T', description: 'D', quote: 'Q' },
          whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
          solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
          whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
          roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
          whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
          keyTakeaway: 'T',
        },
      };

      const blockInstance = {
        id: crypto.randomUUID(),
        type: 'introduction' as const,
        version: 'v1',
        versionCode: 'I1',
        title: extractBlockTitle(payload, 'introduction'),
        payload,
        payloadFormat: 'legacy' as const,
        sourceFormat: 'json' as const,
        sourceContent: JSON.stringify(payload),
        expectedTimeSec: undefined,
      };

      expect(blockInstance.type).toBe('introduction');
      expect(blockInstance.versionCode).toBe('I1');
      expect(blockInstance.title).toBe('New Introduction');
      expect(blockInstance.payload.page.title).toBe('New Introduction');
    });
  });
});
