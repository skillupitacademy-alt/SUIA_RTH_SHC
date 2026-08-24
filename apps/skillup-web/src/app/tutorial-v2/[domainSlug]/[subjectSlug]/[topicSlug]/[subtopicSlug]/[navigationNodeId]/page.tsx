import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { TutorialPageShell } from '@/share-branding/LearningExperience/components/TutorialPageShell';
import { getPublishedTutorialPagePayload } from '@/share-branding/LearningExperience/tutorialSidebarDelivery';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
    navigationNodeId: string; // Phase 1: Exact sidebar node.id
  }>;
}

export default async function TutorialV2SubtopicPage({ params }: PageProps) {
  // ✅ SECURITY: Verify authentication
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  const resolved = await params;
  const currentPath = `/tutorial-v2/${resolved.domainSlug}/${resolved.subjectSlug}/${resolved.topicSlug}/${resolved.subtopicSlug}/${resolved.navigationNodeId}`;
  
  if (!accessToken) {
    // Redirect to login with return path
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // NOTE: proxy.ts middleware already validated the token and added user headers
  // We don't need to re-verify the token here since middleware did it
  // The presence of accessToken cookie is sufficient (middleware already checked validity)

  const payload = await getPublishedTutorialPagePayload({
    brandId: 'skillup',
    ...resolved,
  });

  if (!payload) {
    notFound();
  }

  /*
   * PHASE 11.11D FIX: Allow empty content to render
   * 
   * Empty blocks array is valid and should show "Content not published yet" message.
   * TutorialPageShell already handles empty state gracefully.
   * 
   * This enables:
   * - Progressive content creation (sidebar first, blocks later)
   * - Developer iteration (create navigation structure before content)
   * - Incremental publishing (0/18 → 1/18 → ... → 18/18)
   * 
   * Removed previous check:
   * if (!payload.content?.blocks || payload.content.blocks.length === 0) {
   *   notFound(); // This prevented empty state from rendering
   * }
   */

  return <TutorialPageShell payload={payload} />;
}
