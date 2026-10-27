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
} from '@quiz/types';
import { BLOCK_CORPUS_REGISTRY } from './projectLlmBlockCorpus';
import { REFERENCE_PATTERNS } from './projectLlmReferencePatterns';

// Runtime implementations backed by their current component, registry, and renderer paths.
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
  {
    versionId: 'O1',
    familyId: 'O',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/ObjectiveO1Block.tsx',
      'packages/ui/src/tutorial/TutorialBlockRenderer.tsx',
      'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts',
    ],
    notes: 'Project LLM-certified Objective version with Composer registration.',
  },
  {
    versionId: 'O2',
    familyId: 'O',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/ObjectiveO2Block.tsx',
      'packages/ui/src/tutorial/blocks/__tests__/ObjectiveO2Block.test.tsx',
      'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts',
    ],
    notes: 'Objective version registered in Composer and routed by TutorialBlockRenderer.',
  },
  {
    versionId: 'O3',
    familyId: 'O',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/ObjectiveO3Block.tsx',
      'packages/ui/src/tutorial/blocks/__tests__/ObjectiveO3Block.test.tsx',
      'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts',
      'packages/ui/src/tutorial/generatedBlockRenderers.tsx',
    ],
    notes: 'Skill-based Objective version placed in generated catalogs via Project LLM.',
  },
  {
    versionId: 'S1',
    familyId: 'S',
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    ubrcCompliance: 'FULL',
    versionRoutingPresent: true,
    implementationEvidence: [
      'packages/ui/src/tutorial/blocks/SummaryBlock.tsx (BlockShell with 3/3 UBRC attributes)',
      'packages/ui/src/tutorial/blocks/__tests__/UbaRefactoredBlocks.test.tsx (10 passing unit tests)',
      'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/summary.registry.ts',
    ],
    notes: 'Unified UBA Summary renderer with cards, action items, chips, and 3/3 UBRC attributes.',
  },
];

// Incomplete implementations (empty as S1 was promoted to full UBA and 3/3 UBRC)
const INCOMPLETE_IMPLEMENTATIONS: BlockVersionImplementationStatus[] = [];

const ALL_PLANNED_FAMILY_IDS = ['O', 'V', 'CP', 'E', 'M', 'MT', 'BP', 'Q', 'EX', 'T', 'INT', 'QZ', 'IV', 'P'];
const IMPLEMENTED_FAMILY_IDS = new Set(VERIFIED_IMPLEMENTATIONS.map((item) => item.familyId));
const PLANNED_FAMILY_IDS = ALL_PLANNED_FAMILY_IDS.filter((id) => !IMPLEMENTED_FAMILY_IDS.has(id));

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

if (IMPLEMENTATION_PRIMITIVES.length !== 15) {
  throw new Error(
    `Primitives invariant violation: Expected 15 implementation primitives, got ${IMPLEMENTATION_PRIMITIVES.length}`
  );
}

// Runtime registry
const RUNTIME_REGISTRY: ProjectLlmRuntimeRegistry = {
  status: {
    verifiedImplementations: VERIFIED_IMPLEMENTATIONS.length,
    incompleteImplementations: INCOMPLETE_IMPLEMENTATIONS.length,
    plannedFamilies: PLANNED_FAMILY_IDS.length,
  },
  verifiedImplementations: VERIFIED_IMPLEMENTATIONS,
  incompleteImplementations: INCOMPLETE_IMPLEMENTATIONS,
  plannedFamilyIds: PLANNED_FAMILY_IDS,
};

// S1 warning record (historical canonical fixture)
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
