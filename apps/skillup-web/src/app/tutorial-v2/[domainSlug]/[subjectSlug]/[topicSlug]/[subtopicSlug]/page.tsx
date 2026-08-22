import { notFound } from 'next/navigation';
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
  
  if (!accessToken) {
    // Return 401 - authentication required
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Authentication Required</h1>
        <p>Please log in to access tutorial content.</p>
      </div>
    );
  }

  // Verify token is valid
  const tokenService = new TokenService();
  const verifyResult = await tokenService.verifyUserAccessToken(accessToken);
  
  if (!verifyResult.valid || !verifyResult.payload) {
    // Invalid token - require re-authentication
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Authentication Required</h1>
        <p>Your session has expired. Please log in again.</p>
      </div>
    );
  }

  const resolved = await params;
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
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>This content is not available for your account.</p>
      </div>
    );
  }

  return <TutorialPageShell payload={payload} />;
}
