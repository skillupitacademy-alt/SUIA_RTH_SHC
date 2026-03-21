import { getDomainTheme } from '@/lib/domain-themes';
import { getSeededTutorialContent } from '@/lib/tutorial-content';

import { TutorialExperience } from '@/components/content/TutorialExperience';

const rootParams = {
  domainSlug: 'full-stack',
  subjectSlug: 'javascript',
  topicSlug: 'asynchronous-programming',
  subtopicSlug: 'promises',
};

export default async function HomePage() {
  const content = await getSeededTutorialContent();
  const theme = getDomainTheme(rootParams.domainSlug);

  return <TutorialExperience params={rootParams} content={content} theme={theme} mode="compare" />;
}
