/**
 * Project LLM Reference Implementation Patterns
 * 
 * I1, C1, D1 as reference-quality implementations.
 */

import { ReferenceImplementationPattern } from '@quiz/types';

export const I1_REFERENCE_PATTERN: ReferenceImplementationPattern = {
  versionId: 'I1',
  familyId: 'I',
  familyName: 'Introduction',
  lifecycleStatus: 'RUNTIME_INTEGRATED',
  ubrcCompliance: 'FULL',
  keyFiles: [
    'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
    'packages/ui/src/tutorial/TutorialBlockRenderer.tsx',
    'packages/types/src/tutorial-rich-document/registries/introduction-versions.ts',
    'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/introduction.registry.ts',
  ],
  description:
    'I1 (Basic Topic Introduction) — 9-section canonical structure with version routing, 3/3 UBRC attributes, theme-aware rendering. Component-level version routing.',
};

export const C1_REFERENCE_PATTERN: ReferenceImplementationPattern = {
  versionId: 'C1',
  familyId: 'C',
  familyName: 'Code',
  lifecycleStatus: 'RUNTIME_INTEGRATED',
  ubrcCompliance: 'FULL',
  keyFiles: [
    'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
    'packages/ui/src/tutorial/TutorialBlockRenderer.tsx',
    'packages/types/src/tutorial-rich-document/registries/code-versions.ts',
    'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/code.registry.ts',
    'packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx',
  ],
  description:
    'C1 (Basic Code Example) — Terminal window UI, memory model rendering, 3/3 UBRC attributes, 50+ test cases. Renderer-level version enforcement (strictest pattern).',
};

export const D1_REFERENCE_PATTERN: ReferenceImplementationPattern = {
  versionId: 'D1',
  familyId: 'D',
  familyName: 'Definition',
  lifecycleStatus: 'RUNTIME_INTEGRATED',
  ubrcCompliance: 'FULL',
  keyFiles: [
    'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx',
    'packages/ui/src/tutorial/TutorialBlockRenderer.tsx',
    'packages/types/src/tutorial-rich-document/registries/definition-versions.ts',
    'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/definition.registry.ts',
  ],
  description:
    'D1 (Classic Definition) — Theme validation, 3/3 UBRC attributes, component-level version routing.',
};

export const REFERENCE_PATTERNS = [
  I1_REFERENCE_PATTERN,
  C1_REFERENCE_PATTERN,
  D1_REFERENCE_PATTERN,
] as const;
