import type { BlockRegistryEntry } from './types';

/**
 * Append-only Composer registry surface owned by Project LLM placement.
 *
 * Static product families stay in entries/. Approved external blocks are added
 * here as hash-bound operations, avoiding edits to registry/index.ts.
 */
export const GENERATED_BLOCK_REGISTRIES: readonly BlockRegistryEntry[] = [
  {
    id: 'objective',
    label: "Objective",
    versions: [
      {
        id: "o3",
        code: 'O3',
        label: "O3 - Objective",
        description: "Presents observable, action-oriented skill objectives structured by Skill Verb, Action Description, and Expected Result.",
        getDefaultPayload: () => ({
          "eyebrow": "SKILL-BASED OBJECTIVES",
          "title": "What You Will Be Able To Do",
          "introduction": "By the end of this lesson, you will be able to demonstrate the following practical skills.",
          "objectives": [
                    {
                              "id": "skill-create",
                              "label": "Create",
                              "text": "Create Python lists containing multiple values.",
                              "expectedResult": "A valid list containing the required values."
                    },
                    {
                              "id": "skill-access",
                              "label": "Access",
                              "text": "Access list elements using positive and negative indexing.",
                              "expectedResult": "Correct elements are retrieved from the list."
                    },
                    {
                              "id": "skill-modify",
                              "label": "Modify",
                              "text": "Modify list contents using indexing, slicing, and built-in methods.",
                              "expectedResult": "The list contains the intended updated values."
                    },
                    {
                              "id": "skill-debug",
                              "label": "Debug",
                              "text": "Identify and correct common list-indexing errors.",
                              "expectedResult": "The corrected program executes without IndexError exceptions."
                    }
          ]
}),
      },
      {
        id: "o1",
        code: 'O1',
        label: "O1 - Objective",
        description: "Presents learning objectives with numbered step badges and category pills.",
        getDefaultPayload: () => ({
          "eyebrow": "LEARNING OBJECTIVES",
          "title": "Skills You Will Develop in This Lesson",
          "titleHighlight": "Will Develop",
          "introduction": "By the end of this lesson, you will have the following practical skills:",
          "objectives": [
                    {
                              "id": "obj-1",
                              "verb": "Create",
                              "title": "Create and initialize lists",
                              "text": "Create Python lists using different methods and initialize them with values.",
                              "badge": "Practical Skill",
                              "icon": "create"
                    }
          ],
          "note": {
                    "title": "Note",
                    "text": "These are observable, practical skills you will develop in this lesson."
          }
}),
      },
    ],
  },
  // PROJECT_LLM_GENERATED_REGISTRIES
];
