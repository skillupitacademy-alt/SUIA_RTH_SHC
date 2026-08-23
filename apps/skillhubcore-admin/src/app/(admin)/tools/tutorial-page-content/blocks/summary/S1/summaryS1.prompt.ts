/**
 * S1 Summary Block - AI Generation Prompt Template
 * 
 * This prompt is used by the Tutorial Composer's AI instruction panel
 * to help authors generate S1 summary block content.
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
 * Generate the AI prompt for S1 summary block content generation
 */
export function getSummaryS1Prompt(context: PromptContext): string {
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
Generate valid, production-ready summary (${versionId.toUpperCase()}) content conforming strictly to the official platform schema without system metadata or styling fields.`;
}
