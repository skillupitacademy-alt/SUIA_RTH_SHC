/**
 * Test: Introduction I1 Block Fixtures
 * Validates that test fixtures conform to I1 schema
 */

import { describe, it, expect } from 'vitest';
import { IntroductionI1BlockSchema } from '../schemas/introduction-i1.schema';
import {
  introductionI1Fixture,
  introductionI1MinimalFixture,
  introductionI1MaximalFixture,
} from './fixtures/introduction-i1.fixture';

describe('Introduction I1 Fixtures', () => {
  describe('introductionI1Fixture', () => {
    it('should conform to I1 schema', () => {
      const result = IntroductionI1BlockSchema.safeParse(introductionI1Fixture);
      if (!result.success) {
        console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
      }
      expect(result.success).toBe(true);
    });

    it('should have correct structure', () => {
      expect(introductionI1Fixture.type).toBe('introduction');
      expect(introductionI1Fixture.version).toBe('I1');
      expect(introductionI1Fixture.content.page.motto.lines).toHaveLength(4);
      expect(introductionI1Fixture.content.page.title).toBe('Functions in JavaScript');
    });

    it('should have valid collections within bounds', () => {
      const page = introductionI1Fixture.content.page;
      
      expect(page.whereFit.flowCards.length).toBeGreaterThanOrEqual(1);
      expect(page.whereFit.flowCards.length).toBeLessThanOrEqual(10);
      
      expect(page.whereUsed.useCases.length).toBeGreaterThanOrEqual(1);
      expect(page.whereUsed.useCases.length).toBeLessThanOrEqual(10);
      
      expect(page.roadmap.steps.length).toBeGreaterThanOrEqual(1);
      expect(page.roadmap.steps.length).toBeLessThanOrEqual(20);
      
      expect(page.whyMatters.benefits.length).toBeGreaterThanOrEqual(1);
      expect(page.whyMatters.benefits.length).toBeLessThanOrEqual(10);
    });

    it('should use valid icon keys', () => {
      const validIcons = [
        'book-open', 'target', 'lightbulb', 'route', 'code',
        'layers', 'check-circle', 'arrow-right', 'graduation-cap',
        'rocket', 'wrench', 'globe', 'zap', 'star', 'box',
      ];

      const page = introductionI1Fixture.content.page;

      page.whereFit.flowCards.forEach(card => {
        expect(validIcons).toContain(card.icon);
      });

      page.whereUsed.useCases.forEach(useCase => {
        expect(validIcons).toContain(useCase.icon);
      });

      page.whyMatters.benefits.forEach(benefit => {
        expect(validIcons).toContain(benefit.icon);
      });
    });
  });

  describe('introductionI1MinimalFixture', () => {
    it('should conform to I1 schema', () => {
      const result = IntroductionI1BlockSchema.safeParse(introductionI1MinimalFixture);
      expect(result.success).toBe(true);
    });

    it('should use minimum collection sizes', () => {
      const page = introductionI1MinimalFixture.content.page;
      expect(page.whereFit.flowCards).toHaveLength(1);
      expect(page.whereUsed.useCases).toHaveLength(1);
      expect(page.roadmap.steps).toHaveLength(1);
      expect(page.whyMatters.benefits).toHaveLength(1);
    });
  });

  describe('introductionI1MaximalFixture', () => {
    it('should conform to I1 schema', () => {
      const result = IntroductionI1BlockSchema.safeParse(introductionI1MaximalFixture);
      expect(result.success).toBe(true);
    });

    it('should use maximum collection sizes', () => {
      const page = introductionI1MaximalFixture.content.page;
      expect(page.whereFit.flowCards).toHaveLength(10);
      expect(page.whereUsed.useCases).toHaveLength(10);
      expect(page.roadmap.steps).toHaveLength(20);
      expect(page.whyMatters.benefits).toHaveLength(10);
    });

    it('should not exceed maximum bounds', () => {
      const page = introductionI1MaximalFixture.content.page;
      expect(page.whereFit.flowCards.length).toBeLessThanOrEqual(10);
      expect(page.whereUsed.useCases.length).toBeLessThanOrEqual(10);
      expect(page.roadmap.steps.length).toBeLessThanOrEqual(20);
      expect(page.whyMatters.benefits.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Fixture Content Quality', () => {
    it('should have exactly 4 motto lines', () => {
      expect(introductionI1Fixture.content.page.motto.lines).toEqual([
        'Know',
        'Your Path.',
        'Learn with',
        'Purpose.',
      ]);
    });

    it('should have meaningful content', () => {
      const page = introductionI1Fixture.content.page;
      expect(page.subtitle.length).toBeGreaterThan(10);
      expect(page.learningGoal.length).toBeGreaterThan(20);
      expect(page.keyTakeaway.length).toBeGreaterThan(20);
    });

    it('should have complete sections', () => {
      const page = introductionI1Fixture.content.page;
      expect(page.badge).toBeTruthy();
      expect(page.title).toBeTruthy();
      expect(page.topic.title).toBeTruthy();
      expect(page.topic.quote).toBeTruthy();
      expect(page.solution.code.code).toBeTruthy();
    });
  });
});
