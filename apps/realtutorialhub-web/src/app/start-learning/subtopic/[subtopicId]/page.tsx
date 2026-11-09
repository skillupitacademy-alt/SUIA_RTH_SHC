import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Retired Legacy Subtopic Notes Page
 *
 * Per OD-01/OD-02 and Phase B Task 05:
 * The monolithic /start-learning/subtopic/[subtopicId] notes route is retired.
 * The canonical block-based learning experience is exclusively hosted at:
 * /tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]
 */
export default function RetiredSubtopicNotesPage() {
  notFound();
}
