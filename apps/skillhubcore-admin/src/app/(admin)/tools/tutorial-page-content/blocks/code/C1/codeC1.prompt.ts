/**
 * C1 Code Block - AI Generation Prompt Template
 * 
 * This prompt is used by the Tutorial Composer's AI instruction panel
 * to help authors generate C1 code block content.
 */

export interface PromptContext {
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  blockName: string;
  versionName: string;
  versionId: string;
}

/**
 * Generate the AI prompt for C1 code block content generation
 */
export function getCodeC1Prompt(context: PromptContext): string {
  const { domainName, subjectName, topicName, subtopicName, blockName, versionName, versionId } = context;
  
  return `You are generating educational content for a tutorial platform.

# TARGET HIERARCHY
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}
- Block: ${blockName}
- Version: ${versionName}

# OUTPUT REQUIREMENTS
Generate valid, production-ready code (${versionId.toUpperCase()}) content conforming strictly to the official platform schema without system metadata or styling fields.`;
}
