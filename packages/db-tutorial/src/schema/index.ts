export * from './enums';
export * from './tutorial-content';
export * from './tutorial-assignments';
export * from './tutorial-projects';
export * from './tutorial-project-submissions';
export * from './tutorial-progress';
export * from './tutorial-video-links';
export * from './badges';
export * from './remediation-triggers';
export * from './domain-content-config';
export * from './content-generation-jobs';
export * from './subtopic-flow-progress';

import * as enums from './enums';
import * as tutorialContentModule from './tutorial-content';
import * as tutorialAssignmentsModule from './tutorial-assignments';
import * as tutorialProjectsModule from './tutorial-projects';
import * as tutorialProjectSubmissionsModule from './tutorial-project-submissions';
import * as tutorialProgressModule from './tutorial-progress';
import * as tutorialVideoLinksModule from './tutorial-video-links';
import * as badgesModule from './badges';
import * as remediationTriggersModule from './remediation-triggers';
import * as domainContentConfigModule from './domain-content-config';
import * as contentGenerationJobsModule from './content-generation-jobs';
import * as subtopicFlowProgressModule from './subtopic-flow-progress';

export const schema = {
  ...enums,
  ...tutorialContentModule,
  ...tutorialAssignmentsModule,
  ...tutorialProjectsModule,
  ...tutorialProjectSubmissionsModule,
  ...tutorialProgressModule,
  ...tutorialVideoLinksModule,
  ...badgesModule,
  ...remediationTriggersModule,
  ...domainContentConfigModule,
  ...contentGenerationJobsModule,
  ...subtopicFlowProgressModule,
};
