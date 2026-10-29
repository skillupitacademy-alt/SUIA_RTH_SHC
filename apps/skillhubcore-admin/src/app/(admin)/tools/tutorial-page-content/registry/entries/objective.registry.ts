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
        title: 'Skills You Will Develop in This Lesson',
        titleHighlight: 'Develop in This Lesson',
        introduction: 'By the end of this lesson, you will have the following practical skills:',
        objectives: [
          {
            id: '1',
            verb: 'Create',
            title: 'Create and initialize lists',
            description: 'Create Python lists using different methods and initialize them with values.',
            badge: 'Practical Skill',
            icon: 'create',
          },
          {
            id: '2',
            verb: 'Access',
            title: 'Access list elements',
            description: 'Retrieve individual elements from a list using indexing and negative indexing.',
            badge: 'Core Skill',
            icon: 'access',
          },
          {
            id: '3',
            verb: 'Extract',
            title: 'Extract values using slicing',
            description: 'Use slicing to get a range of elements and create sublists.',
            badge: 'Core Skill',
            icon: 'extract',
          },
          {
            id: '4',
            verb: 'Modify',
            title: 'Modify list contents',
            description: 'Change, add, or remove elements in existing lists.',
            badge: 'Practical Skill',
            icon: 'modify',
          },
          {
            id: '5',
            verb: 'Use',
            title: 'Use common list methods',
            description: 'Apply built-in list methods such as append(), extend(), insert(), remove(), and sort().',
            badge: 'Practical Skill',
            icon: 'use',
          },
          {
            id: '6',
            verb: 'Explain',
            title: 'Explain list behavior',
            description: 'Describe how lists work, including mutability, ordering, and common characteristics.',
            badge: 'Understanding',
            icon: 'explain',
          },
        ],
        note: {
          title: 'Note',
          text: 'These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice.',
        },
      }),
    },
    {
      id: 'o2',
      code: 'O2',
      label: "O2 - Objective",
      description: "Organizes lesson learning outcomes into a three-tier cognitive progression: Know, Understand, and Apply.",
      getDefaultPayload: () => ({
        "title": "Example",
        "objectives": []
}),
    },
  ],
};
