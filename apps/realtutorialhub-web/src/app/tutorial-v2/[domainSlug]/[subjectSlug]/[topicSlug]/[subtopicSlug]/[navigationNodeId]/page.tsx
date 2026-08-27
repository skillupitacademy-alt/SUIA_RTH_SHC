import { notFound, redirect } from 'next/navigation';
import { cookies, headers as nextHeaders } from 'next/headers';

import { TutorialPageShell } from '@/share-branding/LearningExperience/components/TutorialPageShell';
import { 
  resolveRuntimeContext, 
  extractLearnerIdFromHeaders 
} from '@/share-branding/LearningExperience/runtime/tutorialRuntimeResolver';

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
  // Extract learnerId from middleware-added headers
  const headersList = await nextHeaders();
  const learnerId = extractLearnerIdFromHeaders(headersList);

  if (!learnerId) {
    // Authentication headers missing - redirect to login
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // Phase 2.5: Resolve runtime context (reuses existing delivery logic)
  const result = await resolveRuntimeContext({
    brandId: 'realtutorialhub',
    learnerId,
    ...resolved,
  });

  if (!result.success) {
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
   * Phase 2.5: Runtime context now available for tracking/progress
   */

  return <TutorialPageShell payload={result.payload} runtimeContext={result.context} />;
}
