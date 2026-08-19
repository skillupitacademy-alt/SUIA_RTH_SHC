/**
 * AI Context Builder Tests
 * 
 * Verifies Phase 1E implementation:
 * - Valid selection → valid context
 * - Missing IDs → error
 * - Missing names → error
 * - Hierarchy isolation (no brandId, theme, blockId, etc.)
 * - Source selection remains untouched
 */

import { describe, it, expect } from 'vitest';
import { buildDefinitionD1AIContext, type ComposerSelection } from '../ai-context-builder';

describe('buildDefinitionD1AIContext', () => {
  const validSelection: ComposerSelection = {
    domainId: 'domain-001',
    domainName: 'Full Stack Development',
    subjectId: 'subject-001',
    subjectName: 'Backend Development',
    topicId: 'topic-001',
    topicName: 'Python',
    subtopicId: 'subtopic-001',
    subtopicName: 'What Is a Variable?',
    skillIds: ['skill-001', 'skill-002'],
  };

  describe('Valid Selection', () => {
    it('should build valid AI context from complete selection', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).toBeDefined();
      expect(context.context).toBeDefined();
      expect(context.block).toBeDefined();
      expect(context.output).toBeDefined();
    });

    it('should include all hierarchy IDs in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context.context.domainId).toBe('domain-001');
      expect(context.context.subjectId).toBe('subject-001');
      expect(context.context.topicId).toBe('topic-001');
      expect(context.context.subtopicId).toBe('subtopic-001');
    });

    it('should include all hierarchy names in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context.context.domainName).toBe('Full Stack Development');
      expect(context.context.subjectName).toBe('Backend Development');
      expect(context.context.topicName).toBe('Python');
      expect(context.context.subtopicName).toBe('What Is a Variable?');
    });

    it('should set block type to definition', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context.block.type).toBe('definition');
    });

    it('should set block version to D1', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context.block.version).toBe('D1');
    });

    it('should set output format to json', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context.output.format).toBe('json');
    });

    it('should set output root key to page', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context.output.rootKey).toBe('page');
    });
  });

  describe('Missing IDs', () => {
    it('should throw if domainId is null', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        domainId: null,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy selection is required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/domainId/);
    });

    it('should throw if subjectId is null', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        subjectId: null,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy selection is required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/subjectId/);
    });

    it('should throw if topicId is null', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        topicId: null,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy selection is required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/topicId/);
    });

    it('should throw if subtopicId is null', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        subtopicId: null,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy selection is required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/subtopicId/);
    });

    it('should throw if multiple IDs are missing', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        domainId: null,
        subjectId: null,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy selection is required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/domainId/);
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/subjectId/);
    });
  });

  describe('Missing Names', () => {
    it('should throw if domainName is undefined', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        domainName: undefined,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy names are required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/domainName/);
    });

    it('should throw if subjectName is undefined', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        subjectName: undefined,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy names are required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/subjectName/);
    });

    it('should throw if topicName is undefined', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        topicName: undefined,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy names are required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/topicName/);
    });

    it('should throw if subtopicName is undefined', () => {
      const selection: ComposerSelection = {
        ...validSelection,
        subtopicName: undefined,
      };

      expect(() => buildDefinitionD1AIContext(selection)).toThrow(
        /Complete hierarchy names are required/
      );
      expect(() => buildDefinitionD1AIContext(selection)).toThrow(/subtopicName/);
    });
  });

  describe('Hierarchy Isolation', () => {
    it('should not include skillIds in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).not.toHaveProperty('skillIds');
      expect(context.context).not.toHaveProperty('skillIds');
    });

    it('should not include brandId in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).not.toHaveProperty('brandId');
      expect(context.context).not.toHaveProperty('brandId');
    });

    it('should not include theme in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).not.toHaveProperty('theme');
      expect(context.context).not.toHaveProperty('theme');
    });

    it('should not include blockId in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).not.toHaveProperty('blockId');
      expect(context.context).not.toHaveProperty('blockId');
    });

    it('should not include schemaVersion in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).not.toHaveProperty('schemaVersion');
      expect(context.context).not.toHaveProperty('schemaVersion');
    });

    it('should not include metadata in context', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      expect(context).not.toHaveProperty('metadata');
      expect(context.context).not.toHaveProperty('metadata');
    });

    it('should only include hierarchy context, block spec, and output format', () => {
      const context = buildDefinitionD1AIContext(validSelection);

      const keys = Object.keys(context);
      expect(keys).toEqual(['context', 'block', 'output']);
    });
  });

  describe('Source Selection Immutability', () => {
    it('should not mutate source selection', () => {
      const selection: ComposerSelection = { ...validSelection };
      const original = JSON.parse(JSON.stringify(selection));

      buildDefinitionD1AIContext(selection);

      expect(selection).toEqual(original);
    });

    it('should not modify skillIds array', () => {
      const skillIds = ['skill-001', 'skill-002'];
      const selection: ComposerSelection = {
        ...validSelection,
        skillIds,
      };

      buildDefinitionD1AIContext(selection);

      expect(selection.skillIds).toBe(skillIds);
      expect(selection.skillIds).toEqual(['skill-001', 'skill-002']);
    });
  });

  describe('Multiple Subtopics (Same UI, Different Content)', () => {
    it('should generate different context for different subtopics', () => {
      const selection1: ComposerSelection = {
        ...validSelection,
        subtopicId: 'subtopic-001',
        subtopicName: 'What Is a Variable?',
      };

      const selection2: ComposerSelection = {
        ...validSelection,
        subtopicId: 'subtopic-002',
        subtopicName: 'What Is a Function?',
      };

      const context1 = buildDefinitionD1AIContext(selection1);
      const context2 = buildDefinitionD1AIContext(selection2);

      expect(context1.context.subtopicId).not.toBe(context2.context.subtopicId);
      expect(context1.context.subtopicName).not.toBe(context2.context.subtopicName);
      expect(context1.block.type).toBe(context2.block.type);
      expect(context1.block.version).toBe(context2.block.version);
    });

    it('should maintain same block specification for all subtopics', () => {
      const selections = [
        { ...validSelection, subtopicId: 'sub-001', subtopicName: 'What Is a Variable?' },
        { ...validSelection, subtopicId: 'sub-002', subtopicName: 'What Is a Function?' },
        { ...validSelection, subtopicId: 'sub-003', subtopicName: 'What Is a Class?' },
      ];

      const contexts = selections.map(buildDefinitionD1AIContext);

      contexts.forEach((context) => {
        expect(context.block.type).toBe('definition');
        expect(context.block.version).toBe('D1');
        expect(context.output.format).toBe('json');
        expect(context.output.rootKey).toBe('page');
      });
    });
  });
});
