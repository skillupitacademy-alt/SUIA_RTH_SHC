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
 * system-metadata protection rules.
 */
export function buildTutorialPromptFooter(): string {
  return buildProhibitedSystemMetadata();
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
