/**
 * Layman Prompt Types
 * Phase 2B Week 2 - Human-in-the-Loop AI Governance
 * --------------------------------------------------
 * Type definitions for prompt generation and content ingestion
 */

/**
 * Prompt Generation Request
 */
export interface PromptGenerationRequest {
  subtopicId: string;
  topicName: string;
  subtopicName?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  brandId: string;
  promptTemplateName?: string;
  educationalArchitectureName?: string;
  learnerType?: string;
  requestedBy: string;
}

/**
 * Generated Prompt Result
 */
export interface GeneratedPrompt {
  id: string;
  title: string;
  systemPrompt: string;
  userPrompt: string;
  fullPrompt: string;
  exportFormat: string;
  copyableText: string;
  metadata: {
    templateName: string;
    templateVersion: number;
    topicName: string;
    subtopicName?: string;
    difficulty: string;
    brandId: string;
    educationalArchitecture?: string;
    generatedAt: Date;
    generatedBy: string;
  };
  governanceStatus: 'prompt_generated' | 'prompt_copied' | 'response_received';
}

/**
 * AI Response Ingestion Request
 */
export interface AIResponseIngestionRequest {
  promptId: string;
  rawAIResponse: string;
  aiProvider?: 'chatgpt' | 'claude' | 'gemini' | 'other';
  submittedBy: string;
}

/**
 * Parsed Content Structure
 */
export interface ParsedLaymanContent {
  analogy?: string;
  beginnerBreakdown?: string;
  mentalModel?: string;
  useCase?: string;
  faq?: Array<{ question: string; answer: string }>;
  summary?: string;
  motivation?: string;
}

/**
 * Content Validation Result
 */
export interface ContentValidationResult {
  isValid: boolean;
  qualityScore: number;
  hallucinationRisk: number;
  completenessScore: number;
  errors: string[];
  warnings: string[];
  missingSubsections: string[];
  governanceStatus: 'draft' | 'revision_required' | 'pending_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

/**
 * Content Ingestion Result
 */
export interface ContentIngestionResult {
  sectionId: string;
  parsed: ParsedLaymanContent;
  validation: ContentValidationResult;
  governanceStatus: string;
  nextAction: 'revise' | 'submit_for_review' | 'publish';
  createdAt: Date;
}

/**
 * Prompt Export Format
 */
export interface PromptExportFormat {
  format: 'plain' | 'markdown' | 'json';
  content: string;
  instructions: string;
}

/**
 * Governance Workflow State
 */
export interface GovernanceWorkflowState {
  currentStatus: 'draft' | 'pending_review' | 'in_review' | 'changes_requested' | 'approved' | 'rejected' | 'deployed';
  history: Array<{
    status: string;
    timestamp: Date;
    userId: string;
    notes?: string;
  }>;
  assignedReviewer?: string;
  reviewDeadline?: Date;
}

/**
 * Prompt Template Variables
 */
export interface PromptTemplateVariables {
  topicName: string;
  subtopicName?: string;
  difficulty?: string;
  learnerType?: string;
  brandTone?: string;
  educationalArchitecture?: string;
  customVariables?: Record<string, string>;
}
