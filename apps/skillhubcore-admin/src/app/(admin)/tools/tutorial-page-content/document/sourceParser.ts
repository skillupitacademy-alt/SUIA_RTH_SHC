import type { TutorialPageContentType } from '@quiz/types';
import { parseBlockMarkdown } from './blockVersionDefinitions';

export type SourceFormat = 'json' | 'markdown';

/**
 * Parses author source without embedding block-family rules in the editor.
 * Version definitions own their Markdown conversion so new blocks can extend
 * the Composer through their contract rather than another conditional branch.
 */
export function parseSource(
  format: SourceFormat,
  source: string,
  contentType: TutorialPageContentType,
  versionCode = ''
): unknown {
  return format === 'json'
    ? JSON.parse(source)
    : parseBlockMarkdown(source, contentType, versionCode);
}
