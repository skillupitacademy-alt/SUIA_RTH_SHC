/**
 * Universal Tutorial Page Identity
 *
 * This is the ONLY identity object that should cross the
 * curriculum/tutorial database boundary during learner delivery.
 *
 * ARCHITECTURE:
 * - curriculumSubtopicId = curriculum DB identity (external reference)
 * - tutorialSubtopicId  = tutorial DB identity (internal FK)
 * - navigationNodeId    = sidebar/page identity (unique per subtopic)
 * - sectionId           = tutorial_sections row identity (content)
 *
 * CRITICAL RULES:
 * - These identities MUST NEVER be substituted for one another
 * - tutorialSubtopicSlug is the CANONICAL learner URL segment
 * - Do NOT derive slug from curriculum name - use TutorialDB canonical slug
 *
 * CROSS-DATABASE INVARIANT:
 * tutorial_subtopics.external_id === curriculumSubtopicId
 * tutorial_sections.subtopic_id === tutorialSubtopicId
 * tutorial_sections.navigation_node_id === navigationNodeId
 */

export interface TutorialPageIdentity {
  /**
   * Curriculum database subtopic ID
   * This is the external_id in tutorial_subtopics table
   */
  curriculumSubtopicId: string;

  /**
   * Tutorial database internal subtopic ID
   * This is the actual FK used in tutorial_sections
   */
  tutorialSubtopicId: string;

  /**
   * Canonical Tutorial DB slug
   * Example: "what-is-java-12efacf1"
   * This is the authoritative URL segment - never regenerate it
   */
  tutorialSubtopicSlug: string;

  /**
   * Navigation node identity from sidebar tree
   * Example: "whatisjava"
   * Must belong to the requested subtopic context
   */
  navigationNodeId: string;

  /**
   * Tutorial section ID (null if content not yet created)
   * Progressive publishing allows null here
   */
  sectionId: string | null;

  /**
   * Brand context for visibility filtering
   */
  brandId: 'realtutorialhub' | 'skillup';
}

/**
 * Tutorial Page Identity Resolution Result
 */
export type TutorialPageIdentityResult =
  | {
      success: true;
      identity: TutorialPageIdentity;
    }
  | {
      success: false;
      reason: TutorialPageIdentityFailureReason;
      stage: string;
      details?: Record<string, unknown>;
    };

/**
 * Specific failure reasons for diagnostics
 */
export type TutorialPageIdentityFailureReason =
  | 'database_unavailable'
  | 'domain_not_found'
  | 'subject_not_found'
  | 'topic_not_found'
  | 'curriculum_subtopic_not_found'
  | 'tutorial_subtopic_mapping_missing'
  | 'identity_invariant_failed'
  | 'sidebar_not_found'
  | 'navigation_node_not_found'
  | 'navigation_node_not_page'
  | 'tutorial_section_not_found';
