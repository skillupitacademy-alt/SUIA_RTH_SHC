/**
 * Project LLM Block Corpus
 * 
 * Static TypeScript fixture enumerating all 18 educational block families
 * with their documented versions. Sourced from canonical documentation.
 * 
 * Invariant: 18 families, 132 total versions
 */

import {
  BlockFamilyReference,
  ProjectLlmCorpusRegistry,
  CORPUS_FAMILIES_TOTAL,
  CORPUS_VERSIONS_TOTAL,
} from '@quiz/types';

const BLOCK_FAMILIES: BlockFamilyReference[] = [
  {
    familyId: 'I',
    familyName: 'Introduction',
    documentedVersions: ['I1', 'I2', 'I3', 'I4', 'I5', 'I6'],
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    hasVerifiedImplementation: true,
  },
  {
    familyId: 'O',
    familyName: 'Objective',
    documentedVersions: ['O1', 'O2', 'O3', 'O4', 'O5'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'D',
    familyName: 'Definition',
    documentedVersions: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    hasVerifiedImplementation: true,
  },
  {
    familyId: 'C',
    familyName: 'Code',
    documentedVersions: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
    lifecycleStatus: 'RUNTIME_INTEGRATED',
    hasVerifiedImplementation: true,
  },
  {
    familyId: 'V',
    familyName: 'Visual',
    documentedVersions: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'CP',
    familyName: 'Comparison',
    documentedVersions: ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'E',
    familyName: 'Execution',
    documentedVersions: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'M',
    familyName: 'Memory',
    documentedVersions: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'MT',
    familyName: 'Mistake',
    documentedVersions: ['MT1', 'MT2', 'MT3', 'MT4', 'MT5', 'MT6', 'MT7', 'MT8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'BP',
    familyName: 'BestPractice',
    documentedVersions: ['BP1', 'BP2', 'BP3', 'BP4', 'BP5', 'BP6', 'BP7'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'S',
    familyName: 'Summary',
    documentedVersions: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    lifecycleStatus: 'IMPLEMENTED',
    hasVerifiedImplementation: false, // S1 is incomplete
  },
  {
    familyId: 'Q',
    familyName: 'Question',
    documentedVersions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'EX',
    familyName: 'Exercise',
    documentedVersions: ['EX1', 'EX2', 'EX3', 'EX4', 'EX5', 'EX6', 'EX7', 'EX8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'T',
    familyName: 'Task',
    documentedVersions: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'INT',
    familyName: 'Interactive',
    documentedVersions: ['INT1', 'INT2', 'INT3', 'INT4', 'INT5', 'INT6'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'QZ',
    familyName: 'Quiz',
    documentedVersions: ['QZ1', 'QZ2', 'QZ3', 'QZ4', 'QZ5', 'QZ6', 'QZ7', 'QZ8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'IV',
    familyName: 'Interview',
    documentedVersions: ['IV1', 'IV2', 'IV3', 'IV4', 'IV5', 'IV6', 'IV7'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
  {
    familyId: 'P',
    familyName: 'Project',
    documentedVersions: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
    lifecycleStatus: 'DOCUMENTED',
    hasVerifiedImplementation: false,
  },
];

// Compile-time invariant validation
const totalVersions = BLOCK_FAMILIES.reduce(
  (sum, family) => sum + family.documentedVersions.length,
  0
);

if (BLOCK_FAMILIES.length !== CORPUS_FAMILIES_TOTAL) {
  throw new Error(
    `Corpus invariant violation: Expected ${CORPUS_FAMILIES_TOTAL} families, got ${BLOCK_FAMILIES.length}`
  );
}

if (totalVersions !== CORPUS_VERSIONS_TOTAL) {
  throw new Error(
    `Corpus invariant violation: Expected ${CORPUS_VERSIONS_TOTAL} total versions, got ${totalVersions}`
  );
}

export const BLOCK_CORPUS_REGISTRY: ProjectLlmCorpusRegistry = {
  status: {
    families: 18,
    documentedVersions: 133,
  },
  families: BLOCK_FAMILIES,
  documentationSources: [
    'ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md',
    'ILS_UI_UX/docs/PROJECT_LLM_FAMILY_VERSION_MATRIX.md',
    'docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md',
  ],
};
