/**
 * Objective Block - AI Generation Prompt Template
 *
 * Dynamically constructs the pure JSON content contract based on the
 * selected Objective version (O1, O2, O3, ...) and its canonical default payload
 * from the Block Registry / Content Editor.
 */

import type { TutorialPromptContext } from '../../../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../../../prompts/tutorialPrompt.shared';
import { getDefaultPayload, getVersion } from '../../../registry';

/**
 * Generate the AI prompt for objective block content generation.
 * Dynamically incorporates the exact default JSON structure of the selected version.
 */
export function getObjectiveO1Prompt(
  context: TutorialPromptContext
): string {
  const versionId = context.versionId || 'O1';
  // Dynamically resolve the version entry from registry
  const versionEntry =
    getVersion('objective', versionId) ||
    getVersion('objective', 'O1');

  // Obtain the exact canonical default payload used in the Block Content Editor
  const rawPayload =
    versionEntry?.getDefaultPayload?.() ??
    getDefaultPayload('objective', versionId);

  // Prepend expectedTimeSec at root level per platform architectural invariant
  const payloadWithExpectedTime = {
    expectedTimeSec: '<AI-estimated-value>',
    ...(typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : { content: rawPayload }),
  };

  const formattedJson = JSON.stringify(payloadWithExpectedTime, null, 2);

  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS

Generate valid, production-ready objective content conforming strictly to the official platform schema for ${context.versionName}.

Return valid JSON only.

Do not include markdown code fences.

# REQUIRED STRUCTURE

${formattedJson}

# expectedTimeSec Estimation for ${context.versionName} Blocks

After generating the complete objective content above, estimate expectedTimeSec by considering:

- Eyebrow + title reading time (~10-20 sec)
- Introduction reading (~15-30 sec)
- Objective cards comprehension (~20-40 sec per objective)
- Note / synthesis reading (~15-20 sec)

Replace <AI-estimated-value> with your assessment as a positive integer (seconds).
Typical range: 120-240 seconds.
See the GLOBAL BLOCK METADATA section for complete estimation guidelines.

# CONTENT GUIDELINES

1. Structure actionable, observable learning objectives tailored to ${context.topicName} / ${context.subtopicName}.
2. Ensure each objective uses an active skill verb and clear descriptions.
3. Categorize objectives with relevant badge tags (e.g., Core Skill, Practical Skill, Understanding).
4. Use standard descriptive icon keys (e.g., create, access, extract, modify, use, explain, code, target).
5. Ensure the structure strictly matches the REQUIRED STRUCTURE JSON schema above.
6. Do NOT include layout metadata, styles, or markdown code fences.`
  );
}
