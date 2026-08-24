'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { universalNavigationTemplate } from './sample-navigation-tree';

interface AiGenerationPrerequisitesProps {
  domainName?: string;
  subjectName?: string;
  topicName?: string;
  subtopicName?: string;
}

/**
 * AI Generation Prerequisites Component
 * 
 * Displays hierarchy context and instructions for external AI models.
 * Provides copy-to-clipboard functionality for instructions + template.
 * 
 * Phase 0 only: Does NOT modify existing JSON editor or workflow.
 */
export function AiGenerationPrerequisites({
  domainName,
  subjectName,
  topicName,
  subtopicName,
}: AiGenerationPrerequisitesProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    const instructionsText = generateAiInstructions({
      domainName,
      subjectName,
      topicName,
      subtopicName,
    });

    const templateJson = JSON.stringify(
      { topics: universalNavigationTemplate },
      null,
      2
    );

    const combinedPrompt = `${instructionsText}\n\n${SEPARATOR}\nUNIVERSAL NAVIGATION TEMPLATE\n${SEPARATOR}\n\n${templateJson}`;

    try {
      await navigator.clipboard.writeText(combinedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="mt-5 mb-5 rounded-xl border border-blue-200 bg-blue-50/40 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
            🤖 AI Generation Prerequisites
          </span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-700">
            External AI
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Hierarchy Context */}
          <div className="rounded-lg border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold text-blue-900 mb-2">Selected Context:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold text-slate-600">Domain:</span>
                <span className="ml-2 text-slate-800">{domainName || 'Not selected'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Subject:</span>
                <span className="ml-2 text-slate-800">{subjectName || 'Not selected'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Topic:</span>
                <span className="ml-2 text-slate-800">{topicName || 'Not selected'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Subtopic:</span>
                <span className="ml-2 text-slate-800">{subtopicName || 'Not selected'}</span>
              </div>
            </div>
          </div>

          {/* Instructions Preview */}
          <div className="text-xs leading-relaxed text-slate-700 space-y-2">
            <p className="font-bold text-blue-900">
              Instructions for External AI:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-[11px] text-slate-600">
              <li>Every navigation node <strong>MUST</strong> contain an <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">id</code></li>
              <li>IDs must be lowercase alphanumeric only (no hyphens, underscores, or spaces)</li>
              <li>IDs must be unique within the navigation tree</li>
              <li>Generate IDs from semantic node names</li>
              <li>Each node <strong>SHOULD</strong> contain a short <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">description</code></li>
              <li>Use <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">"type": "group"</code> for containers, <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">"type": "page"</code> for tutorial pages</li>
              <li>Page nodes must not have children</li>
              <li>Do NOT include brand, theme, progress, or runtime data</li>
            </ul>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!domainName || !subjectName || !topicName}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Instructions + JSON Template
              </>
            )}
          </button>

          {!domainName || !subjectName || !topicName ? (
            <p className="text-xs text-center text-slate-500">
              Select hierarchy (Domain → Subject → Topic) to enable copy
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

const SEPARATOR = '============================================================';

function generateAiInstructions({
  domainName,
  subjectName,
  topicName,
  subtopicName,
}: AiGenerationPrerequisitesProps): string {
  return `${SEPARATOR}
TUTORIAL LEFT NAVIGATION GENERATION
${SEPARATOR}

Create the tutorial left navigation tree for:

Domain: ${domainName || 'Not selected'}
Subject: ${subjectName || 'Not selected'}
Topic: ${topicName || 'Not selected'}
Subtopic: ${subtopicName || 'Not selected'}

${SEPARATOR}
OUTPUT FORMATS
${SEPARATOR}

You may generate navigation in either JSON or Markdown format.
Both formats use the EXACT SAME semantic keys.

REQUIRED KEYS FOR EVERY NODE:
- id: stable navigation identity
- name: display label
- type: "group" or "page"

OPTIONAL KEYS:
- description: educational metadata (recommended)

${SEPARATOR}
IMPORTANT NAVIGATION ID RULES
${SEPARATOR}

Every navigation node MUST contain an "id".

ID RULES:

1. Use lowercase letters and numbers only.
2. Generate the ID from the semantic meaning of the node.
3. IDs must be readable.
4. IDs must be deterministic.
5. IDs must be unique across the entire navigation tree.
6. Do NOT use UUIDs.
7. Do NOT use database IDs.
8. Do NOT use array indexes.
9. Do NOT derive IDs from domain, subject, topic, or subtopic UUIDs.
10. Once an ID has been assigned, preserve that ID even if the display name changes.

IMPORTANT: The name-based fallback is only a safety mechanism for malformed 
input that omitted an ID. Your responsibility is to generate stable IDs that
do not change when presentation names are updated.

ID Generation Examples:

"JavaScript" → "javascript"
"JavaScript Fundamentals" → "javascriptfundamentals"
"What Is JavaScript?" → "whatisjavascript"
"Function Declaration" → "functiondeclaration"
"Let vs Var vs Const" → "letvsvarvsconst"

${SEPARATOR}
DESCRIPTION RULES
${SEPARATOR}

Each navigation node SHOULD contain a short "description".

The description must explain in a few words what the node covers.

Keep the description:
- concise
- meaningful
- educational
- specific to the node

Do not write a full lesson.
Do not write test questions.
Do not write recommendation logic.

${SEPARATOR}
TYPE RULES
${SEPARATOR}

Type must be explicitly declared (NOT inferred from structure).

- Use "group" for navigation containers
- Use "page" for actual tutorial pages
- Page nodes (type: "page") must NOT contain children
- Group nodes (type: "group") must contain children

${SEPARATOR}
STRUCTURE RULES
${SEPARATOR}

11. Preserve the Topic → Subtopic → Page hierarchy structure.
12. Do NOT include brand, theme, progress, status, or runtime data.
13. Return only the navigation (JSON or Markdown) following these rules.

${SEPARATOR}
JSON FORMAT EXAMPLE
${SEPARATOR}

{
  "topics": [
    {
      "id": "javascriptfundamentals",
      "name": "JavaScript Fundamentals",
      "type": "group",
      "description": "Core JavaScript programming concepts.",
      "children": [
        {
          "id": "variables",
          "name": "Variables",
          "type": "group",
          "description": "Declaring and using variables.",
          "children": [
            {
              "id": "letvsvarvsconst",
              "name": "Let vs Var vs Const",
              "type": "page",
              "description": "Explains the differences between variable declarations."
            }
          ]
        }
      ]
    }
  ]
}

${SEPARATOR}
MARKDOWN FORMAT EXAMPLE
${SEPARATOR}

- id: javascriptfundamentals
  name: JavaScript Fundamentals
  type: group
  description: Core JavaScript programming concepts.

  - id: variables
    name: Variables
    type: group
    description: Declaring and using variables.

    - id: letvsvarvsconst
      name: Let vs Var vs Const
      type: page
      description: Explains the differences between variable declarations.

MARKDOWN RULES:

- Each node starts with "- id:" or "- name:" (id is recommended but optional)
- Required keys: name, type
- Optional keys: id, description
- Indentation (2 spaces) represents children relationship ONLY
- Type is explicit (not inferred from indentation level)
- Use key/value syntax: "key: value"

${SEPARATOR}
IMPORTANT ABOUT THE TEMPLATE BELOW
${SEPARATOR}

The JSON template below is a STRUCTURAL REFERENCE ONLY.
- Do NOT blindly copy its example topic/page names (JavaScript, etc.)
- Generate the actual navigation tree appropriate for the supplied
  Domain, Subject, Topic, and Subtopic above
- Preserve the same structure and field conventions
- Return valid JSON or Markdown only

${SEPARATOR}
TEMPLATE REFERENCE
${SEPARATOR}

The existing universal navigation template is provided below as a
STRUCTURAL REFERENCE. Preserve its structure and adapt/replace its
example content for the requested hierarchy above.`;
}
