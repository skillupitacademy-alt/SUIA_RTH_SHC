export * from './jobs';
export * from './report';
export * from './feature-flags';
export * from './tutorial-content.types';
export * from './assignment.types';
export * from './assignment-errors';
export * from './remediation.types';
export * from './live-session.types';
export * from './project.types';
export * from './project-errors';
export * from './tutorial-content.schema';
export * from './tutorial-section-contracts';
export * from './tutorial-repositories.types';
export * from './portal';

// Rich Tutorial Document Model (Schema Version 1)
export * from './tutorial-rich-document';

// NEW Tutorial Composer (API Contracts & Domain Types)
// Selective exports to avoid naming conflicts
export type {
  SectionType as ComposerSectionType,
  Difficulty,
  SectionStatus,
  BrandId,
  CreateTutorialSectionRequest,
  UpdateTutorialSectionRequest,
  PublishTutorialSectionRequest,
  TutorialSectionResponse,
  ListTutorialSectionsQuery,
  ListTutorialSectionsResponse,
  RawContentSourceType,
  ImportOptions,
  ImportedContentStats,
  RawContentImportRequest,
  RawContentImportResponse,
  QualityStatus,
  AnalysisSectionLevel,
  AnalysisSection,
  SmartSuggestion,
  ContentAnalysisResult,
  BlockSuggestionKind,
  BlockSuggestionType,
  ConfidenceLevel,
  SuggestionStatus,
  BlockSuggestion,
  BlockSuggestionStatistics,
  SourcePreview,
  BlockSuggestionResult,
  BlockSuggestionsRequest,
  BlockSuggestionsResponse,
  ApiErrorCode,
  ValidationErrorDetail,
  ApiErrorResponse,
} from './tutorial-composer/contracts';

export {
  SectionTypeSchema as ComposerSectionTypeSchema,
  DifficultySchema,
  SectionStatusSchema,
  BrandIdSchema,
  CreateTutorialSectionRequestSchema,
  UpdateTutorialSectionRequestSchema,
  PublishTutorialSectionRequestSchema,
  TutorialSectionResponseSchema,
  ListTutorialSectionsQuerySchema,
  ListTutorialSectionsResponseSchema,
  RawContentSourceTypeSchema,
  ImportOptionsSchema,
  ImportedContentStatsSchema,
  RawContentImportRequestSchema,
  RawContentImportResponseSchema,
  QualityStatusSchema,
  AnalysisSectionLevelSchema,
  AnalysisSectionSchema,
  SmartSuggestionSchema,
  ContentAnalysisResultSchema,
  BlockSuggestionKindSchema,
  BlockSuggestionTypeSchema,
  ConfidenceLevelSchema,
  SuggestionStatusSchema,
  BlockSuggestionSchema,
  BlockSuggestionStatisticsSchema,
  SourcePreviewSchema,
  BlockSuggestionResultSchema,
  BlockSuggestionsRequestSchema,
  BlockSuggestionsResponseSchema,
  ApiErrorCode as ApiErrorCodeSchema,
  ValidationErrorDetailSchema,
  ApiErrorResponseSchema,
  createSuccessResponse,
  createErrorResponse,
} from './tutorial-composer/contracts';

export * from './tutorial-composer/errors';

// Tutorial Composer - Apply Suggestion Contracts (Prompt 08 Wave 1)
export type {
  ApplySuggestionRequest,
  ApplySuggestionResponse,
  ApplySuggestionErrorCode,
  VersionConflictDetail,
  ApplySuggestionErrorResponse,
} from './tutorial-composer/apply-suggestion-contracts';

export {
  ApplySuggestionRequestSchema,
  ApplySuggestionResponseSchema,
  ApplySuggestionErrorCode as ApplySuggestionErrorCodeSchema,
  VersionConflictDetailSchema,
  ApplySuggestionErrorResponseSchema,
} from './tutorial-composer/apply-suggestion-contracts';
