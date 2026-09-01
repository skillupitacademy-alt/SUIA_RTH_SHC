/**
 * Phase 2 DOM Block Identity Test
 * Verifies that all canonical blocks expose data-block-id and data-block-type
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { HeadingBlock } from '../blocks/HeadingBlock';
import { ParagraphBlock } from '../blocks/ParagraphBlock';
import { ListBlock } from '../blocks/ListBlock';
import { TableBlock } from '../blocks/TableBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { CalloutBlock } from '../blocks/CalloutBlock';
import { ExampleBlock } from '../blocks/ExampleBlock';
import { QuoteBlock } from '../blocks/QuoteBlock';
import { SummaryBlock } from '../blocks/SummaryBlock';
import { DiagramBlock } from '../blocks/DiagramBlock';
import { ComparisonBlock } from '../blocks/ComparisonBlock';
import { TwoColumnBlock } from '../blocks/TwoColumnBlock';
import { ThreeColumnBlock } from '../blocks/ThreeColumnBlock';
import { CardGridBlock } from '../blocks/CardGridBlock';
import { TimelineBlock } from '../blocks/TimelineBlock';
import { CodeC1Block } from '../blocks/CodeC1Block';
import { DefinitionBlock } from '../blocks/DefinitionBlock';

describe('Phase 2 - DOM Block Identity', () => {
  describe('Unversioned Blocks', () => {
    it('HeadingBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <HeadingBlock
          block={{
            id: 'heading-123',
            type: 'heading',
            content: { text: 'Test Heading', level: 1 },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="heading-123"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('heading');
      expect(element?.getAttribute('data-block-version')).toBeNull(); // No version
    });

    it('ParagraphBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <ParagraphBlock
          block={{
            id: 'para-456',
            type: 'paragraph',
            content: { text: 'Test paragraph' },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="para-456"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('paragraph');
    });

    it('ListBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <ListBlock
          block={{
            id: 'list-789',
            type: 'list',
            content: { style: 'unordered', items: [{ text: 'Item 1' }] },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="list-789"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('list');
    });

    it('TableBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <TableBlock
          block={{
            id: 'table-001',
            type: 'table',
            content: {
              columns: [{ id: 'col1', label: 'Column 1' }],
              rows: [{ id: 'row1', cells: [{ columnId: 'col1', value: 'Value 1' }] }],
            },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="table-001"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('table');
    });

    it('ImageBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <ImageBlock
          block={{
            id: 'image-002',
            type: 'image',
            content: { assetId: 'test.jpg', alt: 'Test image' },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="image-002"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('image');
    });

    it('CalloutBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <CalloutBlock
          block={{
            id: 'callout-003',
            type: 'callout',
            content: { variant: 'info', text: 'Test callout' },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="callout-003"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('callout');
    });

    it('ExampleBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <ExampleBlock
          block={{
            id: 'example-004',
            type: 'example',
            content: { explanation: 'Test example', code: 'test()' },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="example-004"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('example');
    });

    it('QuoteBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <QuoteBlock
          block={{
            id: 'quote-005',
            type: 'quote',
            content: { text: 'Test quote', attribution: 'Author' },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="quote-005"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('quote');
    });

    it('SummaryBlock: exposes data-block-id and data-block-type (no version)', () => {
      const { container } = render(
        <SummaryBlock
          block={{
            id: 'summary-006',
            type: 'summary',
            content: { 
              title: 'Test Summary',
              points: ['Point 1', 'Point 2'] 
            },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="summary-006"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('summary');
      expect(element?.getAttribute('data-block-version')).toBeNull(); // Unversioned
    });

    it('DiagramBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <DiagramBlock
          block={{
            id: 'diagram-007',
            type: 'diagram',
            content: { diagramType: 'svg', diagramData: '<svg></svg>' },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="diagram-007"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('diagram');
    });

    it('ComparisonBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <ComparisonBlock
          block={{
            id: 'comparison-008',
            type: 'comparison',
            content: {
              entities: ['A', 'B'],
              features: [{ name: 'Feature 1', values: ['Value A', 'Value B'] }],
            },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="comparison-008"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('comparison');
    });
  });

  describe('Container Blocks', () => {
    const mockRenderChild = () => <div data-testid="child-block">Child</div>;

    it('TwoColumnBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <TwoColumnBlock
          block={{
            id: 'two-col-009',
            type: 'two-column',
            content: { left: { blocks: [] }, right: { blocks: [] } },
          }}
          renderChild={mockRenderChild}
        />
      );
      const element = container.querySelector('[data-block-id="two-col-009"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('two-column');
    });

    it('ThreeColumnBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <ThreeColumnBlock
          block={{
            id: 'three-col-010',
            type: 'three-column',
            content: { columns: [{ blocks: [] }, { blocks: [] }, { blocks: [] }] },
          }}
          renderChild={mockRenderChild}
        />
      );
      const element = container.querySelector('[data-block-id="three-col-010"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('three-column');
    });

    it('CardGridBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <CardGridBlock
          block={{
            id: 'card-grid-011',
            type: 'card-grid',
            content: { 
              cards: [{ 
                id: 'card-1',
                title: 'Card 1',
                blocks: [] 
              }] 
            },
          }}
          renderChild={mockRenderChild}
        />
      );
      const element = container.querySelector('[data-block-id="card-grid-011"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('card-grid');
    });

    it('TimelineBlock: exposes data-block-id and data-block-type', () => {
      const { container } = render(
        <TimelineBlock
          block={{
            id: 'timeline-012',
            type: 'timeline',
            content: { 
              items: [{ 
                id: 'item-1',
                title: 'Item 1' 
              }] 
            },
          }}
          renderChild={mockRenderChild}
        />
      );
      const element = container.querySelector('[data-block-id="timeline-012"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('timeline');
    });
  });

  describe('Versioned Blocks', () => {
    it('CodeC1Block: exposes data-block-id, data-block-type, and data-block-version', () => {
      const { container } = render(
        <CodeC1Block
          block={{
            id: 'code-c1-013',
            type: 'code',
            version: 'C1',
            content: {
              page: {
                type: 'code',
                title: 'Test Code',
                introduction: 'Test introduction',
                language: 'javascript',
                code: 'console.log("test")',
                filename: 'test.js',
                explanation: [],
                takeaway: 'Test takeaway',
                memoryModel: {
                  columns: [],
                  nodes: [],
                },
              },
            },
          }}
        />
      );
      const element = container.querySelector('[data-block-id="code-c1-013"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('code');
      expect(element?.getAttribute('data-block-version')).toBe('C1');
    });

    it('DefinitionBlock: exposes data-block-id, data-block-type, and data-block-version', () => {
      const mockTheme = {
        primary: '#3b82f6',
        secondary: '#1e40af',
      };

      const { container } = render(
        <DefinitionBlock
          block={{
            id: 'def-d1-014',
            type: 'definition',
            version: 'D1',
            content: {
              page: {
                type: 'definition',
                category: 'General',
                title: 'Test Term',
                intro: 'Test intro',
                definition: 'Test definition',
                explanation: [],
                example: {
                  language: 'javascript',
                  code: 'const test = true;',
                },
                characteristics: [],
                takeaway: 'Test takeaway',
              },
            },
          }}
          theme={mockTheme}
        />
      );
      const element = container.querySelector('[data-block-id="def-d1-014"]');
      expect(element).toBeTruthy();
      expect(element?.getAttribute('data-block-type')).toBe('definition');
      expect(element?.getAttribute('data-block-version')).toBe('D1');
    });
  });

  describe('DOM Identity Contract', () => {
    it('Does not expose sensitive learner data in DOM', () => {
      const { container } = render(
        <ParagraphBlock
          block={{
            id: 'para-security-test',
            type: 'paragraph',
            content: { text: 'Security test' },
          }}
          runtimeContext={{
            learnerId: 'learner-123',
            navigationNodeId: 'node-456',
            sectionId: 'section-789',
            blockId: 'para-security-test',
            blockType: 'paragraph',
            blockVersion: '',
            subtopicId: 'subtopic-001',
          }}
        />
      );

      // Verify sensitive data is NOT in DOM attributes
      const element = container.querySelector('[data-block-id="para-security-test"]');
      expect(element?.getAttribute('data-learner-id')).toBeNull();
      expect(element?.getAttribute('data-user-id')).toBeNull();
      expect(element?.getAttribute('data-session-id')).toBeNull();
      expect(element?.getAttribute('data-navigation-node-id')).toBeNull();

      // Verify only block identity is exposed
      expect(element?.getAttribute('data-block-id')).toBe('para-security-test');
      expect(element?.getAttribute('data-block-type')).toBe('paragraph');
    });
  });
});
