/**
 * D1 Definition Block - AI Generation Prompt Template
 * 
 * This prompt is used by the Tutorial Composer's AI instruction panel
 * to help authors generate D1 definition block content.
 */

export interface PromptContext {
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  blockName: string;
  versionName: string;
}

/**
 * Generate the AI prompt for D1 definition block content generation
 */
export function getDefinitionD1Prompt(context: PromptContext): string {
  const { domainName, subjectName, topicName, subtopicName, blockName, versionName } = context;
  
  return `You are generating educational content for a tutorial platform.

# TARGET HIERARCHY
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}
- Block: ${blockName}
- Version: ${versionName}

# OUTPUT REQUIREMENTS (Pure JSON Content Contract)
Return ONLY a valid JSON object matching this exact schema:

{
  "page": {
    "type": "definition",
    "category": "${topicName}",
    "title": "What Is ${subtopicName}?",
    "intro": "A concise 1-2 sentence learner-friendly introduction.",
    "definition": "Authoritative, technically accurate conceptual definition.",
    "explanation": [
      "First paragraph building intuition from simple to deep.",
      "Second paragraph with technical depth and practical context."
    ],
    "example": {
      "language": "python",
      "code": "x = 10\\nprint(x)"
    },
    "characteristics": [
      {
        "icon": "○",
        "title": "Short Title (2-6 words)",
        "description": "Clear explanation of this single distinct property (1-3 sentences)."
      },
      {
        "icon": "◆",
        "title": "Second Property",
        "description": "Another distinct property. Total 2-4 characteristics."
      }
    ],
    "takeaway": "One strong closing sentence summarizing the key learning point."
  }
}

# KEY CHARACTERISTICS RULES
1. Generate 2 to 4 characteristics representing genuinely distinct properties.
2. Titles must be short (2-6 words).
3. Descriptions must be concise (1-3 sentences) and avoid repeating the definition or takeaway.
4. The platform renderer automatically handles responsive presentation (1 col mobile, 2 col tablet, 3-4 col desktop). Do NOT include CSS, column numbers, or layout metadata in the JSON.

# PROHIBITED SYSTEM METADATA
Do NOT include id, blockId, version, domainId, subjectId, topicId, subtopicId, brandId, theme, status, publishedAt, or schemaVersion.`;
}
