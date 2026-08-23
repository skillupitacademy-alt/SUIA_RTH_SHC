import type { TutorialPageContentType } from '@quiz/types';

/**
 * Source Parser Module
 * 
 * Handles conversion from JSON or Markdown source formats to block payload objects.
 * This is a document-level concern used during block authoring.
 */

export type SourceFormat = 'json' | 'markdown';

/**
 * Parse source content (JSON or Markdown) into a block payload object
 * 
 * @param format - Source format ('json' or 'markdown')
 * @param source - Source content string
 * @param contentType - Block type ('definition', 'code', 'summary')
 * @returns Parsed payload object
 */
export function parseSource(
  format: SourceFormat,
  source: string,
  contentType: TutorialPageContentType
): unknown {
  if (format === 'json') {
    return JSON.parse(source);
  }

  // Markdown format - block-type-specific parsing
  if (contentType === 'definition') {
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return {
      page: {
        type: 'definition',
        title: lines[0]?.replace(/^#\s*/, '') || 'Untitled Definition',
        intro: lines[1] || '',
        definition: lines[2] || '',
        explanation: lines.slice(3),
      },
    };
  }

  if (contentType === 'summary') {
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return {
      page: {
        badge: 'REVISION & SUMMARY',
        title: lines[0]?.replace(/^#\s*/, '') || 'Revision Summary',
        introduction: lines[1] || '',
      },
      summary: lines.slice(2).map((line) => ({ text: line.replace(/^[-*]\s*/, '') })),
    };
  }

  // Default: code block markdown parsing
  const codeMatch = source.match(/```(\w+)?\n([\s\S]*?)```/);
  return {
    page: {
      type: 'CODE + EXPLANATION',
      title: source.split(/\r?\n/)[0]?.replace(/^#\s*/, '') || 'Untitled Code Example',
      introduction: 'Code example imported from markdown.',
    },
    code: {
      language: codeMatch?.[1] || 'text',
      prismLanguage: codeMatch?.[1] || 'text',
      source: codeMatch?.[2]?.trim() || source,
    },
  };
}
