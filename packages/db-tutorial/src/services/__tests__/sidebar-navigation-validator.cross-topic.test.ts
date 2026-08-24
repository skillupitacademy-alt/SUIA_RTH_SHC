/**
 * Sidebar Navigation Validator - Cross-Topic Isolation Tests
 * 
 * CRITICAL: Validates that the validator uses the correct topic bridge
 * and prevents cross-topic contamination (Java subtopic + Python page)
 * 
 * Architecture tested:
 * subtopic.topic_id → topic.id → topic.external_id → sidebar.topic_id
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SidebarNavigationValidatorService } from '../sidebar-navigation-validator.service';
import { getTutorialDb } from '../../db';

const db = getTutorialDb();

describe('SidebarNavigationValidator - Cross-Topic Isolation', () => {
  let javaSubtopicId: string;
  let pythonSubtopicId: string | null = null;

  beforeAll(async () => {
    // Get the canonical "What is Java?" subtopic
    const javaSubtopic = await db.query.tutorialSubtopics.findFirst({
      where: (subtopics, { eq, and, isNull }) => 
        and(
          eq(subtopics.name, 'What is Java?'),
          eq(subtopics.slug, 'whatisjava'),
          isNull(subtopics.deletedAt)
        ),
    });

    if (!javaSubtopic) {
      throw new Error('Java subtopic "What is Java?" not found. Run creation script first.');
    }

    javaSubtopicId = javaSubtopic.id;

    // Try to get a Python subtopic (if exists)
    const pythonSubtopic = await db.query.tutorialSubtopics.findFirst({
      where: (subtopics, { eq, and, isNull }) =>
        and(
          eq(subtopics.name, 'Complete Python'),
          isNull(subtopics.deletedAt)
        ),
    });

    if (pythonSubtopic) {
      pythonSubtopicId = pythonSubtopic.id;
    }
  });

  describe('POSITIVE: Valid Java Subtopic + Java Page', () => {
    it('should ACCEPT Java subtopic with "what-is-java" page', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'what-is-java',
        'shared'
      );

      expect(result.isValid).toBe(true);
      expect(result.node).toBeDefined();
      expect(result.node?.id).toBe('what-is-java');
      expect(result.node?.type).toBe('page');
    });

    it('should ACCEPT Java subtopic with "java-syntax" page', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'java-syntax',
        'shared'
      );

      expect(result.isValid).toBe(true);
      expect(result.node).toBeDefined();
      expect(result.node?.id).toBe('java-syntax');
      expect(result.node?.type).toBe('page');
    });

    it('should ACCEPT Java subtopic with "primitive-data-types" page', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'primitive-data-types',
        'shared'
      );

      expect(result.isValid).toBe(true);
      expect(result.node).toBeDefined();
      expect(result.node?.id).toBe('primitive-data-types');
      expect(result.node?.type).toBe('page');
    });
  });

  describe('NEGATIVE: Cross-Topic Contamination', () => {
    it('should REJECT Java subtopic with Python page "introduction-to-python"', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'introduction-to-python',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
      expect(result.reason).toMatch(/Java/i);
    });

    it('should REJECT Java subtopic with Python page "syntax-and-semantics"', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'syntax-and-semantics',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should REJECT Java subtopic with Python page "variables-and-data-types"', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'variables-and-data-types',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should REJECT Python subtopic with Java page "what-is-java"', async () => {
      if (!pythonSubtopicId) {
        console.log('⚠️  Skipping Python→Java test: No Python subtopic exists');
        return;
      }

      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        pythonSubtopicId,
        'what-is-java',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
      expect(result.reason).toMatch(/Python/i);
    });

    it('should REJECT Python subtopic with Java page "java-syntax"', async () => {
      if (!pythonSubtopicId) {
        console.log('⚠️  Skipping Python→Java test: No Python subtopic exists');
        return;
      }

      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        pythonSubtopicId,
        'java-syntax',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });

  describe('NEGATIVE: Invalid Node Types', () => {
    it('should REJECT Java subtopic with group node "java-fundamentals"', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'java-fundamentals',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('type');
      expect(result.reason).toContain('group');
    });

    it('should REJECT Java subtopic with root node "java"', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'java',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('type');
      expect(result.reason).toContain('group');
    });
  });

  describe('NEGATIVE: Nonexistent Nodes', () => {
    it('should REJECT Java subtopic with nonexistent page "does-not-exist"', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'does-not-exist',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should REJECT Java subtopic with empty navigationNodeId', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        '',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });

  describe('NEGATIVE: Missing Subtopic', () => {
    it('should REJECT nonexistent subtopic UUID', async () => {
      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        '00000000-0000-0000-0000-000000000000',
        'what-is-java',
        'shared'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Subtopic not found');
    });
  });

  describe('ARCHITECTURE: Topic Bridge Verification', () => {
    it('should use topic.external_id → sidebar.topic_id bridge (not direct topic_id)', async () => {
      // This test verifies the architecture indirectly:
      // If validator used subtopic.topic_id === sidebar.topic_id, 
      // it would not find the correct sidebar (those UUIDs don't match).
      // 
      // The fact that Java subtopic + Java page PASSES proves the validator
      // correctly resolves through: topic.id → topic.external_id → sidebar.topic_id

      const result = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'what-is-java',
        'shared'
      );

      // If this passes, the validator used the correct bridge
      expect(result.isValid).toBe(true);
      
      // And cross-topic rejection proves it's topic-specific, not brand-wide
      const crossTopicResult = await SidebarNavigationValidatorService.validateNavigationNode(
        javaSubtopicId,
        'introduction-to-python',
        'shared'
      );

      expect(crossTopicResult.isValid).toBe(false);
    });
  });
});
