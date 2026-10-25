import type { BlockRegistryEntry } from '../types';

/**
 * Objective Block Registry
 * 
 * Owns metadata for all Objective block versions (O1, ...)
 */
export const objectiveRegistry: BlockRegistryEntry = {
  id: 'objective',
  label: 'Objective',
  versions: [
    {
      id: 'v1',
      code: 'O1',
      label: 'O1 - Learning Objectives',
      description: 'Topic introduction with clear motivation, learning roadmap, and outcomes',
      getDefaultPayload: () => ({
        eyebrow: 'LEARNING OBJECTIVES',
        title: 'What You Will Learn',
        introduction: 'By the end of this lesson, you will be able to:',
        objectives: [
          { id: '1', text: 'Understand core concepts and architecture' },
          { id: '2', text: 'Build and customize interactive blocks' },
          { id: '3', text: 'Deploy and verify production components' },
        ],
      }),
    },
  ],
};
