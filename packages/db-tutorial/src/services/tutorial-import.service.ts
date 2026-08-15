/**
 * Tutorial Import Service
 * Orchestrates raw content ingestion from Markdown, HTML, and Plain Text into canonical TutorialDocument models.
 * 
 * ARCHITECTURE:
 * - Deterministic parsing only (no LLM, no dual-write, no legacy child tables).
 * - Generates canonical TutorialDocument adhering to TutorialDocumentSchema.
 * - Enforces section-specific palette validation with validateDocumentForSection().
 * - Computes structural stats for author review.
 */

import {
  type TutorialDocument,
  type RawContentImportRequest,
  type RawContentImportResponse,
  type ImportedContentStats,
  type SectionType,
  TutorialDocumentSchema,
  CURRENT_SCHEMA_VERSION,
  TutorialDocumentValidationError,
  validateDocumentForSection,
} from '@quiz/types';

import { MarkdownParser } from './parsers/markdown-parser';
import { HtmlParser } from './parsers/html-parser';
import { PlainTextParser } from './parsers/plain-text-parser';
import { safeUrlFetcher } from './parsers/safe-url-fetcher';
import type { IRawContentParser, ParsedBlockResult } from './parsers/raw-content-parser.interface';

export class TutorialImportService {
  private parsers: IRawContentParser[];
  private htmlParser: HtmlParser;

  constructor() {
    this.htmlParser = new HtmlParser();
    this.parsers = [
      new MarkdownParser(),
      this.htmlParser,
      new PlainTextParser(),
    ];
  }

  /**
   * Import raw content into canonical TutorialDocument with stats
   */
  async importRawContent(request: RawContentImportRequest): Promise<RawContentImportResponse> {
    const { sourceType, sectionType, options } = request;
    let contentToParse = request.rawContent;

    if (!contentToParse || !contentToParse.trim()) {
      throw new TutorialDocumentValidationError('Raw content cannot be empty', [
        {
          code: 'EMPTY_CONTENT',
          message: 'Raw content cannot be empty',
          path: 'rawContent',
        },
      ]);
    }

    // 1. Handle URL source type via server-side safe fetcher
    let activeParser: IRawContentParser;
    if (sourceType === 'url') {
      contentToParse = await safeUrlFetcher.safeFetch(contentToParse.trim());
      activeParser = this.htmlParser;
    } else {
      const parser = this.parsers.find((p) => p.supports(sourceType));
      activeParser = parser || this.parsers[0];
    }

    // 2. Parse into blocks
    const parsedResult: ParsedBlockResult = await activeParser.parse(contentToParse, options);

    if (parsedResult.blocks.length === 0) {
      throw new TutorialDocumentValidationError('Failed to parse any valid content blocks from raw input', [
        {
          code: 'NO_BLOCKS_PARSED',
          message: 'No valid content blocks could be extracted from the input',
          path: 'rawContent',
        },
      ]);
    }

    // 3. Assemble TutorialDocument
    const document: TutorialDocument = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      blocks: parsedResult.blocks,
      metadata: {
        estimatedReadTime: Math.max(1, Math.ceil(this.countWords(contentToParse) / 200)),
        tags: parsedResult.metadata?.tags || ['imported'],
        complexityScore: 5,
        ...parsedResult.metadata,
      },
    };

    // 4. Validate TutorialDocument using canonical schema
    const parseResult = TutorialDocumentSchema.safeParse(document);
    if (!parseResult.success) {
      throw new TutorialDocumentValidationError(
        'Generated TutorialDocument failed schema validation',
        parseResult.error.errors.map((err) => ({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: err.message,
          path: err.path.join('.'),
        }))
      );
    }

    // 5. Validate against section palette constraints
    // Map sectionType to the schema SectionType
    const sectionValidation = validateDocumentForSection(document, sectionType as any);
    if (!sectionValidation.valid) {
      // In import phase, we warn/filter or reject if forbidden
      throw new TutorialDocumentValidationError(
        `Imported content contains blocks not allowed for section '${sectionType}'`,
        sectionValidation.errors.map((err) => ({
          code: err.code,
          message: err.message,
          path: err.path,
          blockId: err.blockId,
        }))
      );
    }

    // 6. Compute structural statistics
    const stats = this.computeStats(document, contentToParse);

    return {
      document,
      stats,
      sourceType,
    };
  }

  /**
   * Compute structural statistics for author UI
   */
  private computeStats(document: TutorialDocument, rawContent: string): ImportedContentStats {
    let headings = 0;
    let paragraphs = 0;
    let codeBlocks = 0;
    let lists = 0;
    let quotes = 0;
    let tables = 0;

    for (const block of document.blocks) {
      switch (block.type) {
        case 'heading':
          headings++;
          break;
        case 'paragraph':
          paragraphs++;
          break;
        case 'code':
          codeBlocks++;
          break;
        case 'list':
          lists++;
          break;
        case 'quote':
        case 'callout':
          quotes++;
          break;
        case 'table':
          tables++;
          break;
      }
    }

    const wordCount = this.countWords(rawContent);
    const charCount = rawContent.length;

    return {
      headings,
      paragraphs,
      codeBlocks,
      lists,
      quotes,
      tables,
      totalBlocks: document.blocks.length,
      wordCount,
      charCount,
    };
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
}

// Singleton export
export const tutorialImportService = new TutorialImportService();
