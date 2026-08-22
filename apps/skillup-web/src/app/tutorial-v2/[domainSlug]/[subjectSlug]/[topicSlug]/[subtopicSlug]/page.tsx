import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { TutorialPageShell } from '@/share-branding/LearningExperience/components/TutorialPageShell';
import { getPublishedTutorialPagePayload } from '@/share-branding/LearningExperience/tutorialSidebarDelivery';
import { TokenService } from '@quiz/auth';

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

  // Verify token is valid
  const tokenService = new TokenService();
  const verifyResult = await tokenService.verifyUserAccessToken(accessToken);
  
  if (!verifyResult.valid || !verifyResult.payload) {
    // Invalid token - redirect to login
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  const payload = await getPublishedTutorialPagePayload({
    brandId: 'skillup',
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
