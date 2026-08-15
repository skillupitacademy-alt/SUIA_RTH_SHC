/**
 * Plain Text Parser
 * Converts unformatted or lightly-formatted plain text into canonical TutorialBlock[] items.
 */

import type {
  TutorialBlock,
  ParagraphBlock,
  HeadingBlock,
  ListBlock,
  ListItem,
  RawContentSourceType,
  ImportOptions,
} from '@quiz/types';
import type { IRawContentParser, ParsedBlockResult } from './raw-content-parser.interface';

export class PlainTextParser implements IRawContentParser {
  supports(sourceType: RawContentSourceType): boolean {
    return sourceType === 'plain_text';
  }

  parse(rawContent: string, options: Partial<ImportOptions> = {}): ParsedBlockResult {
    const rawNormalized = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const blocks: TutorialBlock[] = [];

    if (!rawNormalized) {
      return { blocks: [] };
    }

    const chunks = rawNormalized.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
    let headingCount = 0;
    let paragraphCount = 0;
    let listCount = 0;

    let extractedTitle: string | undefined = options.customTitle;
    let extractedDescription: string | undefined;

    for (const chunk of chunks) {
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      // Check if chunk is a bullet list (or lead-in heading line + bullet list)
      const hasBulletItems = lines.some((l) => /^[-*•]\s+/.test(l));
      if (hasBulletItems && options.detectLists !== false) {
        let startIdx = 0;
        // Check if first line is a lead-in heading
        if (!/^[-*•]\s+/.test(lines[0])) {
          headingCount++;
          const hText = lines[0].replace(/:$/, '').trim();
          blocks.push({
            id: `heading-${headingCount}`,
            type: 'heading',
            content: { text: hText, level: 2 },
          });
          startIdx = 1;
        }

        const bulletLines = lines.slice(startIdx).filter((l) => /^[-*•]\s+/.test(l));
        if (bulletLines.length > 0) {
          listCount++;
          const items: ListItem[] = bulletLines.map((l) => ({
            text: l.replace(/^[-*•]\s+/, '').trim(),
          }));
          const listBlock: ListBlock = {
            id: `list-${listCount}`,
            type: 'list',
            content: {
              style: 'unordered',
              items,
            },
          };
          blocks.push(listBlock);
          continue;
        }
      }

      // Check if chunk is an ordered list
      const isOrderedList = lines.every((l) => /^\d+[\.)]\s+/.test(l));
      if (isOrderedList && options.detectLists !== false) {
        listCount++;
        const items: ListItem[] = lines.map((l) => ({
          text: l.replace(/^\d+[\.)]\s+/, '').trim(),
        }));
        const listBlock: ListBlock = {
          id: `list-${listCount}`,
          type: 'list',
          content: {
            style: 'ordered',
            items,
          },
        };
        blocks.push(listBlock);
        continue;
      }

      // Check if single short line looks like a heading (under 80 chars, no sentence ending period, title-case or numbered)
      if (lines.length === 1 && chunk.length < 80 && options.detectHeadings !== false) {
        const isHeadingLike =
          /^(\d+\.|\d+\))\s+[A-Z]/.test(chunk) ||
          /^[A-Z][A-Za-z0-9\s:_-]{2,60}$/.test(chunk) ||
          (chunk.endsWith(':') && !chunk.includes('.'));

        if (isHeadingLike && !chunk.endsWith('.')) {
          headingCount++;
          const headingText = chunk.replace(/:$/, '').trim();
          if (!extractedTitle && headingCount === 1 && options.extractTitle !== false) {
            extractedTitle = headingText;
          }
          const headingBlock: HeadingBlock = {
            id: `heading-${headingCount}`,
            type: 'heading',
            content: {
              text: headingText,
              level: headingCount === 1 ? 1 : 2,
            },
          };
          blocks.push(headingBlock);
          continue;
        }
      }

      // Default: Paragraph Block
      paragraphCount++;
      const paragraphText = lines.join(' ');
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

    return {
      blocks,
      extractedTitle,
      extractedDescription,
      metadata: {
        tags: ['imported', 'plain_text'],
      },
    };
  }
}
