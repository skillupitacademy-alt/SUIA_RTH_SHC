/**
 * Project LLM Creation Brief
 * 
 * Agent E contract surface for creation brief generation and validation.
 */

/**
 * Target stage for creation brief workflow
 */
export type CreationBriefTargetStage = 'GUI_PROTOTYPE' | 'REACT_TYPESCRIPT_CANDIDATE';

/**
 * Artifact types required for creation
 */
export type CreationBriefArtifact = 'HTML' | 'CSS' | 'JAVASCRIPT' | 'JSON' | 'REACT_TYPESCRIPT';

/**
 * Constraint severity levels
 */
export type CreationBriefConstraintSeverity = 'MANDATORY' | 'REQUIRED' | 'PROHIBITED';

/**
 * Individual constraint definition
 */
export interface CreationBriefConstraint {
  id: string;
  severity: CreationBriefConstraintSeverity;
  title: string;
  instruction: string;
}

/**
 * Reference implementation pattern context
 */
export interface CreationBriefReference {
  versionId: string;
  familyId: string;
  familyName: string;
  status: string;
  description: string;
  keyFiles: string[];
}

/**
 * Request for creation brief generation
 */
export interface CreationBriefRequest {
  requestId: string;
  targetFamilyId: string;
  targetVersionId: string;
  learningIntent: string;
  topic?: string;
  audience?: string;
  notes?: string;
  targetStage: CreationBriefTargetStage;
}

/**
 * Complete creation brief for external AI handoff
 */
export interface CreationBrief {
  briefId: string;
  requestId: string;
  generatedAt: string;
  target: {
    familyId: string;
    versionId: string;
    familyName: string;
  };
  stage: CreationBriefTargetStage;
  referenceImplementation?: CreationBriefReference;
  repositoryFacts: string[];
  objectives: string[];
  requiredArtifacts: CreationBriefArtifact[];
  constraints: CreationBriefConstraint[];
  runtimeRequirements: string[];
  externalAiWorkflow: string[];
  humanApprovalGate: string[];
  prohibitedActions: string[];
  validationChecklist: string[];
  promptText: string;
}
