import { notFound, permanentRedirect, redirect } from 'next/navigation';
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
  
  // NOTE: currentPath will be updated to canonical after identity resolution
  // For now, use requested path for initial authentication redirect
  const currentPath = `/tutorial-v2/${resolved.domainSlug}/${resolved.subjectSlug}/${resolved.topicSlug}/${resolved.subtopicSlug}/${resolved.navigationNodeId}`;
  
  if (!accessToken) {
    // Redirect to login with return path
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // NOTE: proxy.ts middleware already validated the token and added user headers
  // Extract learnerId from middleware-added headers
  const headersList = await nextHeaders();
  const learnerId = extractLearnerIdFromHeaders(headersList);

  console.log(
    '[TUTORIAL_PAGE_AUTH]',
    JSON.stringify({
      authenticated: learnerId !== null,
      hasLearnerId: learnerId !== null,
      domainSlug: resolved.domainSlug,
      subjectSlug: resolved.subjectSlug,
      topicSlug: resolved.topicSlug,
      subtopicSlug: resolved.subtopicSlug,
      navigationNodeId: resolved.navigationNodeId,
    }),
  );

  if (!learnerId) {
    // Authentication headers missing - redirect to login
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // Phase 2.5: Resolve runtime context (reuses existing delivery logic)
  const result = await resolveRuntimeContext({
    brandId: 'skillup',
    learnerId,
    ...resolved,
  });

  if (!result.success) {
    notFound();
  }

  // PHASE 2.6: Canonical URL redirect
  // Legacy compact slugs (e.g., "whatisjava") redirect to canonical TutorialDB slug
  const requestedSubtopicSlug = resolved.subtopicSlug;
  const canonicalSubtopicSlug = result.payload.hierarchy.subtopic.slug;

  // Route-level identity trace for Phase 2.6 verification
  console.log('[PHASE_2_6][ROUTE_IDENTITY_CHECK]', {
    requestedSubtopicSlug,
    canonicalSubtopicSlug,
    navigationNodeId: resolved.navigationNodeId,
    domainSlug: result.payload.hierarchy.domain.slug,
    subjectSlug: result.payload.hierarchy.subject.slug,
    topicSlug: result.payload.hierarchy.topic.slug,
  });

  // Canonical slug validation guard
  if (!canonicalSubtopicSlug) {
    console.error('[PHASE_2_6][CANONICAL_SLUG_MISSING]', {
      requestedSubtopicSlug,
      navigationNodeId: resolved.navigationNodeId,
    });
    notFound();
  }

  if (requestedSubtopicSlug !== canonicalSubtopicSlug) {
    // Construct canonical URL using resolved hierarchy
    const canonicalPath = 
      `/tutorial-v2/` +
      `${result.payload.hierarchy.domain.slug}/` +
      `${result.payload.hierarchy.subject.slug}/` +
      `${result.payload.hierarchy.topic.slug}/` +
      `${canonicalSubtopicSlug}/` +
      `${resolved.navigationNodeId}`;

    console.log('[PHASE_2_6][CANONICAL_REDIRECT]', {
      requestedSubtopicSlug,
      canonicalSubtopicSlug,
      canonicalPath,
      navigationNodeId: resolved.navigationNodeId,
    });

    // Permanent redirect (308) - canonical URL is stable
    permanentRedirect(canonicalPath);
  }

  // Canonical URL confirmed - no redirect needed
  console.log('[PHASE_2_6][CANONICAL_REQUEST_CONFIRMED]', {
    subtopicSlug: requestedSubtopicSlug,
    navigationNodeId: resolved.navigationNodeId,
  });

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
