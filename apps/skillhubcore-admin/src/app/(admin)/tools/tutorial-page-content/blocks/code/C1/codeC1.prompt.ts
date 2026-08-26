/**
 * C1 Code Block - AI Generation Prompt Template
 *
 * This file owns only the C1-specific generation instructions.
 *
 * Common hierarchy and metadata protection are centralized.
 */

import type { TutorialPromptContext } from '../../../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../../../prompts/tutorialPrompt.shared';

/**
 * Generate the AI prompt for C1 code block content generation
 */
export function getCodeC1Prompt(
  context: TutorialPromptContext
): string {
  const versionCode = context.versionId
    ? context.versionId.toUpperCase()
    : context.versionName.toUpperCase();

  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS

Generate valid, production-ready code (${versionCode}) content conforming strictly to the official platform schema.

The generated content must:

1. Follow the canonical C1 schema.
2. Contain valid JSON only.
3. Contain no markdown code fences around the JSON.
4. Preserve the semantic meaning of the selected Navigation Node.
5. Generate examples appropriate to the selected tutorial topic.
6. Avoid UI styling or presentation metadata unless explicitly defined by the C1 schema.`
  );
}
