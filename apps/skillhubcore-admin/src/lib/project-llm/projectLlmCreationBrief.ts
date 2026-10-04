/**
 * Project LLM Creation Brief Engine
 * 
 * Agent E: Deterministic creation brief generator that converts
 * block creation requests + repository intelligence into structured
 * external AI handoff briefs.
 */

import {
  CreationBrief,
  CreationBriefRequest,
  CreationBriefReference,
  CreationBriefConstraint,
  CreationBriefArtifact,
} from '@quiz/types';
import { PROJECT_LLM_REPOSITORY_INTELLIGENCE } from './projectLlmRepositoryIntelligence';
import { REFERENCE_PATTERNS } from './projectLlmReferencePatterns';

/**
 * Validate repository intelligence integrity before brief generation.
 * Throws if corpus/runtime counts don't match expected constants.
 */
export function assertRepositoryIntelligenceIntegrity(): void {
  const { corpus, runtime } = PROJECT_LLM_REPOSITORY_INTELLIGENCE;

  if (corpus.status.families !== 18) {
    throw new Error(
      `Agent E STOP: corpus.status.families is ${corpus.status.families} but expected 18. Repository intelligence integrity compromised.`
    );
  }

  if (corpus.status.documentedVersions !== 133) {
    throw new Error(
      `Agent E STOP: corpus.status.documentedVersions is ${corpus.status.documentedVersions} but expected 133. Repository intelligence integrity compromised.`
    );
  }

  if (runtime.status.verifiedImplementations !== 3) {
    throw new Error(
      `Agent E STOP: runtime.status.verifiedImplementations is ${runtime.status.verifiedImplementations} but expected 3. Repository intelligence integrity compromised.`
    );
  }

  if (runtime.status.incompleteImplementations !== 1) {
    throw new Error(
      `Agent E STOP: runtime.status.incompleteImplementations is ${runtime.status.incompleteImplementations} but expected 1. Repository intelligence integrity compromised.`
    );
  }

  if (runtime.status.plannedFamilies !== 14) {
    throw new Error(
      `Agent E STOP: runtime.status.plannedFamilies is ${runtime.status.plannedFamilies} but expected 14. Repository intelligence integrity compromised.`
    );
  }
}

/**
 * Resolve family name from family ID
 */
export function resolveFamilyName(familyId: string): string | undefined {
  const family = PROJECT_LLM_REPOSITORY_INTELLIGENCE.corpus.families.find(
    (f) => f.familyId === familyId
  );
  return family?.familyName;
}

/**
 * Check if target version exists in family's documented versions
 */
export function resolveTargetVersion(familyId: string, versionId: string): boolean {
  const family = PROJECT_LLM_REPOSITORY_INTELLIGENCE.corpus.families.find(
    (f) => f.familyId === familyId
  );
  if (!family) return false;
  return family.documentedVersions.includes(versionId);
}

/**
 * Resolve reference implementation pattern for a family
 */
export function resolveReference(familyId: string): CreationBriefReference | undefined {
  const pattern = REFERENCE_PATTERNS.find(
    (p) => p.familyId === familyId && p.lifecycleStatus === 'RUNTIME_INTEGRATED'
  );

  if (!pattern) return undefined;

  return {
    versionId: pattern.versionId,
    familyId: pattern.familyId,
    familyName: pattern.familyName,
    status: pattern.lifecycleStatus,
    description: pattern.description,
    keyFiles: [...pattern.keyFiles],
  };
}

/**
 * Build constraint list
 */
export function buildConstraints(): CreationBriefConstraint[] {
  return [
    {
      id: 'E-001',
      severity: 'MANDATORY',
      title: 'Prototype First',
      instruction:
        'Create HTML/CSS/JS/JSON prototype before any React/TypeScript code.',
    },
    {
      id: 'E-002',
      severity: 'MANDATORY',
      title: 'Human GUI Approval Required',
      instruction:
        'STOP after prototype delivery; wait for explicit human approval before proceeding to React/TypeScript.',
    },
    {
      id: 'E-003',
      severity: 'MANDATORY',
      title: 'Preserve Educational Intent',
      instruction:
        'Do not replace or restructure the pedagogical content structure.',
    },
    {
      id: 'E-004',
      severity: 'REQUIRED',
      title: 'UBRC Compatibility',
      instruction:
        'Block must implement UBRC DOM identity attributes (data-block-type, data-block-version, data-block-id).',
    },
    {
      id: 'E-005',
      severity: 'REQUIRED',
      title: 'Passive Runtime Participation',
      instruction:
        'Block must not call ILS APIs, must not embed navigation infrastructure, must not embed RSSB infrastructure.',
    },
    {
      id: 'E-006',
      severity: 'REQUIRED',
      title: 'Composer Compatibility',
      instruction:
        'Block must be renderable by TutorialBlockRenderer and authourable via Tutorial Composer.',
    },
    {
      id: 'E-007',
      severity: 'PROHIBITED',
      title: 'No Platform Architecture Changes',
      instruction:
        'Do not modify ILS, LSNB, RSSB, TutorialDocument, Composer, or TutorialBlockRenderer.',
    },
    {
      id: 'E-008',
      severity: 'PROHIBITED',
      title: 'No Autonomous Repository Mutation',
      instruction:
        'Do not commit, push, or deploy to any repository or environment.',
    },
  ];
}

/**
 * Build runtime requirements list
 */
export function buildRuntimeRequirements(): string[] {
  return [
    'Block must output UBRC-compatible DOM identity attributes (data-block-type, data-block-version, data-block-id).',
    'Block must not call ILS (Item/Learning Session) APIs directly.',
    'Block must not embed navigation or sidebar infrastructure (LSNB).',
    'Block must not embed Reactive Session State Bridge (RSSB) infrastructure.',
    'Block must consume existing runtime context passively via props only.',
    'Block must be compatible with TutorialDocument block rendering pipeline.',
    'Block must be routable by TutorialBlockRenderer version routing.',
    'Block must not hard-code SkillUp or RealTutorialHub brand-specific runtime behavior.',
  ];
}

/**
 * Build validation checklist
 */
export function buildValidationChecklist(): string[] {
  return [
    '[ ] GUI prototype complete and reviewed before React/TypeScript conversion',
    '[ ] Block family identity preserved (familyId, versionId, familyName match corpus)',
    '[ ] Educational intent and pedagogical structure preserved',
    '[ ] Reference implementation patterns (I1, C1, D1) considered',
    '[ ] UBRC DOM identity requirements accounted for',
    '[ ] No ILS API calls present',
    '[ ] No LSNB (navigation sidebar) infrastructure embedded',
    '[ ] No RSSB (reactive session state bridge) infrastructure embedded',
    '[ ] Composer (Tutorial Block Composer) compatibility verified',
    '[ ] TutorialDocument rendering pipeline compatibility verified',
    '[ ] No platform architecture changes introduced',
    '[ ] Human GUI approval recorded before React candidate submission',
  ];
}

/**
 * Build external AI workflow steps
 */
export function buildExternalAiWorkflow(): string[] {
  return [
    'Step 1: Read this entire brief carefully before writing any code.',
    'Step 2: Acknowledge the target block family, version, and learning intent.',
    'Step 3: Study the reference implementation section — understand the patterns to follow.',
    'Step 4: Review all MANDATORY and REQUIRED constraints before proceeding.',
    'Step 5: Create the GUI prototype artifacts (HTML, CSS, JavaScript, JSON content spec).',
    'Step 6: STOP. Deliver the prototype artifacts for human GUI review. Do NOT proceed to React/TypeScript until you receive explicit written approval.',
    'Step 7: After receiving human approval, create the React/TypeScript candidate component.',
    'Step 8: Verify all validation checklist items before delivering the candidate.',
    'Step 9: Deliver the candidate artifacts. Do not claim certification or integration — that is a separate process.',
  ];
}

/**
 * Build human approval gate instructions
 */
export function buildHumanApprovalGate(): string[] {
  return [
    'The human reviewer will evaluate the GUI prototype visually.',
    'Review criteria: visual fidelity to design intent, educational clarity, structural correctness.',
    'The reviewer will respond with one of: APPROVED, REJECTED, or NEEDS_CORRECTION.',
    'APPROVED: Proceed to React/TypeScript candidate creation (Step 7).',
    'REJECTED: Discard prototype. Request clarification and restart from Step 5.',
    'NEEDS_CORRECTION: Apply specified corrections to prototype, resubmit for review.',
    'GUI approval does NOT equal integration, certification, or deployment approval.',
  ];
}

/**
 * Build prohibited actions list
 */
export function buildProhibitedActions(): string[] {
  return [
    'Do not create or modify database migrations.',
    'Do not create backend services, REST APIs, or GraphQL schemas.',
    'Do not add Python, FastAPI, or any server-side runtime other than the existing Node.js stack.',
    'Do not integrate OpenAI, Anthropic, Gemini, or any other LLM provider.',
    'Do not store, reference, or request provider API credentials (such as provider API keys).',
    'Do not modify ILS (Item Learning Session), LSNB, or RSSB infrastructure.',
    'Do not modify TutorialBlockRenderer unless an approved implementation plan explicitly requires it.',
    'Do not modify TutorialDocument structure or Composer architecture.',
    'Do not deploy to production or any staging environment.',
    'Do not commit or push to any repository.',
    'Do not claim HAA certification or integration approval.',
  ];
}

/**
 * Build objectives list
 */
export function buildObjectives(
  request: CreationBriefRequest,
  familyName: string
): string[] {
  const objectives = [
    `Create ${familyName} ${request.targetVersionId} — a new block version for the ${familyName} family (${request.targetFamilyId}).`,
    `Preserve the following learning intent: ${request.learningIntent}`,
  ];

  if (request.topic) {
    objectives.push(`Target topic/domain: ${request.topic}`);
  }

  if (request.audience) {
    objectives.push(`Target audience: ${request.audience}`);
  }

  objectives.push(
    'Create a GUI prototype (HTML/CSS/JS/JSON) that is visually reviewable by a human before any React code is written.'
  );

  return objectives;
}

/**
 * Build complete prompt text
 */
export function buildPrompt(
  request: CreationBriefRequest,
  familyName: string,
  referenceImplementation: CreationBriefReference | undefined,
  repositoryFacts: string[],
  objectives: string[],
  constraints: CreationBriefConstraint[],
  runtimeRequirements: string[],
  externalAiWorkflow: string[],
  humanApprovalGate: string[],
  prohibitedActions: string[],
  validationChecklist: string[],
  briefId: string,
  generatedAt: string
): string {
  const sections: string[] = [];

  // Header
  sections.push(`=== CREATION BRIEF: ${familyName} ${request.targetVersionId} ===`);
  sections.push(`Generated: ${generatedAt}`);
  sections.push(`Brief ID: ${briefId}`);
  sections.push('---');

  // Target
  sections.push('## TARGET');
  sections.push(`Family: ${request.targetFamilyId} — ${familyName}`);
  sections.push(`Version: ${request.targetVersionId}`);
  sections.push('Stage: GUI_PROTOTYPE (Phase 1)');
  sections.push('---');

  // Objectives
  sections.push('## OBJECTIVES');
  objectives.forEach((obj, i) => {
    sections.push(`${i + 1}. ${obj}`);
  });
  sections.push('---');

  // Repository Facts
  sections.push('## REPOSITORY FACTS');
  repositoryFacts.forEach((fact, i) => {
    sections.push(`${i + 1}. ${fact}`);
  });
  sections.push('---');

  // Reference Implementation
  sections.push('## REFERENCE IMPLEMENTATION');
  if (referenceImplementation) {
    sections.push(`Version: ${referenceImplementation.versionId}`);
    sections.push(`Family: ${referenceImplementation.familyName}`);
    sections.push(`Status: ${referenceImplementation.status}`);
    sections.push(`Description: ${referenceImplementation.description}`);
    sections.push('');
    sections.push('Key Files:');
    referenceImplementation.keyFiles.forEach((file) => {
      sections.push(`- ${file}`);
    });
  } else {
    sections.push('No reference implementation available for this family.');
  }
  sections.push('---');

  // Mandatory Workflow
  sections.push('## MANDATORY WORKFLOW');
  externalAiWorkflow.forEach((step) => {
    sections.push(step);
  });
  sections.push('');
  sections.push(
    'IMPORTANT: STOP at Step 6 and wait for explicit human GUI approval before proceeding.'
  );
  sections.push('Only after approval, create the React/TypeScript candidate.');
  sections.push('---');

  // Constraints
  sections.push('## CONSTRAINTS');
  const mandatory = constraints.filter((c) => c.severity === 'MANDATORY');
  const required = constraints.filter((c) => c.severity === 'REQUIRED');
  const prohibited = constraints.filter((c) => c.severity === 'PROHIBITED');

  if (mandatory.length > 0) {
    sections.push('');
    sections.push('### MANDATORY');
    mandatory.forEach((c) => {
      sections.push(`${c.id}: ${c.title}`);
      sections.push(`  ${c.instruction}`);
    });
  }

  if (required.length > 0) {
    sections.push('');
    sections.push('### REQUIRED');
    required.forEach((c) => {
      sections.push(`${c.id}: ${c.title}`);
      sections.push(`  ${c.instruction}`);
    });
  }

  if (prohibited.length > 0) {
    sections.push('');
    sections.push('### PROHIBITED');
    prohibited.forEach((c) => {
      sections.push(`${c.id}: ${c.title}`);
      sections.push(`  ${c.instruction}`);
    });
  }
  sections.push('---');

  // Runtime Requirements
  sections.push('## RUNTIME REQUIREMENTS');
  runtimeRequirements.forEach((req, i) => {
    sections.push(`${i + 1}. ${req}`);
  });
  sections.push('');
  sections.push(
    'Note: No ILS API calls. No navigation (LSNB) infrastructure. No RSSB infrastructure.'
  );
  sections.push('---');

  // Prohibited Actions
  sections.push('## PROHIBITED ACTIONS');
  prohibitedActions.forEach((action, i) => {
    sections.push(`${i + 1}. ${action}`);
  });
  sections.push('---');

  // Validation Checklist
  sections.push('## VALIDATION CHECKLIST');
  validationChecklist.forEach((item) => {
    sections.push(item);
  });
  sections.push('---');

  // Human Approval Gate
  sections.push('## HUMAN APPROVAL GATE');
  humanApprovalGate.forEach((gate, i) => {
    sections.push(`${i + 1}. ${gate}`);
  });
  sections.push('---');

  // Final Instruction
  sections.push('## FINAL INSTRUCTION');
  sections.push(
    'You are acting as an external AI assistant. Your job is to create the artifacts described above.'
  );
  sections.push(
    'Do not call any external APIs. Do not request or store credentials. Do not deploy anything.'
  );
  sections.push(
    'Do not claim certification. Human approval is required at every gate.'
  );

  return sections.join('\n');
}

/**
 * Generate a complete creation brief from a request
 */
export function generateCreationBrief(request: CreationBriefRequest): CreationBrief {
  // Validate repository integrity first
  assertRepositoryIntelligenceIntegrity();

  // Validate request
  if (!request.requestId || request.requestId.trim() === '') {
    throw new Error('Agent E: requestId must not be empty');
  }

  if (!request.learningIntent || request.learningIntent.trim() === '') {
    throw new Error('Agent E: learningIntent must not be empty');
  }

  if (request.targetStage !== 'GUI_PROTOTYPE') {
    throw new Error(
      'Agent E: Phase 1 only supports GUI_PROTOTYPE stage. REACT_TYPESCRIPT_CANDIDATE is not available at Agent E.'
    );
  }

  // Resolve family
  const familyName = resolveFamilyName(request.targetFamilyId);
  if (!familyName) {
    throw new Error(
      `Agent E: Unknown family '${request.targetFamilyId}'. Not found in corpus.`
    );
  }

  // Validate version
  const versionExists = resolveTargetVersion(
    request.targetFamilyId,
    request.targetVersionId
  );
  if (!versionExists) {
    throw new Error(
      `Agent E: Version '${request.targetVersionId}' is not documented for family '${request.targetFamilyId}'.`
    );
  }

  // Resolve reference
  const referenceImplementation = resolveReference(request.targetFamilyId);

  // Build repository facts
  const repositoryFacts = [
    'Total families in corpus: 18',
    'Total documented versions: 133',
    'Verified runtime implementations: 3 (I1, C1, D1)',
    'Incomplete implementations: 1 (S1)',
    'Planned families: 14',
    'Implementation primitives available: 15',
  ];

  // Build all parts
  const objectives = buildObjectives(request, familyName);
  const constraints = buildConstraints();
  const runtimeRequirements = buildRuntimeRequirements();
  const externalAiWorkflow = buildExternalAiWorkflow();
  const humanApprovalGate = buildHumanApprovalGate();
  const prohibitedActions = buildProhibitedActions();
  const validationChecklist = buildValidationChecklist();

  // Generate metadata
  const briefId = `brief-${request.targetFamilyId}${request.targetVersionId}-${Date.now()}`;
  const generatedAt = new Date().toISOString();

  // Required artifacts for GUI prototype stage
  const requiredArtifacts: CreationBriefArtifact[] = ['HTML', 'CSS', 'JAVASCRIPT', 'JSON'];

  // Build prompt text
  const promptText = buildPrompt(
    request,
    familyName,
    referenceImplementation,
    repositoryFacts,
    objectives,
    constraints,
    runtimeRequirements,
    externalAiWorkflow,
    humanApprovalGate,
    prohibitedActions,
    validationChecklist,
    briefId,
    generatedAt
  );

  // Return complete brief
  return {
    briefId,
    requestId: request.requestId,
    generatedAt,
    target: {
      familyId: request.targetFamilyId,
      versionId: request.targetVersionId,
      familyName,
    },
    stage: request.targetStage,
    referenceImplementation,
    repositoryFacts,
    objectives,
    requiredArtifacts,
    constraints,
    runtimeRequirements,
    externalAiWorkflow,
    humanApprovalGate,
    prohibitedActions,
    validationChecklist,
    promptText,
  };
}

/**
 * Convenience function for generating I2 creation brief
 */
export function generateI2CreationBrief(
  request: Omit<CreationBriefRequest, 'targetFamilyId' | 'targetVersionId'>
): CreationBrief {
  return generateCreationBrief({
    ...request,
    targetFamilyId: 'I',
    targetVersionId: 'I2',
    targetStage: 'GUI_PROTOTYPE',
  });
}
