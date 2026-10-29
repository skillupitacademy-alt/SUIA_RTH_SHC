/**
 * O1 Objective Block - AI Generation Prompt Template
 *
 * Common hierarchy and system metadata rules are centralized.
 * This file owns only the O1-specific content contract.
 */

import type { TutorialPromptContext } from '../../../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../../../prompts/tutorialPrompt.shared';

/**
 * Generate the AI prompt for O1 objective block content generation
 */
export function getObjectiveO1Prompt(
  context: TutorialPromptContext
): string {
  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS

Generate valid, production-ready objective content conforming strictly to the official platform schema.

Return valid JSON only.

Do not include markdown code fences.

# REQUIRED STRUCTURE

{
  "expectedTimeSec": <AI-estimated-value>,
  "eyebrow": "LEARNING OBJECTIVES",
  "title": "Skills You Will Develop in This Lesson",
  "titleHighlight": "Develop in This Lesson",
  "introduction": "By the end of this lesson, you will have the following practical skills:",
  "objectives": [
    {
      "id": "1",
      "verb": "Create",
      "title": "Create and initialize lists",
      "description": "Create Python lists using different methods and initialize them with values.",
      "badge": "Practical Skill",
      "icon": "create"
    },
    {
      "id": "2",
      "verb": "Access",
      "title": "Access list elements",
      "description": "Retrieve individual elements from a list using indexing and negative indexing.",
      "badge": "Core Skill",
      "icon": "access"
    },
    {
      "id": "3",
      "verb": "Extract",
      "title": "Extract values using slicing",
      "description": "Use slicing to get a range of elements and create sublists.",
      "badge": "Core Skill",
      "icon": "extract"
    },
    {
      "id": "4",
      "verb": "Modify",
      "title": "Modify list contents",
      "description": "Change, add, or remove elements in existing lists.",
      "badge": "Practical Skill",
      "icon": "modify"
    },
    {
      "id": "5",
      "verb": "Use",
      "title": "Use common list methods",
      "description": "Apply built-in list methods such as append(), extend(), insert(), remove(), and sort().",
      "badge": "Practical Skill",
      "icon": "use"
    },
    {
      "id": "6",
      "verb": "Explain",
      "title": "Explain list behavior",
      "description": "Describe how lists work, including mutability, ordering, and common characteristics.",
      "badge": "Understanding",
      "icon": "explain"
    }
  ],
  "note": {
    "title": "Note",
    "text": "These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice."
  }
}

# expectedTimeSec Estimation for O1 Blocks

After generating the complete objective content above, estimate expectedTimeSec by considering:

- Eyebrow + title reading time (~10-20 sec)
- Introduction reading (~15-30 sec)
- Objective cards comprehension (~20-40 sec per objective)
- Note / synthesis reading (~15-20 sec)

Replace <AI-estimated-value> with your assessment as a positive integer (seconds).
Typical range: 120-240 seconds.
See the GLOBAL BLOCK METADATA section for complete estimation guidelines.

# CONTENT GUIDELINES

1. Structure 3 to 6 actionable, observable learning objectives.
2. Each objective must have an action verb (e.g., Create, Access, Extract, Modify, Use, Explain, Implement, Analyze).
3. The title must be concise and describe the capability.
4. The description must clearly state what the learner can do and with what concepts.
5. Badges should categorize the skill level (e.g., "Core Skill", "Practical Skill", "Understanding").
6. The icon key should describe the action (e.g., "create", "access", "extract", "modify", "use", "explain", "code", "target").
7. The note summarizes the educational outcome and connects to the upcoming lesson practice.
8. Do NOT include layout metadata, styles, or markdown code fences.`
  );
}
