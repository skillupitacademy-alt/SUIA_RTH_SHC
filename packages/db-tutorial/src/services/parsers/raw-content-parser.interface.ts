/**
 * Raw Content Parser Interface
 * Defines contracts for all content format parsers (Markdown, HTML, Plain Text)
 */

import type {
  TutorialBlock,
  TutorialDocumentMetadata,
  RawContentSourceType,
  ImportOptions,
} from '@quiz/types';

export interface ParsedBlockResult {
  blocks: TutorialBlock[];
  extractedTitle?: string;
  extractedDescription?: string;
  metadata?: Partial<TutorialDocumentMetadata>;
}

export interface IRawContentParser {
  /**
   * Check if this parser supports the given source type
   */
  supports(sourceType: RawContentSourceType): boolean;

  /**
   * Parse raw string content into canonical TutorialBlock items
   */
  parse(rawContent: string, options?: Partial<ImportOptions>): Promise<ParsedBlockResult> | ParsedBlockResult;
}
