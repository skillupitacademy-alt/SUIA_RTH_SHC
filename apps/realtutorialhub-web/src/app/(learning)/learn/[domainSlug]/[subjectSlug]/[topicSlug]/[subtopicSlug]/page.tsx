import { getDomainTheme } from '@/lib/domain-themes';
import { getSeededTutorialContent } from '@/lib/tutorial-content';

import { TutorialExperience } from '@/components/content/TutorialExperience';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  }>;
}

export default async function TutorialSubtopicPage({ params }: PageProps) {
  const resolved = await params;
  const content = await getSeededTutorialContent();
  const theme = getDomainTheme(resolved.domainSlug);

  return <TutorialExperience params={resolved} content={content} theme={theme} mode="compare" />;
}

