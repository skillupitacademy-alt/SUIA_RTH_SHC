/**
 * Shared Tutorial Composer AI Prompt Context
 *
 * This is the single authoritative context contract used by
 * every block-specific AI prompt.
 *
 * IMPORTANT:
 * This contains human-readable context only.
 *
 * System/database identities such as navigationNodeId,
 * subtopicId, sectionId and blockId must NOT be inserted
 * into generated content.
 */

export interface TutorialPromptContext {
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  navigationNodeName: string;
  blockName: string;
  versionName: string;

  /**
   * Optional internal version identifier.
   *
   * This may be useful to the Composer itself, but must never
   * be emitted into generated content.
   */
  versionId?: string;
}
