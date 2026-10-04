/**
 * Project LLM Repository Intelligence
 * 
 * Agent D: Static read-only repository intelligence fixture.
 * Phase 1 implementation using TypeScript fixtures derived from canonical docs.
 */

import {
  ProjectLlmRepositoryIntelligence,
  BlockVersionImplementationStatus,
  S1WarningRecord,
  ProjectLlmRuntimeRegistry,
  ImplementationPrimitive,
  RUNTIME_VERIFIED_COUNT,
  RUNTIME_INCOMPLETE_COUNT,
  RUNTIME_PLANNED_FAMILIES_COUNT,
} from '@quiz/types';
import { BLOCK_CORPUS_REGISTRY } from './projectLlmBlockCorpus';
import { REFERENCE_PATTERNS } from './projectLlmReferencePatterns';

// Verified runtime implementations (I1, C1, D1)
const VERIFIED_IMPLEMENTATIONS: BlockVersionImplementationStatus[] = [
  {
    versionId: 'I1',
    familyId: 'I',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx (lines 30-39: version router)',
      'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx (lines 117-119: 3/3 UBRC attributes)',
      'packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx (lines 88-92)',
    ],
    notes: '9-section canonical structure, component-level version routing',
  },
  {
    versionId: 'C1',
    familyId: 'C',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
      'packages/ui/src/tutorial/TutorialBlockRenderer.tsx (lines 76-86: renderer-level enforcement)',
      'packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx (475+ lines, 50+ test cases)',
    ],
    notes: 'Terminal window UI, renderer-level version enforcement (strictest pattern), strongest test coverage',
  },
  {
    versionId: 'D1',
    familyId: 'D',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx (lines 20-29: version router)',
      'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx (lines 82-84: 3/3 UBRC attributes)',
      'packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx (lines 319-356)',
    ],
    notes: 'Theme validation, component-level version routing',
  },
];

// Incomplete implementations (S1)
const INCOMPLETE_IMPLEMENTATIONS: BlockVersionImplementationStatus[] = [
  {
    versionId: 'S1',
    familyId: 'S',
    lifecycleStatus: 'IMPLEMENTED',
    ubrcCompliance: 'PARTIAL',
    versionRoutingPresent: false,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/SummaryBlock.tsx (34 lines, functional)',
      'packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx (lines 154-171: confirms missing version attribute)',
    ],
    notes: 'Missing data-block-version attribute (2/3 UBRC), no version routing — not reference-quality',
  },
];

// Planned families (15 families not yet implemented)
const PLANNED_FAMILY_IDS = ['O', 'V', 'CP', 'E', 'M', 'MT', 'BP', 'Q', 'EX', 'T', 'INT', 'QZ', 'IV', 'P'];

// 15 implementation primitives (building blocks, NOT educational families)
const IMPLEMENTATION_PRIMITIVES: ImplementationPrimitive[] = [
  { name: 'heading', description: 'H1-H6 semantic headings' },
  { name: 'paragraph', description: 'Text paragraphs' },
  { name: 'list', description: 'Ordered/unordered lists' },
  { name: 'table', description: 'Data tables' },
  { name: 'image', description: 'Image display with caption' },
  { name: 'callout', description: 'Info boxes (tip/warning/info variants)' },
  { name: 'example', description: 'Example container (NOT ExerciseBlock)' },
  { name: 'quote', description: 'Blockquote renderer' },
  { name: 'summary', description: 'Bullet list renderer (NOT SummaryBlock S1-S6 family)' },
  { name: 'diagram', description: 'Diagram container' },
  { name: 'comparison', description: 'Comparison table (NOT ComparisonBlock CP1-CP8 family)' },
  { name: 'two-column', description: '2-column layout container' },
  { name: 'three-column', description: '3-column layout container' },
  { name: 'card-grid', description: 'Card grid layout' },
  { name: 'timeline', description: 'Timeline visualization' },
];

// Compile-time validation
if (VERIFIED_IMPLEMENTATIONS.length !== RUNTIME_VERIFIED_COUNT) {
  throw new Error(
    `Runtime invariant violation: Expected ${RUNTIME_VERIFIED_COUNT} verified implementations, got ${VERIFIED_IMPLEMENTATIONS.length}`
  );
}

if (INCOMPLETE_IMPLEMENTATIONS.length !== RUNTIME_INCOMPLETE_COUNT) {
  throw new Error(
    `Runtime invariant violation: Expected ${RUNTIME_INCOMPLETE_COUNT} incomplete implementations, got ${INCOMPLETE_IMPLEMENTATIONS.length}`
  );
}

if (PLANNED_FAMILY_IDS.length !== RUNTIME_PLANNED_FAMILIES_COUNT) {
  throw new Error(
    `Runtime invariant violation: Expected ${RUNTIME_PLANNED_FAMILIES_COUNT} planned families, got ${PLANNED_FAMILY_IDS.length}`
  );
}

if (IMPLEMENTATION_PRIMITIVES.length !== 15) {
  throw new Error(
    `Primitives invariant violation: Expected 15 implementation primitives, got ${IMPLEMENTATION_PRIMITIVES.length}`
  );
}

// Runtime registry
const RUNTIME_REGISTRY: ProjectLlmRuntimeRegistry = {
  status: {
    verifiedImplementations: 3,
    incompleteImplementations: 1,
    plannedFamilies: 15,
  },
  verifiedImplementations: VERIFIED_IMPLEMENTATIONS,
  incompleteImplementations: INCOMPLETE_IMPLEMENTATIONS,
  plannedFamilyIds: PLANNED_FAMILY_IDS,
};

// S1 warning record
export const S1_WARNING: S1WarningRecord = {
  versionId: 'S1',
  familyId: 'S',
  familyName: 'Summary',
  reason: 'Missing S-type version enforcement — not a reference-quality implementation',
  lifecycleStatus: 'IMPLEMENTED',
  ubrcCompliance: 'PARTIAL',
};

// Complete repository intelligence
export const PROJECT_LLM_REPOSITORY_INTELLIGENCE: ProjectLlmRepositoryIntelligence = {
  corpus: BLOCK_CORPUS_REGISTRY,
  runtime: RUNTIME_REGISTRY,
  primitives: {
    count: 15,
    list: IMPLEMENTATION_PRIMITIVES,
    description: 'Implementation building blocks, NOT educational families',
  },
  referencePatterns: [...REFERENCE_PATTERNS],
  sourceDocuments: [
    'ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md',
    'ILS_UI_UX/docs/PROJECT_LLM_FAMILY_VERSION_MATRIX.md',
    'ILS_UI_UX/docs/PROJECT_LLM_WORKFLOW_AGENT_ROADMAP.md',
    'docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md',
  ],
};
