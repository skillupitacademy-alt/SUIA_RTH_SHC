import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DefinitionBlock } from '../DefinitionBlock';
import { SummaryBlock } from '../SummaryBlock';
import { IntroductionBlock } from '../IntroductionBlock';
import type { IDefinitionBlock, ISummaryBlock, IIntroductionBlock, DomainTheme } from '../../types';

const themeA: DomainTheme = {
  primary: '#e11d48',
  secondary: '#0f172a',
  primaryDark: '#be123c',
};

const themeB: DomainTheme = {
  primary: '#0ea5e9',
  secondary: '#1e293b',
  primaryDark: '#0284c7',
};

describe('UBA Refactored Blocks Suite', () => {
  describe('DefinitionBlock (D1) with UBA Primitives', () => {
    const mockDefBlock: IDefinitionBlock = {
      id: 'def-test-1',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Core Concepts',
          title: 'Understanding Functions',
          intro: 'Functions are the fundamental building blocks in JavaScript.',
          definition: 'A function is a reusable set of statements designed to perform a task.',
          explanation: ['Functions help modularize code.', 'They reduce duplication.'],
          example: {
            language: 'javascript',
            code: 'function add(a, b) { return a + b; }',
          },
          characteristics: [
            { icon: 'star', title: 'Reusability', description: 'Write once, call multiple times.' },
            { icon: 'box', title: 'Modularity', description: 'Keeps programs organized.' },
          ],
          takeaway: 'Mastering functions is essential for mastering programming.',
        },
      },
    };

    it('renders with UBRC attributes using BlockShell', () => {
      const { container } = render(
        <DefinitionBlock block={mockDefBlock} theme={themeA} />
      );

      const shell = container.querySelector('article');
      expect(shell).not.toBeNull();
      expect(shell?.getAttribute('data-block-id')).toBe('def-test-1');
      expect(shell?.getAttribute('data-block-type')).toBe('definition');
      expect(shell?.getAttribute('data-block-version')).toBe('D1');
    });

    it('renders BlockHeader with eyebrow and title', () => {
      render(<DefinitionBlock block={mockDefBlock} theme={themeA} />);
      expect(screen.getByText('Core Concepts')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: 'Understanding Functions' })).toBeDefined();
      expect(screen.getByText(/Functions are the fundamental/)).toBeDefined();
    });

    it('proves dual-brand theme independence', () => {
      const { container: containerA } = render(
        <DefinitionBlock block={mockDefBlock} theme={themeA} />
      );
      const { container: containerB } = render(
        <DefinitionBlock block={mockDefBlock} theme={themeB} />
      );

      const articleA = containerA.querySelector('article');
      const articleB = containerB.querySelector('article');
      expect(articleA?.style.color).toBe('rgb(15, 23, 42)');
      expect(articleB?.style.color).toBe('rgb(30, 41, 59)');
    });
  });

  describe('SummaryBlock (S1) with UBA Primitives', () => {
    const mockSummaryBlock: ISummaryBlock = {
      id: 'sum-test-1',
      type: 'summary',
      version: 'S1',
      content: {
        page: {
          badge: 'MODULE REVIEW',
          title: 'JavaScript Fundamentals Summary',
          introduction: 'Quick recap of all topics covered in this module.',
        },
        summary: [
          { text: 'Variables store mutable and immutable data.' },
          { text: 'Loops repeat actions based on conditions.' },
        ],
        revisionTable: {
          columns: [
            { id: 'c1', title: 'Concept' },
            { id: 'c2', title: 'Key Point' },
          ],
          rows: [
            {
              concept: { name: 'Functions' },
              keyPoint: { title: 'Declaration', description: 'Re-usable logic block' },
            },
          ],
        },
        finalTip: {
          title: 'Pro Tip:',
          text: 'Practice writing functions every day.',
        },
      },
    };

    it('renders with UBRC attributes using BlockShell', () => {
      const { container } = render(
        <SummaryBlock block={mockSummaryBlock} theme={themeA} />
      );

      const shell = container.querySelector('article');
      expect(shell).not.toBeNull();
      expect(shell?.getAttribute('data-block-id')).toBe('sum-test-1');
      expect(shell?.getAttribute('data-block-type')).toBe('summary');
      expect(shell?.getAttribute('data-block-version')).toBe('S1');
    });

    it('renders BlockHeader and CalloutBanner for final tip', () => {
      render(<SummaryBlock block={mockSummaryBlock} theme={themeA} />);
      expect(screen.getByText('MODULE REVIEW')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: 'JavaScript Fundamentals Summary' })).toBeDefined();
      expect(screen.getByText('Pro Tip:')).toBeDefined();
      expect(screen.getByText('Practice writing functions every day.')).toBeDefined();
    });
  });

  describe('IntroductionBlock (I1) with UBA Primitives', () => {
    const mockIntroBlock: IIntroductionBlock = {
      id: 'intro-test-1',
      type: 'introduction',
      version: 'I1',
      content: {
        page: {
          badge: 'GETTING STARTED',
          title: 'Introduction to Web Architecture',
          subtitle: 'Learn how modern applications are structured from end to end.',
          motto: {
            lines: ['Dream Big', 'Work Hard', 'Stay Humble', 'Build Resilient Systems'],
          },
          learningGoal: 'Master key architectural principles and system boundaries.',
          topic: {
            title: 'System Foundations',
            description: 'Understanding component boundaries and lifecycle contracts.',
            quote: 'Simplicity is prerequisite for reliability.',
          },
          whereFit: {
            title: 'Where Does It Fit?',
            description: 'Positioning within modern application layers.',
            flowCards: [
              { title: 'Layer 1', subtitle: 'Core domain', icon: 'layers' },
              { title: 'Layer 2', subtitle: 'API services', icon: 'code' },
            ],
          },
          solution: {
            title: 'The Clean Solution',
            description: 'Separation of concerns through universal contracts.',
            code: { language: 'typescript', code: 'export interface Block {}' },
          },
          whereUsed: {
            title: 'Real-world Context',
            description: 'Industry applications.',
            useCases: [
              { title: 'Enterprise Apps', description: 'Micro-frontends', icon: 'globe' },
            ],
          },
          roadmap: {
            title: 'Learning Path',
            description: 'Step-by-step milestones.',
            steps: [
              { title: 'Foundations', subtitle: 'Basic primitives' },
              { title: 'Composition', subtitle: 'Block assemblies' },
            ],
          },
          whyMatters: {
            title: 'Why It Matters',
            benefits: [
              { title: 'Portability', subtitle: 'Reusable everywhere', icon: 'star' },
            ],
          },
          keyTakeaway: 'Universal Block Architecture unifies UX and reduces redundancy.',
        },
      },
    };

    it('renders with UBRC attributes using BlockShell', () => {
      const { container } = render(
        <IntroductionBlock block={mockIntroBlock} theme={themeA} />
      );

      const shell = container.querySelector('article');
      expect(shell).not.toBeNull();
      expect(shell?.getAttribute('data-block-id')).toBe('intro-test-1');
      expect(shell?.getAttribute('data-block-type')).toBe('introduction');
      expect(shell?.getAttribute('data-block-version')).toBe('I1');
    });

    it('renders title, subtitle, and motto', () => {
      render(<IntroductionBlock block={mockIntroBlock} theme={themeA} />);
      expect(screen.getByText('GETTING STARTED')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: 'Introduction to Web Architecture' })).toBeDefined();
      expect(screen.getByText(/Dream Big/)).toBeDefined();
    });
  });
});
