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
 * @param contentType - Block type ('definition', 'code', 'summary', 'introduction')
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

  if (contentType === 'introduction') {
    // Markdown format for Introduction blocks
    // Expected structure:
    // # Title
    // Subtitle
    // Badge | Motto Line 1 | Motto Line 2 | Motto Line 3 | Motto Line 4
    // Learning Goal
    // ## Topic
    // Topic description
    // "Topic quote"
    // ... (simplified parsing for markdown mode)
    
    const lines = source.split(/\r?\n/).map((line) => line.trim());
    const nonEmptyLines = lines.filter(Boolean);
    
    const title = nonEmptyLines[0]?.replace(/^#\s*/, '') || 'Untitled Introduction';
    const subtitle = nonEmptyLines[1] || 'Learn the fundamentals';
    const badgeAndMotto = nonEmptyLines[2]?.split('|').map(s => s.trim()) || ['Topic', 'Start', 'Your', 'Learning', 'Journey'];
    const badge = badgeAndMotto[0] || 'Topic';
    const mottoLines: [string, string, string, string] = [
      badgeAndMotto[1] || 'Start',
      badgeAndMotto[2] || 'Your',
      badgeAndMotto[3] || 'Learning',
      badgeAndMotto[4] || 'Journey',
    ];
    const learningGoal = nonEmptyLines[3] || 'Master the core concepts and practical applications.';

    return {
      page: {
        badge,
        title,
        subtitle,
        motto: { lines: mottoLines },
        learningGoal,
        topic: {
          title: 'What is it?',
          description: nonEmptyLines[4] || 'Core concept explained.',
          quote: '"Essential knowledge for developers." — Community',
        },
        whereFit: {
          title: 'Where Does It Fit?',
          description: 'Context and relationships.',
          flowCards: [
            { title: 'Foundation', subtitle: 'Core building blocks', icon: 'box' as const },
            { title: 'This Topic', subtitle: 'Current focus', icon: 'code' as const, highlight: true },
            { title: 'Advanced', subtitle: 'Next steps', icon: 'rocket' as const },
          ],
        },
        solution: {
          title: 'A Simple Example',
          description: 'Basic demonstration:',
          code: {
            language: 'javascript',
            code: 'console.log("Example");',
          },
        },
        whereUsed: {
          title: 'Where Is It Used?',
          description: 'Common applications and use cases.',
          useCases: [
            { title: 'Web Apps', description: 'Frontend and backend', icon: 'globe' as const },
            { title: 'APIs', description: 'Data processing', icon: 'wrench' as const },
          ],
        },
        roadmap: {
          title: 'Your Learning Roadmap',
          description: 'Progress through structured lessons.',
          steps: [
            { title: 'Basics', subtitle: 'Core fundamentals' },
            { title: 'Practice', subtitle: 'Hands-on exercises' },
            { title: 'Advanced', subtitle: 'Complex patterns' },
          ],
        },
        whyMatters: {
          title: 'Why This Matters',
          benefits: [
            { title: 'Build Better Code', subtitle: 'Clean and maintainable', icon: 'check-circle' as const },
            { title: 'Career Growth', subtitle: 'In-demand skills', icon: 'star' as const },
          ],
        },
        keyTakeaway: 'Master this concept to build production-ready applications.',
      },
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
