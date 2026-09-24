/**
 * Tests for buildPublishedTutorialUrl utility
 * 
 * Verifies:
 * - Valid URL generation with all segments
 * - Error on missing/empty segments
 * - URL encoding of special characters
 * - navigationNodeId as final segment (identity contract)
 */

import { describe, it, expect } from 'vitest';
import { buildPublishedTutorialUrl } from '../buildPublishedTutorialUrl';

describe('buildPublishedTutorialUrl', () => {
  describe('Valid URL Generation', () => {
    it('should generate correct URL with all valid segments', () => {
      const url = buildPublishedTutorialUrl(
        'computer-science',
        'programming',
        'python',
        'fundamentals',
        'nav-node-123'
      );

      expect(url).toBe(
        'https://user.skillupitacademy.com/tutorial-v2/computer-science/programming/python/fundamentals/nav-node-123'
      );
    });

    it('should use navigationNodeId as final segment (not slug)', () => {
      const url = buildPublishedTutorialUrl(
        'domain',
        'subject',
        'topic',
        'subtopic',
        'abc-123-xyz'
      );

      expect(url.endsWith('/abc-123-xyz')).toBe(true);
    });

    it('should trim whitespace from segments', () => {
      const url = buildPublishedTutorialUrl(
        '  domain  ',
        '  subject  ',
        '  topic  ',
        '  subtopic  ',
        '  nav-node-123  '
      );

      expect(url).toBe(
        'https://user.skillupitacademy.com/tutorial-v2/domain/subject/topic/subtopic/nav-node-123'
      );
    });
  });

  describe('URL Encoding', () => {
    it('should encode special characters in segments', () => {
      const url = buildPublishedTutorialUrl(
        'computer science',
        'c++ programming',
        'data & algorithms',
        'intro/basics',
        'node-123'
      );

      expect(url).toContain('computer%20science');
      expect(url).toContain('c%2B%2B%20programming');
      expect(url).toContain('data%20%26%20algorithms');
      expect(url).toContain('intro%2Fbasics');
    });

    it('should handle unicode characters', () => {
      const url = buildPublishedTutorialUrl(
        'domäin',
        'subjéct',
        'tópic',
        'subtôpic',
        'node-123'
      );

      expect(url).toContain('dom%C3%A4in');
      expect(url).toContain('subj%C3%A9ct');
      expect(url).toContain('t%C3%B3pic');
      expect(url).toContain('subt%C3%B4pic');
    });
  });

  describe('Error Handling - Missing Segments', () => {
    it('should throw error when domainSlug is missing', () => {
      expect(() =>
        buildPublishedTutorialUrl('', 'subject', 'topic', 'subtopic', 'node-123')
      ).toThrow('Incomplete tutorial navigation identity.');
    });

    it('should throw error when subjectSlug is missing', () => {
      expect(() =>
        buildPublishedTutorialUrl('domain', '', 'topic', 'subtopic', 'node-123')
      ).toThrow('Incomplete tutorial navigation identity.');
    });

    it('should throw error when topicSlug is missing', () => {
      expect(() =>
        buildPublishedTutorialUrl('domain', 'subject', '', 'subtopic', 'node-123')
      ).toThrow('Incomplete tutorial navigation identity.');
    });

    it('should throw error when subtopicSlug is missing', () => {
      expect(() =>
        buildPublishedTutorialUrl('domain', 'subject', 'topic', '', 'node-123')
      ).toThrow('Incomplete tutorial navigation identity.');
    });

    it('should throw error when navigationNodeId is missing', () => {
      expect(() =>
        buildPublishedTutorialUrl('domain', 'subject', 'topic', 'subtopic', '')
      ).toThrow('Incomplete tutorial navigation identity.');
    });

    it('should throw error when segment is only whitespace', () => {
      expect(() =>
        buildPublishedTutorialUrl('domain', 'subject', '   ', 'subtopic', 'node-123')
      ).toThrow('Incomplete tutorial navigation identity.');
    });

    it('should throw error when segment is null/undefined (via type coercion)', () => {
      expect(() =>
        buildPublishedTutorialUrl('domain', 'subject', 'topic', 'subtopic', null as any)
      ).toThrow('Incomplete tutorial navigation identity.');
    });
  });

  describe('Identity Contract', () => {
    it('should maintain exact segment order: domain/subject/topic/subtopic/navigationNodeId', () => {
      const url = buildPublishedTutorialUrl(
        'D',
        'S',
        'T',
        'ST',
        'N'
      );

      const segments = url.split('/');
      expect(segments[segments.length - 5]).toBe('D');
      expect(segments[segments.length - 4]).toBe('S');
      expect(segments[segments.length - 3]).toBe('T');
      expect(segments[segments.length - 2]).toBe('ST');
      expect(segments[segments.length - 1]).toBe('N');
    });

    it('should use navigationNodeId as system identity (final segment)', () => {
      const nodeId = 'system-id-12345';
      const url = buildPublishedTutorialUrl(
        'domain',
        'subject',
        'topic',
        'subtopic',
        nodeId
      );

      expect(url.endsWith(`/${nodeId}`)).toBe(true);
    });

    it('should generate consistent URLs for same inputs', () => {
      const url1 = buildPublishedTutorialUrl('d', 's', 't', 'st', 'n');
      const url2 = buildPublishedTutorialUrl('d', 's', 't', 'st', 'n');

      expect(url1).toBe(url2);
    });
  });

  describe('Base URL', () => {
    it('should use production learner URL base', () => {
      const url = buildPublishedTutorialUrl(
        'domain',
        'subject',
        'topic',
        'subtopic',
        'node-123'
      );

      expect(url.startsWith('https://user.skillupitacademy.com/tutorial-v2/')).toBe(true);
    });
  });
});
