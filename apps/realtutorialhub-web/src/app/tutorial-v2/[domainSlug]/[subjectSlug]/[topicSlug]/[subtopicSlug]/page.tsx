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
  }>;
}

export default async function TutorialV2SubtopicPage({ params }: PageProps) {
  // ✅ SECURITY: Verify authentication
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  const resolved = await params;
  const currentPath = `/tutorial-v2/${resolved.domainSlug}/${resolved.subjectSlug}/${resolved.topicSlug}/${resolved.subtopicSlug}`;
  
  if (!accessToken) {
    // Redirect to login with return path
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // NOTE: proxy.ts middleware already validated the token and added user headers
  // We don't need to re-verify the token here since middleware did it
  // The presence of accessToken cookie is sufficient (middleware already checked validity)

  const payload = await getPublishedTutorialPagePayload({
    brandId: 'realtutorialhub',
    ...resolved,
  });

  if (!payload) {
    notFound();
  }

  // ✅ SECURITY: Check if tutorial content is actually available
  // If payload exists but has no blocks, it means brand authorization failed
  if (!payload.content?.blocks || payload.content.blocks.length === 0) {
    notFound(); // Return 404 for unauthorized content
  }

  return <TutorialPageShell payload={payload} />;
}
