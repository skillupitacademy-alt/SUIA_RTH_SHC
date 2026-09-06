/**
 * C1 Code Block - AI Generation Prompt Template
 *
 * This file owns only the C1-specific generation instructions.
 *
 * Common hierarchy and metadata protection are centralized.
 */

import type { TutorialPromptContext } from '../../../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../../../prompts/tutorialPrompt.shared';

/**
 * Generate the AI prompt for C1 code block content generation
 */
export function getCodeC1Prompt(
  context: TutorialPromptContext
): string {
  const versionCode = context.versionId
    ? context.versionId.toUpperCase()
    : context.versionName.toUpperCase();

  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS

Generate valid, production-ready code (${versionCode}) content in the RICH AUTHORING FORMAT shown below.

Return ONLY valid JSON. Do NOT include markdown code fences.

# REQUIRED STRUCTURE

{
  "expectedTimeSec": 180,
  "page": {
    "type": "CODE + EXPLANATION",
    "title": "Example: [Descriptive Title]",
    "introduction": "2-3 sentence introduction explaining what this code example demonstrates and why it matters to learners."
  },
  "code": {
    "language": "Python",
    "prismLanguage": "python",
    "source": "# Complete, runnable code example\\nx = 10\\ny = 20\\nresult = x + y\\nprint(result)"
  },
  "explanation": {
    "steps": [
      {
        "number": 1,
        "code": "x = 10",
        "description": "Clear explanation of this line using <code>tags</code> for inline code references."
      },
      {
        "number": 2,
        "code": "y = 20",
        "description": "Next step explanation."
      }
    ]
  },
  "output": {
    "value": "30",
    "inputExample": {
      "description": "Optional: describe any required input"
    }
  },
  "memoryModel": {
    "type": "reference-flow",
    "description": "Explain how variables, objects, and values relate in this example.",
    "layout": {
      "type": "grid"
    },
    "columns": [
      {
        "id": "variables",
        "title": "Variables (References)",
        "width": "minmax(160px, 1fr)"
      },
      {
        "id": "objects",
        "title": "Objects in Memory",
        "width": "minmax(280px, 1.6fr)"
      },
      {
        "id": "values",
        "title": "Values",
        "width": "minmax(180px, 1fr)"
      }
    ],
    "nodes": [
      {
        "id": "variable-x",
        "label": "x",
        "column": "variables",
        "row": 1,
        "variant": "reference",
        "monospace": true
      },
      {
        "id": "object-x",
        "label": "id: 140723458765120",
        "column": "objects",
        "row": 1,
        "variant": "object",
        "monospace": true
      },
      {
        "id": "value-x",
        "label": "10 (int)",
        "column": "values",
        "row": 1,
        "variant": "value",
        "monospace": true
      }
    ],
    "connections": [
      {
        "id": "x-to-object-x",
        "from": "variable-x",
        "to": "object-x",
        "type": "reference",
        "fromSide": "right",
        "toSide": "left"
      },
      {
        "id": "object-x-to-value-x",
        "from": "object-x",
        "to": "value-x",
        "type": "value",
        "fromSide": "right",
        "toSide": "left"
      }
    ],
    "note": "Optional note explaining memory model representation."
  },
  "takeaway": {
    "items": [
      "First key learning point with <code>inline code</code>.",
      "Second key learning point.",
      "Third key learning point."
    ]
  },
  "tip": {
    "text": "Practical tip or challenge for learners to try."
  }
}

# IMPORTANT: expectedTimeSec METADATA

- expectedTimeSec is BLOCK METADATA at ROOT level
- It MUST NOT appear inside page, code, or any other section
- Use a whole positive number representing estimated completion time in seconds
- Example: 180 means 3 minutes

# MEMORY MODEL REQUIREMENTS

The memoryModel visualizes how variables, objects, and values relate during program execution:

1. **columns**: Define 3 columns (variables, objects, values)
2. **nodes**: Create nodes for each variable/object/value with:
   - unique id
   - label (what appears in the visualization)
   - column placement (variables/objects/values)
   - row number (1, 2, 3...)
   - variant (reference/object/value/result)
3. **connections**: Draw arrows showing:
   - variable → object (type: "reference")
   - object → value (type: "value")
4. **description**: Explain the conceptual model
5. **note**: Clarify that this is conceptual, not literal memory layout

# CODE REQUIREMENTS

- Must be complete, runnable code
- Use appropriate language for the topic
- Include comments where helpful
- Keep examples focused and pedagogically sound

# EXPLANATION REQUIREMENTS

- Number steps sequentially
- Focus each step on ONE specific code element
- Use <code>tags</code> for inline code references
- Explain WHY, not just WHAT

# TAKEAWAY REQUIREMENTS

- 3-6 concise bullet points
- Each captures ONE key learning
- Use <code>tags</code> for technical terms

# TIP REQUIREMENTS

- Practical challenge or experiment
- Encourages active learning
- Connects to the code example`
  );
}
