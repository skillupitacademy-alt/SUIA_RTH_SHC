// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TutorialRenderer } from '../TutorialRenderer';
import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import type {
  TutorialDocument,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  CodeBlock,
  TableBlock,
  ImageBlock,
  CalloutBlock,
  DefinitionBlock,
  ExampleBlock,
  QuoteBlock,
  SummaryBlock,
  DiagramBlock,
  ComparisonBlock,
  TwoColumnBlock,
  ThreeColumnBlock,
  CardGridBlock,
  TimelineBlock,
} from '@quiz/types';

describe('Universal Tutorial Renderer (Prompt 17D)', () => {
  // 1. Empty & Malformed Document Handling
  describe('Empty & Edge Case Handling', () => {
    it('renders accessible empty state when document has no blocks', () => {
      const emptyDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [],
      };
      render(<TutorialRenderer document={emptyDoc} sectionType="layman" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('No tutorial content is available yet.')).toBeInTheDocument();
      expect(screen.getByText(/Content for the "layman" section/)).toBeInTheDocument();
    });

    it('renders empty state when document is null or undefined', () => {
      render(<TutorialRenderer document={null} />);
      expect(screen.getByText('No tutorial content is available yet.')).toBeInTheDocument();
    });

    it('gracefully handles unknown block types without crashing', () => {
      const unknownBlock: any = {
        id: 'b-unknown',
        type: 'non_existent_custom_type',
        content: { text: 'custom' },
      };
      render(<TutorialBlockRenderer block={unknownBlock} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Unsupported or unrecognized block type/)).toBeInTheDocument();
    });
  });

  // 2. All 17 Canonical Content & Container Blocks
  describe('Canonical 17 Block Types', () => {
    it('1. heading: renders semantic h1-h6 with text escaping', () => {
      const heading: HeadingBlock = {
        id: 'b-h1',
        type: 'heading',
        content: { text: 'Introduction to Java', level: 1 },
      };
      render(<TutorialBlockRenderer block={heading} />);
      const headingEl = screen.getByRole('heading', { level: 1 });
      expect(headingEl).toBeInTheDocument();
      expect(headingEl).toHaveTextContent('Introduction to Java');
      expect(headingEl).toHaveAttribute('id', 'b-h1');
    });

    it('2. paragraph: renders semantic paragraph with text escaping', () => {
      const paragraph: ParagraphBlock = {
        id: 'b-p1',
        type: 'paragraph',
        content: { text: 'Java is a class-based, object-oriented programming language.' },
      };
      render(<TutorialBlockRenderer block={paragraph} />);
      expect(screen.getByText('Java is a class-based, object-oriented programming language.')).toBeInTheDocument();
    });

    it('3. list: renders ordered and unordered lists with nested items', () => {
      const list: ListBlock = {
        id: 'b-list1',
        type: 'list',
        content: {
          style: 'unordered',
          items: [
            { text: 'Object-Oriented' },
            {
              text: 'Platform Independent',
              children: [{ text: 'Write Once, Run Anywhere (WORA)' }],
            },
          ],
        },
      };
      render(<TutorialBlockRenderer block={list} />);
      expect(screen.getByText('Object-Oriented')).toBeInTheDocument();
      expect(screen.getByText('Platform Independent')).toBeInTheDocument();
      expect(screen.getByText('Write Once, Run Anywhere (WORA)')).toBeInTheDocument();
    });

    it('4. code: renders semantic pre/code with language data and caption', () => {
      const codeBlock: CodeBlock = {
        id: 'b-code1',
        type: 'code',
        content: {
          language: 'java',
          code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}',
          filename: 'Main.java',
          caption: 'Basic Java Entry Point',
          showLineNumbers: true,
        },
      };
      render(<TutorialBlockRenderer block={codeBlock} />);
      expect(screen.getByText('Main.java')).toBeInTheDocument();
      expect(screen.getByText('Basic Java Entry Point')).toBeInTheDocument();
      expect(screen.getByText(/public class Main/)).toBeInTheDocument();
    });

    it('5. table: renders accessible table with caption, thead, and tbody', () => {
      const table: TableBlock = {
        id: 'b-table1',
        type: 'table',
        content: {
          caption: 'JDK vs JRE vs JVM',
          hasHeader: true,
          columns: [
            { id: 'c1', label: 'Component', alignment: 'left' },
            { id: 'c2', label: 'Includes JVM?', alignment: 'center' },
          ],
          rows: [
            {
              id: 'r1',
              cells: [
                { columnId: 'c1', value: 'JDK' },
                { columnId: 'c2', value: 'Yes' },
              ],
            },
          ],
        },
      };
      render(<TutorialBlockRenderer block={table} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('JDK vs JRE vs JVM')).toBeInTheDocument();
      expect(screen.getByText('Component')).toBeInTheDocument();
      expect(screen.getByText('JDK')).toBeInTheDocument();
    });

    it('6. image: renders figure with alt text and caption', () => {
      const image: ImageBlock = {
        id: 'b-img1',
        type: 'image',
        content: {
          assetId: 'java-architecture-diagram.png',
          alt: 'Java Architecture Overview',
          caption: 'JVM, JRE and JDK Stack',
        },
      };
      render(<TutorialBlockRenderer block={image} />);
      const imgEl = screen.getByAltText('Java Architecture Overview');
      expect(imgEl).toBeInTheDocument();
      expect(screen.getByText('JVM, JRE and JDK Stack')).toBeInTheDocument();
    });

    it('7. callout: renders accessible callout with appropriate role', () => {
      const callout: CalloutBlock = {
        id: 'b-callout1',
        type: 'callout',
        content: {
          variant: 'tip',
          title: 'Best Practice',
          text: 'Always close database resources in a try-with-resources block.',
        },
      };
      render(<TutorialBlockRenderer block={callout} />);
      expect(screen.getByRole('note')).toBeInTheDocument();
      expect(screen.getByText('Best Practice')).toBeInTheDocument();
      expect(screen.getByText('Always close database resources in a try-with-resources block.')).toBeInTheDocument();
    });

    it('8. definition: renders semantic definition D1 elements', () => {
      const definition: any = {
        id: 'b-def1',
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            category: 'Core Concept',
            title: 'Bytecode',
            intro: 'Understanding Bytecode in Java runtime.',
            definition: 'A platform-independent intermediate representation of Java program code.',
            explanation: ['Compiled .class files contain bytecode executed by the JVM.'],
            characteristics: [
              { title: 'Portability', description: 'Write once run anywhere', icon: '🚀' }
            ],
            takeaway: 'Bytecode is executed by JVM.'
          }
        },
      };
      render(<TutorialBlockRenderer block={definition} />);
      expect(screen.getByText('Bytecode')).toBeInTheDocument();
      expect(screen.getByText('A platform-independent intermediate representation of Java program code.')).toBeInTheDocument();
      expect(screen.getByText(/Compiled \.class files/)).toBeInTheDocument();
    });

    it('9. example: renders walkthrough section with code and output', () => {
      const example: ExampleBlock = {
        id: 'b-ex1',
        type: 'example',
        content: {
          title: 'String Immutability Example',
          explanation: 'Demonstrating that strings cannot be modified in place.',
          code: 'String s = "Hello";\ns.concat(" World");',
          expectedOutput: 's is still "Hello"',
          notes: 'concat returns a new string instance.',
        },
      };
      render(<TutorialBlockRenderer block={example} />);
      expect(screen.getByText('String Immutability Example')).toBeInTheDocument();
      expect(screen.getByText('Demonstrating that strings cannot be modified in place.')).toBeInTheDocument();
      expect(screen.getByText(/s is still "Hello"/)).toBeInTheDocument();
    });

    it('10. quote: renders blockquote and citation', () => {
      const quote: QuoteBlock = {
        id: 'b-quote1',
        type: 'quote',
        content: {
          text: 'Write Once, Run Anywhere.',
          attribution: 'Sun Microsystems',
          source: 'Java 1.0 Release',
        },
      };
      render(<TutorialBlockRenderer block={quote} />);
      expect(screen.getByText(/"Write Once, Run Anywhere."/)).toBeInTheDocument();
      expect(screen.getByText('Sun Microsystems')).toBeInTheDocument();
      expect(screen.getByText('(Java 1.0 Release)')).toBeInTheDocument();
    });

    it('11. summary: renders key takeaways list', () => {
      const summary: SummaryBlock = {
        id: 'b-sum1',
        type: 'summary',
        content: {
          title: 'Chapter Review',
          points: ['Java is platform independent', 'Garbage collection is automatic'],
        },
      };
      render(<TutorialBlockRenderer block={summary} />);
      expect(screen.getByText('Chapter Review')).toBeInTheDocument();
      expect(screen.getByText('Java is platform independent')).toBeInTheDocument();
      expect(screen.getByText('Garbage collection is automatic')).toBeInTheDocument();
    });

    it('12. diagram: renders SVG and Mermaid with Option B safe text representation', () => {
      const svgDiagram: DiagramBlock = {
        id: 'b-diag1',
        type: 'diagram',
        content: {
          diagramType: 'svg',
          diagramData: '<svg><rect width="100" height="100"/></svg>',
          caption: 'SVG Architecture Representation',
          alt: 'Architecture Diagram',
        },
      };
      render(<TutorialBlockRenderer block={svgDiagram} />);
      expect(screen.getByRole('img', { name: 'Architecture Diagram' })).toBeInTheDocument();
      expect(screen.getByText('<svg><rect width="100" height="100"/></svg>')).toBeInTheDocument();
      expect(screen.getByText('SVG Architecture Representation')).toBeInTheDocument();

      const mermaidDiagram: DiagramBlock = {
        id: 'b-diag2',
        type: 'diagram',
        content: {
          diagramType: 'mermaid',
          diagramData: 'graph TD; A-->B;',
          caption: 'Process Flowchart',
        },
      };
      render(<TutorialBlockRenderer block={mermaidDiagram} />);
      expect(screen.getByText('graph TD; A-->B;')).toBeInTheDocument();
      expect(screen.getByText('Process Flowchart')).toBeInTheDocument();
    });

    it('13. comparison: renders comparison matrix table', () => {
      const comparison: ComparisonBlock = {
        id: 'b-comp1',
        type: 'comparison',
        content: {
          title: 'Java vs Python',
          entities: ['Java', 'Python'],
          features: [
            { name: 'Typing', values: ['Static', 'Dynamic'] },
            { name: 'Speed', values: ['Fast', 'Moderate'] },
          ],
          recommendation: 'Use Java for enterprise backends and Python for ML.',
        },
      };
      render(<TutorialBlockRenderer block={comparison} />);
      expect(screen.getByText('Java vs Python')).toBeInTheDocument();
      expect(screen.getByText('Typing')).toBeInTheDocument();
      expect(screen.getByText('Static')).toBeInTheDocument();
      expect(screen.getByText('Dynamic')).toBeInTheDocument();
      expect(screen.getByText(/Use Java for enterprise backends/)).toBeInTheDocument();
    });

    it('14. two-column: recursively renders left and right blocks', () => {
      const twoCol: TwoColumnBlock = {
        id: 'b-2col',
        type: 'two-column',
        content: {
          left: {
            blocks: [
              { id: 'b-left-h', type: 'heading', content: { text: 'Left Column', level: 3 } },
            ],
          },
          right: {
            blocks: [
              { id: 'b-right-p', type: 'paragraph', content: { text: 'Right Column Text' } },
            ],
          },
        },
      };
      render(<TutorialBlockRenderer block={twoCol} />);
      expect(screen.getByText('Left Column')).toBeInTheDocument();
      expect(screen.getByText('Right Column Text')).toBeInTheDocument();
    });

    it('15. three-column: recursively renders 3 column blocks', () => {
      const threeCol: ThreeColumnBlock = {
        id: 'b-3col',
        type: 'three-column',
        content: {
          columns: [
            { blocks: [{ id: 'b-c1', type: 'paragraph', content: { text: 'Col 1' } }] },
            { blocks: [{ id: 'b-c2', type: 'paragraph', content: { text: 'Col 2' } }] },
            { blocks: [{ id: 'b-c3', type: 'paragraph', content: { text: 'Col 3' } }] },
          ],
        },
      };
      render(<TutorialBlockRenderer block={threeCol} />);
      expect(screen.getByText('Col 1')).toBeInTheDocument();
      expect(screen.getByText('Col 2')).toBeInTheDocument();
      expect(screen.getByText('Col 3')).toBeInTheDocument();
    });

    it('16. card-grid: recursively renders card blocks', () => {
      const cardGrid: CardGridBlock = {
        id: 'b-cards',
        type: 'card-grid',
        content: {
          cards: [
            {
              id: 'card-1',
              title: 'Card 1 Title',
              blocks: [{ id: 'b-c1-p', type: 'paragraph', content: { text: 'Card 1 Content' } }],
            },
            {
              id: 'card-2',
              title: 'Card 2 Title',
              blocks: [{ id: 'b-c2-p', type: 'paragraph', content: { text: 'Card 2 Content' } }],
            },
          ],
        },
      };
      render(<TutorialBlockRenderer block={cardGrid} />);
      expect(screen.getByText('Card 1 Title')).toBeInTheDocument();
      expect(screen.getByText('Card 1 Content')).toBeInTheDocument();
      expect(screen.getByText('Card 2 Title')).toBeInTheDocument();
      expect(screen.getByText('Card 2 Content')).toBeInTheDocument();
    });

    it('17. timeline: recursively renders timeline item blocks', () => {
      const timeline: TimelineBlock = {
        id: 'b-timeline',
        type: 'timeline',
        content: {
          items: [
            {
              id: 't-item-1',
              title: 'Java 8',
              date: '2014',
              description: 'Introduced Lambdas and Streams',
              blocks: [{ id: 'b-t1-p', type: 'paragraph', content: { text: 'Major paradigm shift' } }],
            },
          ],
        },
      };
      render(<TutorialBlockRenderer block={timeline} />);
      expect(screen.getByText('Java 8')).toBeInTheDocument();
      expect(screen.getByText('2014')).toBeInTheDocument();
      expect(screen.getByText('Introduced Lambdas and Streams')).toBeInTheDocument();
      expect(screen.getByText('Major paradigm shift')).toBeInTheDocument();
    });
  });

  // 3. Recursive Depth Protection Test
  describe('Recursion Depth Protection (MAX_NESTING_DEPTH = 3)', () => {
    it('stops recursing and displays limit message when depth exceeds 3', () => {
      const deeplyNestedBlock: TwoColumnBlock = {
        id: 'b-deep',
        type: 'two-column',
        content: {
          left: { blocks: [{ id: 'b-leaf', type: 'paragraph', content: { text: 'Leaf' } }] },
          right: { blocks: [] },
        },
      };
      render(<TutorialBlockRenderer block={deeplyNestedBlock} depth={4} />);
      expect(screen.getByText(/Nesting depth limit reached \(4 > 3\)/)).toBeInTheDocument();
      expect(screen.queryByText('Leaf')).not.toBeInTheDocument();
    });
  });

  // 4. Security & XSS Adversarial Protection
  describe('Security & XSS Prevention (Zero HTML Injection)', () => {
    it('treats malicious <script> tags as pure text and does not execute or inject as DOM elements', () => {
      const maliciousParagraph: ParagraphBlock = {
        id: 'b-xss-1',
        type: 'paragraph',
        content: { text: '<script>alert("XSS Attack!")</script>' },
      };
      const { container } = render(<TutorialBlockRenderer block={maliciousParagraph} />);
      expect(screen.getByText('<script>alert("XSS Attack!")</script>')).toBeInTheDocument();
      expect(container.querySelectorAll('script').length).toBe(0);
    });

    it('treats malicious img onerror and javascript: URLs as pure text nodes', () => {
      const maliciousCallout: CalloutBlock = {
        id: 'b-xss-2',
        type: 'callout',
        content: {
          variant: 'danger',
          title: '<img src=x onerror=alert(1)>',
          text: 'javascript:alert(document.cookie)',
        },
      };
      const { container } = render(<TutorialBlockRenderer block={maliciousCallout} />);
      expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
      expect(screen.getByText('javascript:alert(document.cookie)')).toBeInTheDocument();
      expect(container.querySelectorAll('img').length).toBe(0);
    });

    it('renders malicious SVG payloads as escaped code text rather than active SVG DOM elements', () => {
      const maliciousSvg: DiagramBlock = {
        id: 'b-xss-3',
        type: 'diagram',
        content: {
          diagramType: 'svg',
          diagramData: '<svg onload="alert(1)"><script>evil()</script></svg>',
          alt: 'XSS Diagram',
        },
      };
      const { container } = render(<TutorialBlockRenderer block={maliciousSvg} />);
      expect(screen.getByText('<svg onload="alert(1)"><script>evil()</script></svg>')).toBeInTheDocument();
      expect(container.querySelectorAll('script').length).toBe(0);
    });
  });

  // 5. Complete TutorialDocument End-to-End Rendering
  describe('Complete TutorialDocument Integration', () => {
    it('renders a full multi-block tutorial document in sequential order', () => {
      const fullDoc: TutorialDocument = {
        schemaVersion: 1,
        metadata: {
          estimatedReadTime: 5,
          tags: ['java', 'beginner'],
          complexityScore: 2,
        },
        blocks: [
          {
            id: 'b-1',
            type: 'heading',
            content: { text: 'Complete Java Tutorial', level: 1 },
          },
          {
            id: 'b-2',
            type: 'paragraph',
            content: { text: 'Welcome to this comprehensive tutorial.' },
          },
          {
            id: 'b-3',
            type: 'callout',
            content: { variant: 'tip', text: 'Practice every code example!' },
          },
          {
            id: 'b-4',
            type: 'code',
            content: { language: 'java', code: 'System.out.println("Hello World");' },
          },
          {
            id: 'b-5',
            type: 'summary',
            content: { title: 'Summary', points: ['Lesson 1 completed'] },
          },
        ],
      };

      render(<TutorialRenderer document={fullDoc} sectionType="notes" />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Complete Java Tutorial');
      expect(screen.getByText('Welcome to this comprehensive tutorial.')).toBeInTheDocument();
      expect(screen.getByText('Practice every code example!')).toBeInTheDocument();
      expect(screen.getByText('System.out.println("Hello World");')).toBeInTheDocument();
      expect(screen.getByText('Lesson 1 completed')).toBeInTheDocument();
    });
  });
});
