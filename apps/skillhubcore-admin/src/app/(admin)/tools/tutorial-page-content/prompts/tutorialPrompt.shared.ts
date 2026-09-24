import type { TutorialPromptContext } from './tutorialPromptContext';

/**
 * Canonical human-readable hierarchy used by every Tutorial Composer
 * AI generation prompt.
 *
 * DO NOT duplicate this hierarchy inside individual block prompts.
 */
export function buildTargetHierarchy(
  context: TutorialPromptContext
): string {
  return `# TARGET HIERARCHY

- Domain: ${context.domainName}
- Subject: ${context.subjectName}
- Topic: ${context.topicName}
- Subtopic: ${context.subtopicName}
- Navigation Node: ${context.navigationNodeName}
- Block: ${context.blockName}
- Version: ${context.versionName}`;
}

/**
 * Global expectedTimeSec metadata contract for all instructional blocks.
 *
 * This rule applies universally to D1, C1, I1, S1, and future instructional blocks.
 * AI must dynamically estimate learning time based on actual generated content.
 */
export function buildExpectedTimeSecContract(): string {
  return `# GLOBAL BLOCK METADATA: expectedTimeSec

**REQUIREMENT:** All instructional blocks MUST include expectedTimeSec at the ROOT level of the JSON output.

## Structure Rules

- **Placement:** Root level of the JSON object (NOT inside page, content, code, explanation, or any nested object)
- **Type:** Positive integer (whole number greater than 0)
- **Unit:** Seconds
- **Purpose:** Analytics metadata representing estimated learning time (NOT a completion trigger)

## AI Estimation Process

1. **Generate complete block content FIRST**
2. **Then estimate expectedTimeSec** based on the actual content you generated
3. Consider these factors:

### D1 Definition Blocks
- Intro + definition reading time (~20-40 sec)
- Explanation paragraphs (~30-60 sec per paragraph)
- Code example review (~30-60 sec)
- Characteristics review (~15-30 sec per characteristic)
- Takeaway reading (~10-20 sec)
- **Typical range:** 90-180 seconds for simple definitions, up to 300 seconds for complex concepts

### C1 Code Blocks
- Introduction reading (~20-30 sec)
- Code comprehension (varies by length/complexity: ~60-180 sec)
- Step-by-step explanation review (~20-40 sec per step)
- Memory model study (~60-120 sec)
- Output analysis (~15-30 sec)
- Takeaway + tip reading (~30-60 sec)
- **Typical range:** 180-360 seconds, up to 480 seconds for complex tracing examples

### I1 Introduction Blocks
- Hero + learning goal (~30-60 sec)
- Topic overview (~30-60 sec)
- Where fit flow cards (~60-90 sec)
- Solution code review (~60-120 sec)
- Use cases review (~60-90 sec)
- Roadmap steps (~90-150 sec)
- Benefits review (~60-90 sec)
- Key takeaway (~20-30 sec)
- **Typical range:** 300-600 seconds (comprehensive roadmap-style content)

### S1 Summary Blocks
- Number of summary points (varies)
- Technical depth per point (~20-60 sec per point)
- Overall complexity
- **Typical range:** 60-180 seconds

## Estimation Guidelines (NOT Constraints)

These ranges are guidance for AI estimation. Base your estimate on:
- Actual content length you generated
- Cognitive complexity (simple concept vs. multi-step reasoning)
- Visual elements requiring study (code, diagrams, memory models)
- Technical depth and prerequisite knowledge

**DO NOT copy example values.** Each block requires independent assessment.

## Example (Root-Level Placement)

\`\`\`json
{
  "expectedTimeSec": 240,
  "page": {
    "type": "definition",
    "title": "Variable",
    "intro": "...",
    ...
  }
}
\`\`\`

## CRITICAL: Architectural Separation

- expectedTimeSec is **ANALYTICS METADATA ONLY**
- It does **NOT** affect completion logic, progress eligibility, or R/Y/G status
- Completion/eligibility is controlled by \`progressRole\` (instructional/structural/assessment/media)
- Changing expectedTimeSec has **NO IMPACT** on learning flow or ILS completion`;
}

/**
 * Canonical system-metadata protection rule.
 *
 * These fields belong to the Composer/database/application layer,
 * not to generated block content.
 */
export function buildProhibitedSystemMetadata(): string {
  return `# PROHIBITED SYSTEM METADATA

Do NOT include:

- id
- blockId
- navigationNodeId
- sectionId
- version
- domainId
- subjectId
- topicId
- subtopicId
- brandId
- theme
- status
- publishedAt
- schemaVersion`;
}

/**
 * Common opening section for every AI generation prompt.
 *
 * Block-specific prompt files should append their own contract
 * after this shared header.
 */
export function buildTutorialPromptHeader(
  context: TutorialPromptContext
): string {
  return `You are generating educational content for a tutorial platform.

${buildTargetHierarchy(context)}`;
}

/**
 * Common closing section for every AI generation prompt.
 *
 * This guarantees that all block types receive the same
 * global metadata requirements and system-metadata protection rules.
 */
export function buildTutorialPromptFooter(): string {
  return `${buildExpectedTimeSecContract()}

${buildProhibitedSystemMetadata()}`;
}

/**
 * Complete common prompt infrastructure.
 *
 * This helper is intentionally small:
 *
 *   common header
 *       +
 *   block-specific contract
 *       +
 *   common metadata rules
 */
export function buildTutorialPrompt(
  context: TutorialPromptContext,
  blockSpecificContract: string
): string {
  return `${buildTutorialPromptHeader(context)}

${blockSpecificContract.trim()}

${buildTutorialPromptFooter()}`;
}
