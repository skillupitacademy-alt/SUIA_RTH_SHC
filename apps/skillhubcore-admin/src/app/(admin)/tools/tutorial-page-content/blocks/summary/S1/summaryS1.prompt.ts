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
7. Generate valid JSON only.

# REQUIRED STRUCTURE

{
  "expectedTimeSec": <AI-estimated-value>,
  "content": {
    "title": "Summary: [Topic/Concept Name]",
    "points": [
      "First key summary point with clear technical explanation.",
      "Second key summary point with concrete details.",
      "Third key summary point emphasizing practical implications.",
      "Additional points as needed (typically 3-7 total)."
    ]
  }
}

# expectedTimeSec Estimation for S1 Blocks

After generating the complete summary content above, estimate expectedTimeSec by considering:

- Number of summary points you created
- Technical depth per point (~20-60 sec per point depending on complexity)
- Overall cognitive load (simple recap vs. deep synthesis)

S1 blocks are typically concise summaries but can vary significantly based on topic complexity.
Replace <AI-estimated-value> with your assessment as a positive integer (seconds).
See the GLOBAL BLOCK METADATA section for complete estimation guidelines.

# CONTENT GUIDELINES

- Each point should be a complete, standalone statement
- Points should synthesize key learnings, not repeat verbatim from other blocks
- Balance brevity with clarity
- Use technical terms appropriately for the topic level
- Typical range: 3-7 points`
  );
}
