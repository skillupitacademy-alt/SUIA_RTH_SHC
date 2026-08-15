/**
 * Deterministic Markdown Parser
 * Converts Markdown raw content into canonical TutorialBlock[] without HTML/CSS contamination.
 */

import type {
  TutorialBlock,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  CodeBlock,
  QuoteBlock,
  TableBlock,
  CalloutBlock,
  ListItem,
  CodeLanguage,
  TableColumn,
  TableRow,
  RawContentSourceType,
  ImportOptions,
} from '@quiz/types';
import { SUPPORTED_CODE_LANGUAGES } from '@quiz/types';
import type { IRawContentParser, ParsedBlockResult } from './raw-content-parser.interface';

export class MarkdownParser implements IRawContentParser {
  supports(sourceType: RawContentSourceType): boolean {
    return sourceType === 'markdown' || sourceType === 'file';
  }

  parse(rawContent: string, options: Partial<ImportOptions> = {}): ParsedBlockResult {
    const lines = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const blocks: TutorialBlock[] = [];
    
    let headingCount = 0;
    let paragraphCount = 0;
    let codeCount = 0;
    let listCount = 0;
    let quoteCount = 0;
    let tableCount = 0;
    let calloutCount = 0;

    let extractedTitle: string | undefined = options.customTitle;
    let extractedDescription: string | undefined;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip blank lines
      if (!trimmed) {
        i++;
        continue;
      }

      // 1. Check for Fenced Code Block: ```lang
      if (trimmed.startsWith('```')) {
        const langMatch = trimmed.match(/^```(\w+)?/);
        const rawLang = (langMatch && langMatch[1] ? langMatch[1].toLowerCase() : 'javascript') as string;
        const language = this.normalizeLanguage(rawLang);

        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        // Advance past closing ```
        if (i < lines.length && lines[i].trim().startsWith('```')) {
          i++;
        }

        codeCount++;
        const codeBlock: CodeBlock = {
          id: `code-${codeCount}`,
          type: 'code',
          content: {
            language,
            code: codeLines.join('\n'),
          },
          presentation: {
            width: 'normal',
          },
        };
        blocks.push(codeBlock);
        continue;
      }

      // 2. Check for Headings: #, ##, ###, ####, #####, ######
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch && options.detectHeadings !== false) {
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = this.cleanText(headingMatch[2]);

        // First H1 can be treated as title if requested
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
          presentation: {
            alignment: 'left',
          },
        };
        blocks.push(headingBlock);
        i++;
        continue;
      }

      // 3. Check for Markdown Tables: | Col 1 | Col 2 |
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && lines[i + 1] && lines[i + 1].trim().includes('---')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        const parsedTable = this.parseMarkdownTable(tableLines, ++tableCount);
        if (parsedTable) {
          blocks.push(parsedTable);
          continue;
        }
      }

      // 4. Check for Blockquotes / Callouts: > quote
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }

        const fullQuote = quoteLines.join('\n').trim();

        // Check if callout format: [!NOTE], [!WARNING], [!TIP], [!IMPORTANT], etc.
        const calloutMatch = fullQuote.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER|SUCCESS)\]\s*\n?([\s\S]*)$/i);
        if (calloutMatch) {
          calloutCount++;
          const variantType = calloutMatch[1].toLowerCase();
          const variant = this.normalizeCalloutVariant(variantType);
          const calloutText = this.cleanText(calloutMatch[2].trim());

          const calloutBlock: CalloutBlock = {
            id: `callout-${calloutCount}`,
            type: 'callout',
            content: {
              variant,
              title: calloutMatch[1].toUpperCase(),
              text: calloutText,
            },
          };
          blocks.push(calloutBlock);
        } else {
          quoteCount++;
          const quoteBlock: QuoteBlock = {
            id: `quote-${quoteCount}`,
            type: 'quote',
            content: {
              text: this.cleanText(fullQuote),
            },
          };
          blocks.push(quoteBlock);
        }
        continue;
      }

      // 5. Check for Lists: Unordered (- , * , + ) or Ordered (1. , 2. )
      const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

      if ((unorderedMatch || orderedMatch) && options.detectLists !== false) {
        const isOrdered = Boolean(orderedMatch);
        const items: ListItem[] = [];

        while (i < lines.length) {
          const currentTrimmed = lines[i].trim();
          if (!currentTrimmed) {
            // Empty line might separate list items or end list
            if (lines[i + 1] && (lines[i + 1].trim().match(/^[-*+]\s+/) || lines[i + 1].trim().match(/^\d+\.\s+/))) {
              i++;
              continue;
            }
            break;
          }

          const uMatch = currentTrimmed.match(/^[-*+]\s+(.+)$/);
          const oMatch = currentTrimmed.match(/^(\d+)\.\s+(.+)$/);

          if (isOrdered && oMatch) {
            items.push({ text: this.cleanText(oMatch[2]) });
            i++;
          } else if (!isOrdered && uMatch) {
            items.push({ text: this.cleanText(uMatch[1]) });
            i++;
          } else {
            // Not continuing this list type
            break;
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
          continue;
        }
      }

      // 6. Default: Paragraph Block (collect contiguous lines of text)
      const paragraphLines: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentTrimmed = currentLine.trim();

        if (!currentTrimmed) break;
        if (currentTrimmed.startsWith('#')) break;
        if (currentTrimmed.startsWith('```')) break;
        if (currentTrimmed.startsWith('>')) break;
        if (currentTrimmed.match(/^[-*+]\s+/)) break;
        if (currentTrimmed.match(/^\d+\.\s+/)) break;
        if (currentTrimmed.startsWith('|') && currentTrimmed.endsWith('|')) break;

        paragraphLines.push(currentTrimmed);
        i++;
      }

      if (paragraphLines.length > 0) {
        const paragraphText = this.cleanText(paragraphLines.join(' '));
        if (paragraphText) {
          paragraphCount++;
          const paragraphBlock: ParagraphBlock = {
            id: `paragraph-${paragraphCount}`,
            type: 'paragraph',
            content: {
              text: paragraphText,
            },
          };
          blocks.push(paragraphBlock);

          if (!extractedDescription && paragraphCount === 1) {
            extractedDescription = paragraphText.slice(0, 160);
          }
        }
      }
    }

    return {
      blocks,
      extractedTitle,
      extractedDescription,
      metadata: {
        tags: ['imported', 'markdown'],
      },
    };
  }

  private cleanText(raw: string): string {
    // Strip malicious tags, raw HTML tags, and sanitize
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeLanguage(raw: string): CodeLanguage {
    const found = SUPPORTED_CODE_LANGUAGES.find((lang) => lang === raw || (raw === 'js' && lang === 'javascript') || (raw === 'ts' && lang === 'typescript') || (raw === 'py' && lang === 'python') || (raw === 'sh' && lang === 'bash') || (raw === 'c++' && lang === 'cpp') || (raw === 'c#' && lang === 'csharp'));
    if (found) return found;
    return 'javascript';
  }

  private normalizeCalloutVariant(variant: string): 'info' | 'warning' | 'tip' | 'important' | 'success' | 'danger' {
    switch (variant) {
      case 'warning':
      case 'caution':
        return 'warning';
      case 'tip':
        return 'tip';
      case 'important':
        return 'important';
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      case 'info':
      case 'note':
      default:
        return 'info';
    }
  }

  private parseMarkdownTable(tableLines: string[], tableIdNum: number): TableBlock | null {
    if (tableLines.length < 2) return null;

    const parseRow = (line: string): string[] => {
      return line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => this.cleanText(cell.trim()));
    };

    const headerCells = parseRow(tableLines[0]);
    if (headerCells.length === 0) return null;

    // Check divider line (index 1)
    const dividerLine = tableLines[1];
    if (!dividerLine.includes('---')) return null;

    const columns: TableColumn[] = headerCells.map((label, idx) => ({
      id: `col-${idx + 1}`,
      label,
      alignment: 'left',
    }));

    const rows: TableRow[] = [];
    for (let r = 2; r < tableLines.length; r++) {
      const cellValues = parseRow(tableLines[r]);
      const cells = columns.map((col, idx) => ({
        columnId: col.id,
        value: cellValues[idx] || '',
      }));
      rows.push({
        id: `row-${r - 1}`,
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
