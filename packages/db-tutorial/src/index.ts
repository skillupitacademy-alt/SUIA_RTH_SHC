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

// Validators, Types, DTOs
export * from './validators/layman.validator';
export * from './types/layman.types';
export * from './types/layman-prompt.types';
export * from './dto/layman.dto';
export * from './dto/layman-prompt.dto';

export { withTimeout, QUICK_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, REPORT_QUERY_TIMEOUT, MIGRATION_TIMEOUT, QueryTimeoutError } from '@quiz/db';
