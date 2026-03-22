/* istanbul ignore file */
export * from './enums';
export * from './tutorial-content';
export * from './tutorial-assignments';
export * from './assignment-progress';
export * from './assignment-help-requests';
export * from './tutorial-projects';
export * from './tutorial-project-submissions';
export * from './student-badges';
export * from './tutorial-progress';
export * from './tutorial-video-links';
export * from './badges';
export * from './certificates';
export * from './remediation-triggers';
export * from './domain-content-config';
export * from './content-generation-jobs';
export * from './subtopic-flow-progress';
export * from './student-streaks';

import * as enums from './enums';
import * as tutorialContentModule from './tutorial-content';
import * as tutorialAssignmentsModule from './tutorial-assignments';
import * as assignmentProgressModule from './assignment-progress';
import * as assignmentHelpRequestsModule from './assignment-help-requests';
import * as tutorialProjectsModule from './tutorial-projects';
import * as tutorialProjectSubmissionsModule from './tutorial-project-submissions';
import * as studentBadgesModule from './student-badges';
import * as tutorialProgressModule from './tutorial-progress';
import * as tutorialVideoLinksModule from './tutorial-video-links';
import * as badgesModule from './badges';
import * as certificatesModule from './certificates';
import * as remediationTriggersModule from './remediation-triggers';
import * as domainContentConfigModule from './domain-content-config';
import * as contentGenerationJobsModule from './content-generation-jobs';
import * as subtopicFlowProgressModule from './subtopic-flow-progress';
import * as studentStreaksModule from './student-streaks';

export const schema = {
  ...enums,
  ...tutorialContentModule,
  ...tutorialAssignmentsModule,
  ...assignmentProgressModule,
  ...assignmentHelpRequestsModule,
  ...tutorialProjectsModule,
  ...tutorialProjectSubmissionsModule,
  ...studentBadgesModule,
  ...tutorialProgressModule,
  ...tutorialVideoLinksModule,
  ...badgesModule,
  ...certificatesModule,
  ...remediationTriggersModule,
  ...domainContentConfigModule,
  ...contentGenerationJobsModule,
  ...subtopicFlowProgressModule,
  ...studentStreaksModule,
};
