/**
 * Unit Tests for Tutorial Import Service and Parsers (Prompt 05)
 */

import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../parsers/markdown-parser';
import { HtmlParser } from '../parsers/html-parser';
import { PlainTextParser } from '../parsers/plain-text-parser';
import { tutorialImportService } from '../tutorial-import.service';
import { TutorialDocumentSchema, TutorialDocumentValidationError } from '@quiz/types';

describe('Prompt 05: Raw Content Import Pipeline', () => {
  describe('MarkdownParser', () => {
    const parser = new MarkdownParser();

    it('parses headings, paragraphs, lists, code, and blockquotes', () => {
      const markdown = `# JavaScript Overview

JavaScript is a versatile programming language.

## 1. Core Features

- First-class functions
- Prototype-based OOP
- Event-driven runtime

\`\`\`typescript
const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};
\`\`\`

> Important note about asynchronous execution.`;

      const result = parser.parse(markdown, { extractTitle: true });

      expect(result.extractedTitle).toBe('JavaScript Overview');
      expect(result.blocks.length).toBe(6);

      // 1. Heading 1
      expect(result.blocks[0]).toMatchObject({
        type: 'heading',
        content: { text: 'JavaScript Overview', level: 1 },
      });

      // 2. Paragraph
      expect(result.blocks[1]).toMatchObject({
        type: 'paragraph',
        content: { text: 'JavaScript is a versatile programming language.' },
      });

      // 3. Heading 2
      expect(result.blocks[2]).toMatchObject({
        type: 'heading',
        content: { text: '1. Core Features', level: 2 },
      });

      // 4. List
      expect(result.blocks[3]).toMatchObject({
        type: 'list',
        content: {
          style: 'unordered',
          items: [
            { text: 'First-class functions' },
            { text: 'Prototype-based OOP' },
            { text: 'Event-driven runtime' },
          ],
        },
      });

      // 5. Code Block
      expect(result.blocks[4]).toMatchObject({
        type: 'code',
        content: {
          language: 'typescript',
          code: expect.stringContaining('const greet'),
        },
      });

      // 6. Quote
      expect(result.blocks[5]).toMatchObject({
        type: 'quote',
        content: {
          text: 'Important note about asynchronous execution.',
        },
      });
    });

    it('parses markdown tables correctly', () => {
      const tableMd = `# Data Types

| Type | Primitive | Example |
| --- | --- | --- |
| String | Yes | "hello" |
| Number | Yes | 42 |`;

      const result = parser.parse(tableMd);
      const tableBlock = result.blocks.find((b) => b.type === 'table');

      expect(tableBlock).toBeDefined();
      expect(tableBlock?.content).toMatchObject({
        columns: [
          { id: 'col-1', label: 'Type' },
          { id: 'col-2', label: 'Primitive' },
          { id: 'col-3', label: 'Example' },
        ],
        rows: [
          { id: 'row-1', cells: [{ value: 'String' }, { value: 'Yes' }, { value: '"hello"' }] },
          { id: 'row-2', cells: [{ value: 'Number' }, { value: 'Yes' }, { value: '42' }] },
        ],
        hasHeader: true,
      });
    });

    it('strips malicious script tags from markdown content', () => {
      const maliciousMd = `# Safe Title <script>alert("hack")</script>

Paragraph with <script src="evil.js"></script> content.`;

      const result = parser.parse(maliciousMd);
      expect(result.blocks[0].content).toMatchObject({ text: 'Safe Title' });
      expect(result.blocks[1].content).toMatchObject({ text: 'Paragraph with content.' });
    });
  });

  describe('HtmlParser', () => {
    const parser = new HtmlParser();

    it('safely converts HTML into semantic TutorialBlock representations', () => {
      const html = `
        <h1>Introduction to HTML</h1>
        <p>HTML is the standard markup language.</p>
        <pre><code class="language-javascript">console.log("Hello world");</code></pre>
        <ul>
          <li>Elements</li>
          <li>Attributes</li>
        </ul>
        <blockquote>HTML is foundational.</blockquote>
      `;

      const result = parser.parse(html);
      expect(result.blocks.length).toBe(5);

      expect(result.blocks[0]).toMatchObject({
        type: 'heading',
        content: { text: 'Introduction to HTML', level: 1 },
      });

      expect(result.blocks[1]).toMatchObject({
        type: 'paragraph',
        content: { text: 'HTML is the standard markup language.' },
      });

      expect(result.blocks[2]).toMatchObject({
        type: 'code',
        content: { language: 'javascript', code: 'console.log("Hello world");' },
      });

      expect(result.blocks[3]).toMatchObject({
        type: 'list',
        content: {
          style: 'unordered',
          items: [{ text: 'Elements' }, { text: 'Attributes' }],
        },
      });

      expect(result.blocks[4]).toMatchObject({
        type: 'quote',
        content: { text: 'HTML is foundational.' },
      });
    });

    it('strips dangerous inline event handlers, scripts, and iframes', () => {
      const unsafeHtml = `
        <h1 onclick="maliciousCode()">Safe Heading</h1>
        <iframe src="https://evil.com"></iframe>
        <p onerror="alert(1)">Clean paragraph.</p>
        <script>window.pwned = true;</script>
      `;

      const result = parser.parse(unsafeHtml);
      expect(result.blocks.length).toBe(2);
      expect(result.blocks[0].content).toMatchObject({ text: 'Safe Heading' });
      expect(result.blocks[1].content).toMatchObject({ text: 'Clean paragraph.' });
    });
  });

  describe('PlainTextParser', () => {
    const parser = new PlainTextParser();

    it('splits raw text chunks into paragraphs and lists', () => {
      const plain = `Introduction to Algorithms

Algorithms are step-by-step procedures for calculation.

Key Characteristics:
- Deterministic
- Finiteness
- Input & Output

Conclusion paragraph.`;

      const result = parser.parse(plain);
      expect(result.blocks.length).toBe(5);

      expect(result.blocks[0]).toMatchObject({
        type: 'heading',
        content: { text: 'Introduction to Algorithms', level: 1 },
      });

      expect(result.blocks[1]).toMatchObject({
        type: 'paragraph',
        content: { text: 'Algorithms are step-by-step procedures for calculation.' },
      });

      expect(result.blocks[2]).toMatchObject({
        type: 'heading',
        content: { text: 'Key Characteristics', level: 2 },
      });

      expect(result.blocks[3]).toMatchObject({
        type: 'list',
        content: { style: 'unordered' },
      });

      expect(result.blocks[4]).toMatchObject({
        type: 'paragraph',
        content: { text: 'Conclusion paragraph.' },
      });
    });
  });

  describe('TutorialImportService', () => {
    it('generates a valid canonical TutorialDocument and computes stats', async () => {
      const response = await tutorialImportService.importRawContent({
        subtopicId: '00000000-0000-0000-0000-000000000001',
        sectionType: 'notes',
        difficulty: 'simple',
        sourceType: 'markdown',
        rawContent: `# Sample Tutorial

This is an introduction.

## Code Section

\`\`\`typescript
const x = 10;
\`\`\`

- Bullet 1
- Bullet 2`,
      });

      expect(response.document.schemaVersion).toBe(1);
      expect(response.document.blocks.length).toBe(5);

      // Verify schema compliance
      const validated = TutorialDocumentSchema.safeParse(response.document);
      expect(validated.success).toBe(true);

      // Verify stats
      expect(response.stats).toMatchObject({
        headings: 2,
        paragraphs: 1,
        codeBlocks: 1,
        lists: 1,
        totalBlocks: 5,
      });
      expect(response.stats.wordCount).toBeGreaterThan(0);
      expect(response.stats.charCount).toBeGreaterThan(0);
    });

    it('throws TutorialDocumentValidationError when raw content is empty', async () => {
      await expect(
        tutorialImportService.importRawContent({
          subtopicId: '00000000-0000-0000-0000-000000000001',
          sectionType: 'notes',
          difficulty: 'simple',
          sourceType: 'markdown',
          rawContent: '   ',
        })
      ).rejects.toThrow(TutorialDocumentValidationError);
    });
  });
});
