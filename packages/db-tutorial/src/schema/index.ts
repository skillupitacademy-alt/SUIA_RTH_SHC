/* istanbul ignore file */
export * from './enums';

// ===== PHASE 1 P0: MODULAR TUTORIAL SYSTEM =====
export * from './enums-modular';
export * from './tutorial-sections';
export * from './tutorial-subsections';
export * from './tutorial-section-domains';
export * from './user-interactions'; // NEW: User interaction tracking
export * from './educational-architectures';
export * from './ui-architectures';
export * from './ai-generation-orchestration';
export * from './ai-section-generation-jobs';
export * from './prompt-templates';
export * from './content-review-queue';
export * from './content-deployments';
export * from './ai-generation-metrics';
export * from './tutorial-sidebar-v2';
export * from './tutorial-page-content-v2';

// ===== PHASE 1 P0: GAP REMEDIATION - ANALYTICS =====
export * from './analytics-learning-metrics';
export * from './analytics-architecture-performance';
export * from './analytics-brand-business';

// ===== PHASE 2B: LAYMAN SECTION CONSTITUTIONAL FOUNDATION =====
export * from './layman-section-index';
export * from './layman-audit-logs';
export * from './layman-prompt-history';
export * from './layman-content-revisions';

// ===== LEGACY: MONOLITHIC SYSTEM (TO BE DEPRECATED) =====
export * from './tutorial-content';
export * from './tutorial-domains';
export * from './tutorial-content-versions';
export * from './tutorial-content-audit';
export * from './tutorial-assignments';
export * from './assignment-progress';
export * from './assignment-help-requests';
export * from './live-session-requests';
export * from './tutorial-subjects';
export * from './tutorial-topics';
export * from './tutorial-subtopics';
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

// Phase 1 P0: Modular System Imports
import * as enumsModular from './enums-modular';
import * as tutorialSectionsModule from './tutorial-sections';
import * as tutorialSubsectionsModule from './tutorial-subsections';
import * as tutorialSectionDomainsModule from './tutorial-section-domains';
import * as userInteractionsModule from './user-interactions'; // NEW
import * as educationalArchitecturesModule from './educational-architectures';
import * as uiArchitecturesModule from './ui-architectures';
import * as aiGenerationOrchestrationModule from './ai-generation-orchestration';
import * as aiSectionGenerationJobsModule from './ai-section-generation-jobs';
import * as promptTemplatesModule from './prompt-templates';
import * as contentReviewQueueModule from './content-review-queue';
import * as contentDeploymentsModule from './content-deployments';
import * as aiGenerationMetricsModule from './ai-generation-metrics';
import * as tutorialSidebarV2Module from './tutorial-sidebar-v2';
import * as tutorialPageContentV2Module from './tutorial-page-content-v2';

// Phase 1 P0: Gap Remediation - Analytics Imports
import * as analyticsLearningMetricsModule from './analytics-learning-metrics';
import * as analyticsArchitecturePerformanceModule from './analytics-architecture-performance';
import * as analyticsBrandBusinessModule from './analytics-brand-business';

// Phase 2B: Layman Hardening Imports
import * as laymanAuditLogsModule from './layman-audit-logs';
import * as laymanPromptHistoryModule from './layman-prompt-history';
import * as laymanContentRevisionsModule from './layman-content-revisions';

// Legacy Imports
import * as tutorialContentModule from './tutorial-content';
import * as tutorialDomainsModule from './tutorial-domains';
import * as tutorialContentVersionsModule from './tutorial-content-versions';
import * as tutorialContentAuditModule from './tutorial-content-audit';
import * as tutorialAssignmentsModule from './tutorial-assignments';
import * as assignmentProgressModule from './assignment-progress';
import * as assignmentHelpRequestsModule from './assignment-help-requests';
import * as tutorialProjectsModule from './tutorial-projects';
import * as tutorialProjectSubmissionsModule from './tutorial-project-submissions';
import * as studentBadgesModule from './student-badges';
import * as tutorialProgressModule from './tutorial-progress';
import * as tutorialVideoLinksModule from './tutorial-video-links';
import * as tutorialSubjectsModule from './tutorial-subjects';
import * as tutorialTopicsModule from './tutorial-topics';
import * as tutorialSubtopicsModule from './tutorial-subtopics';
import * as badgesModule from './badges';
import * as certificatesModule from './certificates';
import * as remediationTriggersModule from './remediation-triggers';
import * as domainContentConfigModule from './domain-content-config';
import * as contentGenerationJobsModule from './content-generation-jobs';
import * as subtopicFlowProgressModule from './subtopic-flow-progress';
import * as studentStreaksModule from './student-streaks';

export const schema = {
  ...enums,
  
  // Phase 1 P0: Modular Tutorial System
  ...enumsModular,
  ...tutorialSectionsModule,
  ...tutorialSubsectionsModule,
  ...tutorialSectionDomainsModule,
  ...userInteractionsModule, // NEW
  ...educationalArchitecturesModule,
  ...uiArchitecturesModule,
  ...aiGenerationOrchestrationModule,
  ...aiSectionGenerationJobsModule,
  ...promptTemplatesModule,
  ...contentReviewQueueModule,
  ...contentDeploymentsModule,
  ...aiGenerationMetricsModule,
  ...tutorialSidebarV2Module,
  ...tutorialPageContentV2Module,
  
  // Phase 1 P0: Gap Remediation - Analytics
  ...analyticsLearningMetricsModule,
  ...analyticsArchitecturePerformanceModule,
  ...analyticsBrandBusinessModule,
  
  // Phase 2B: Layman Hardening
  ...laymanAuditLogsModule,
  ...laymanPromptHistoryModule,
  ...laymanContentRevisionsModule,
  
  // Legacy System (Preserved for Migration)
  ...tutorialContentModule,
  ...tutorialDomainsModule,
  ...tutorialContentVersionsModule,
  ...tutorialContentAuditModule,
  ...tutorialAssignmentsModule,
  ...assignmentProgressModule,
  ...assignmentHelpRequestsModule,
  ...tutorialSubjectsModule,
  ...tutorialTopicsModule,
  ...tutorialSubtopicsModule,
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
