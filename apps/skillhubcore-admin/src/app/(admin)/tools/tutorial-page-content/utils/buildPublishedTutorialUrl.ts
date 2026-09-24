/**
 * Build the canonical learner-facing Tutorial V2 URL.
 *
 * Identity contract:
 *
 * Domain
 *   ↓
 * Subject
 *   ↓
 * Topic
 *   ↓
 * Subtopic
 *   ↓
 * Navigation Node
 *
 * The final route segment MUST be navigationNodeId.
 *
 * This must remain separate from:
 * - sectionId
 * - blockId
 * - navigationNode.slug
 *
 * @param domainSlug - Domain slug (human-readable identifier)
 * @param subjectSlug - Subject slug
 * @param topicSlug - Topic slug
 * @param subtopicSlug - Subtopic slug
 * @param navigationNodeId - Navigation node ID (system identity, NOT slug)
 * @returns Canonical public tutorial URL
 * @throws Error if any segment is missing or empty
 */
export function buildPublishedTutorialUrl(
  domainSlug: string,
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
  navigationNodeId: string
): string {
  const segments = [
    domainSlug,
    subjectSlug,
    topicSlug,
    subtopicSlug,
    navigationNodeId,
  ];

  if (segments.some((segment) => !segment?.trim())) {
    throw new Error(
      'Incomplete tutorial navigation identity.'
    );
  }

  return [
    'https://user.skillupitacademy.com/tutorial-v2',
    ...segments.map((segment) =>
      encodeURIComponent(segment.trim())
    ),
  ].join('/');
}
