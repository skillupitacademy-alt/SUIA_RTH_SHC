import { getObjectiveO1Prompt } from '../blocks/objective/O1/objectiveO1.prompt';
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
        description: "Presents clear, scannable lesson learning goals and observable skills with 3-accent numbered StepBadge counters, category pills, and a summary CalloutBanner.",
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
                    },
                    {
                              "id": "obj-2",
                              "verb": "Access",
                              "title": "Access list elements",
                              "text": "Retrieve individual elements from a list using indexing and negative indexing.",
                              "badge": "Core Skill",
                              "icon": "access"
                    },
                    {
                              "id": "obj-3",
                              "verb": "Extract",
                              "title": "Extract values using slicing",
                              "text": "Use slicing to get a range of elements and create sublists.",
                              "badge": "Core Skill",
                              "icon": "extract"
                    },
                    {
                              "id": "obj-4",
                              "verb": "Modify",
                              "title": "Modify list contents",
                              "text": "Change, add, or remove elements in existing lists.",
                              "badge": "Practical Skill",
                              "icon": "modify"
                    },
                    {
                              "id": "obj-5",
                              "verb": "Use",
                              "title": "Use common list methods",
                              "text": "Apply built-in list methods such as append(), extend(), insert(), remove(), and sort().",
                              "badge": "Practical Skill",
                              "icon": "use"
                    },
                    {
                              "id": "obj-6",
                              "verb": "Explain",
                              "title": "Explain list behavior",
                              "text": "Describe how lists work, including mutability, ordering, and common characteristics.",
                              "badge": "Understanding",
                              "icon": "explain"
                    }
          ],
          "note": {
                    "title": "Note",
                    "text": "These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice."
          }
}),
      },
    ],
  },
  // PROJECT_LLM_GENERATED_REGISTRIES
];
