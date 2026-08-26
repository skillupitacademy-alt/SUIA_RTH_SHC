/**
 * S1 Summary Block - AI Generation Prompt Template
 *
 * Common hierarchy and system metadata rules are centralized.
 *
 * This file owns only the S1-specific content contract.
 */

import type { TutorialPromptContext } from '../../../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../../../prompts/tutorialPrompt.shared';

/**
 * Generate the AI prompt for S1 summary block content generation
 */
export function getSummaryS1Prompt(
  context: TutorialPromptContext
): string {
  const versionCode = context.versionId
    ? context.versionId.toUpperCase()
    : context.versionName.toUpperCase();

  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS

Return ONLY valid JSON conforming strictly to the canonical S1 Summary schema.

The generated summary (${versionCode}) must:

1. Summarize the selected Navigation Node accurately.
2. Reflect the selected topic and subtopic context.
3. Be concise and learner-friendly.
4. Preserve the canonical S1 JSON structure.
5. Contain no markdown code fences.
6. Contain no UI layout metadata.
7. Generate valid JSON only.`
  );
}
