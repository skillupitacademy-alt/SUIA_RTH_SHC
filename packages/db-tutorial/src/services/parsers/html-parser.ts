/**
 * Safe Deterministic HTML Parser
 * Converts untrusted HTML input into semantic TutorialBlock[] representations.
 * 
 * SECURITY:
 * - Completely strips scripts, styles, iframes, inline event handlers, class names, and arbitrary CSS.
 * - Extracts only structural content into typed TutorialBlock items.
 */

import type {
  TutorialBlock,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  CodeBlock,
  QuoteBlock,
  TableBlock,
  ListItem,
  CodeLanguage,
  TableColumn,
  TableRow,
  RawContentSourceType,
  ImportOptions,
} from '@quiz/types';
import { SUPPORTED_CODE_LANGUAGES } from '@quiz/types';
import type { IRawContentParser, ParsedBlockResult } from './raw-content-parser.interface';

export class HtmlParser implements IRawContentParser {
  supports(sourceType: RawContentSourceType): boolean {
    return sourceType === 'html';
  }

  parse(rawContent: string, options: Partial<ImportOptions> = {}): ParsedBlockResult {
    // 1. Sanitize the HTML string to remove dangerous tags and attributes
    const sanitized = this.preSanitize(rawContent);

    const blocks: TutorialBlock[] = [];
    let headingCount = 0;
    let paragraphCount = 0;
    let codeCount = 0;
    let listCount = 0;
    let quoteCount = 0;
    let tableCount = 0;

    let extractedTitle: string | undefined = options.customTitle;
    let extractedDescription: string | undefined;

    // 2. Tokenize top-level structural tags: h1-h6, p, pre/code, ul, ol, blockquote, table
    const blockRegex = /<(h[1-6]|p|pre|ul|ol|blockquote|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    let hasMatchedBlocks = false;

    while ((match = blockRegex.exec(sanitized)) !== null) {
      hasMatchedBlocks = true;
      const tag = match[1].toLowerCase();
      const innerHtml = match[2];

      // Handle Headings
      if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
        const text = this.stripAllTags(innerHtml);
        if (text) {
          if (level === 1 && !extractedTitle && options.extractTitle !== false) {
            extractedTitle = text;
          }
          headingCount++;
          const headingBlock: HeadingBlock = {
            id: `heading-${headingCount}`,
            type: 'heading',
            content: {
              text,
              level,
            },
          };
          blocks.push(headingBlock);
        }
        continue;
      }

      // Handle Code Blocks (<pre><code> or <pre>)
      if (tag === 'pre') {
        const codeMatch = innerHtml.match(/<code\b(?:[^>]*class=["'](?:language-)?(\w+)["'])?[^>]*>([\s\S]*?)<\/code>/i);
        const codeContent = codeMatch ? codeMatch[2] : innerHtml;
        const rawLang = (codeMatch && codeMatch[1] ? codeMatch[1].toLowerCase() : 'javascript') as string;
        const language = this.normalizeLanguage(rawLang);

        const decodedCode = this.decodeHtmlEntities(this.stripAllTags(codeContent));
        if (decodedCode) {
          codeCount++;
          const codeBlock: CodeBlock = {
            id: `code-${codeCount}`,
            type: 'code',
            content: {
              language,
              code: decodedCode,
            },
          };
          blocks.push(codeBlock);
        }
        continue;
      }

      // Handle Lists (<ul>, <ol>)
      if (tag === 'ul' || tag === 'ol') {
        const isOrdered = tag === 'ol';
        const items: ListItem[] = [];
        const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
        let liMatch: RegExpExecArray | null;

        while ((liMatch = liRegex.exec(innerHtml)) !== null) {
          const itemText = this.stripAllTags(liMatch[1]);
          if (itemText) {
            items.push({ text: itemText });
          }
        }

        if (items.length > 0) {
          listCount++;
          const listBlock: ListBlock = {
            id: `list-${listCount}`,
            type: 'list',
            content: {
              style: isOrdered ? 'ordered' : 'unordered',
              items,
            },
          };
          blocks.push(listBlock);
        }
        continue;
      }

      // Handle Blockquotes
      if (tag === 'blockquote') {
        const quoteText = this.stripAllTags(innerHtml);
        if (quoteText) {
          quoteCount++;
          const quoteBlock: QuoteBlock = {
            id: `quote-${quoteCount}`,
            type: 'quote',
            content: {
              text: quoteText,
            },
          };
          blocks.push(quoteBlock);
        }
        continue;
      }

      // Handle Tables
      if (tag === 'table') {
        const tableBlock = this.parseHtmlTable(innerHtml, ++tableCount);
        if (tableBlock) {
          blocks.push(tableBlock);
        }
        continue;
      }

      // Handle Paragraphs (<p>)
      if (tag === 'p') {
        const text = this.stripAllTags(innerHtml);
        if (text) {
          paragraphCount++;
          const paragraphBlock: ParagraphBlock = {
            id: `paragraph-${paragraphCount}`,
            type: 'paragraph',
            content: {
              text,
            },
          };
          blocks.push(paragraphBlock);

          if (!extractedDescription && paragraphCount === 1) {
            extractedDescription = text.slice(0, 160);
          }
        }
        continue;
      }
    }

    // Fallback: If no block tags matched (e.g. raw text wrapped in divs or plain string)
    if (!hasMatchedBlocks) {
      const plainText = this.stripAllTags(sanitized);
      const paragraphs = plainText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      for (const p of paragraphs) {
        paragraphCount++;
        blocks.push({
          id: `paragraph-${paragraphCount}`,
          type: 'paragraph',
          content: { text: p },
        });
      }
    }

    return {
      blocks,
      extractedTitle,
      extractedDescription,
      metadata: {
        tags: ['imported', 'html'],
      },
    };
  }

  private preSanitize(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '') // Strip inline event handlers
      .replace(/javascript:[^"']*/gi, ''); // Strip javascript: URLs
  }

  private stripAllTags(html: string): string {
    return this.decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  private normalizeLanguage(raw: string): CodeLanguage {
    const found = SUPPORTED_CODE_LANGUAGES.find((lang) => lang === raw || (raw === 'js' && lang === 'javascript') || (raw === 'ts' && lang === 'typescript') || (raw === 'py' && lang === 'python'));
    if (found) return found;
    return 'javascript';
  }

  private parseHtmlTable(tableInnerHtml: string, tableIdNum: number): TableBlock | null {
    const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    const allRows: string[][] = [];

    while ((trMatch = trRegex.exec(tableInnerHtml)) !== null) {
      const rowInner = trMatch[1];
      const cellRegex = /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
      let cellMatch: RegExpExecArray | null;
      const rowCells: string[] = [];

      while ((cellMatch = cellRegex.exec(rowInner)) !== null) {
        rowCells.push(this.stripAllTags(cellMatch[1]));
      }

      if (rowCells.length > 0) {
        allRows.push(rowCells);
      }
    }

    if (allRows.length === 0) return null;

    const firstRow = allRows[0];
    const columns: TableColumn[] = firstRow.map((label, idx) => ({
      id: `col-${idx + 1}`,
      label: label || `Column ${idx + 1}`,
      alignment: 'left',
    }));

    const rows: TableRow[] = [];
    const dataRows = allRows.slice(1);
    for (let r = 0; r < dataRows.length; r++) {
      const cells = columns.map((col, idx) => ({
        columnId: col.id,
        value: dataRows[r][idx] || '',
      }));
      rows.push({
        id: `row-${r + 1}`,
        cells,
      });
    }

    return {
      id: `table-${tableIdNum}`,
      type: 'table',
      content: {
        columns,
        rows,
        hasHeader: true,
      },
    };
  }
}
