/* istanbul ignore file */
export * from './db';
export * from './schema';
export * from './repositories';
export * from './live-session.service';
export * from './vector.service';

// Phase 2B Week 1: Core Services
export * from './services/layman.service';

// Phase 2B Week 2: Human-in-the-Loop AI Governance
export * from './services/layman-prompt-builder.service';
export * from './services/layman-content-parser.service';
export * from './services/layman-content-validation.service';

// Phase 2B Week 2: Hardening Services
export * from './services/layman-audit.service';
export * from './services/layman-prompt-integrity.service';
export * from './services/layman-content-sanitization.service';
export * from './services/layman-revision.service';

// Tutorial Composer - NEW architecture (Prompt 04)
export { tutorialComposerService } from './services/tutorial-composer.service';
export type { TutorialComposerServiceContext } from './services/tutorial-composer.service';

// Tutorial Raw Content Import - NEW architecture (Prompt 05)
export { tutorialImportService, TutorialImportService } from './services/tutorial-import.service';
export { MarkdownParser } from './services/parsers/markdown-parser';
export { HtmlParser } from './services/parsers/html-parser';
export { PlainTextParser } from './services/parsers/plain-text-parser';
export { safeUrlFetcher, SafeUrlFetcher } from './services/parsers/safe-url-fetcher';
export type { IRawContentParser, ParsedBlockResult } from './services/parsers/raw-content-parser.interface';

// Tutorial Content Analysis - NEW architecture (Prompt 06)
export { contentAnalysisService, ContentAnalysisService } from './services/content-analysis.service';

// Tutorial Block Suggestions - NEW architecture (Prompt 07B)
export { blockSuggestionService, BlockSuggestionService } from './services/block-suggestion.service';
export type { SuggestionContext } from './services/block-suggestion.service';

// Tutorial Suggestion Application - NEW architecture (Prompt 08)
export { suggestionApplicationService, SuggestionApplicationService } from './services/suggestion-application.service';
export type { ApplySuggestionInput, ApplySuggestionResult } from './services/suggestion-application.service';

// Tutorial Delivery - V2 Architecture
export { tutorialDeliveryService, TutorialDeliveryService } from './services/tutorial-delivery.service';
export type { DeliveredTutorial, TutorialDeliveryV2, DeliveryOptions } from './services/tutorial-delivery.service';
export { SubtopicNotFoundError, TutorialNotFoundError, InvalidTutorialContentError } from './services/tutorial-delivery.service';

// Tutorial Content Sanitization - NEW architecture (Prompt 12)
export { tutorialContentSanitizationService, TutorialContentSanitizationService } from './services/tutorial-content-sanitization.service';
export type { SanitizationResult } from './services/tutorial-content-sanitization.service';

// Tutorial Presentation Ideas - NEW architecture (Prompt 14B)
export { presentationIdeasService, PresentationIdeasService } from './services/presentation-ideas.service';
export type { PresentationIdeasContext } from './services/presentation-ideas.service';

// Composer Draft Generator - NEW architecture (Prompt 16B)
export { ComposerDraftGeneratorService } from './services/composer-draft-generator.service';
export type {
  ReviewStatus,
  ReviewModification,
  ReviewableSuggestionItem,
  TutorialComposerFinalReview,
  GenerateComposerDraftInput,
  GenerateComposerDraftResult,
} from './services/composer-draft-generator.service';

// AI Context Builder - Phase 1E
export { buildDefinitionD1AIContext } from './services/ai-context-builder';
export type { ComposerSelection } from './services/ai-context-builder';

// Canonical Block Builder - Phase 1G + Phase 2C
export { buildCanonicalDefinitionD1Block, buildCanonicalCodeC1Block } from './services/canonical-block-builder';

// Tutorial Document Builder - Phase 1G
export { buildTutorialDocument } from './services/tutorial-document-builder';

// Definition D1 Prompt Generator - Phase 1I
export { buildDefinitionD1AIPrompt } from './services/definition-d1-prompt-generator';

// Code C1 Prompt Generator - Phase 2B
export { buildCodeC1AIPrompt } from './services/code-c1-prompt-generator';
export { buildCodeC1AIContext } from './services/ai-context-builder';

// Validators, Types, DTOs
export * from './validators/layman.validator';

export * from './types/layman.types';
export * from './types/layman-prompt.types';
export * from './dto/layman.dto';
export * from './dto/layman-prompt.dto';

export { withTimeout, QUICK_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, REPORT_QUERY_TIMEOUT, MIGRATION_TIMEOUT, QueryTimeoutError } from '@quiz/db';
