import * as prompts from './prompts';
import { getStrictSectionJsonTemplate } from './prompt-templates';
import { ASSET_SPECS } from './asset-specs';

export const getStrictEnumRules = () => `**STRICT ENUM RULES FOR PERSISTENCE**:
- sectionType: MUST be exactly one of [overview, notes, layman, real_life, technical, code, visual, practice, assignment, project, quiz, summary, interview, ai_tutor]
- schemaVersion: MUST be 1
- difficulty: MUST be one of [Beginner, Intermediate, Advanced] (case-sensitive)
- status: (if present) MUST be one of [draft, published, archived]`;

export const getStrictCanonicalPrompt = (section: string, subtopicName: string) => {
  const template = getStrictSectionJsonTemplate(section, subtopicName);
  return `**STRICT CANONICAL DATA STRUCTURE (FAANG-LEVEL PARITY)**:
The following JSON structure is the ONLY accepted format for the "${section}" section.
If you return fields not present here, or miss mandatory fields, the injection pipeline will CRASH.

${JSON.stringify(template, null, 2)}

${getStrictEnumRules()}

**MANDATORY**: Ensure all internal IDs (id) are unique within their arrays. Use lowercase-kebab-case for IDs.`;
};

export const getPromptForSection = (
  section: string,
  domain: string,
  subject: string,
  topic: string,
  subtopic: string
) => {
  switch (section) {
    case 'master':
      return prompts.getMasterPrompt(domain, subject, topic, subtopic);
    case 'overview':
      return `${prompts.getOverviewPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('overview', subtopic)}`;
    case 'notes':
      return `${prompts.getNotesPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('notes', subtopic)}`;
    case 'layman':
      return `${prompts.getLaymanPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('layman', subtopic)}`;
    case 'real_life':
      return `${prompts.getRealLifePrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('real_life', subtopic)}`;
    case 'technical':
      return `${prompts.getTechnicalPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('technical', subtopic)}`;
    case 'code':
      return `${prompts.getCodePrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('code', subtopic)}`;
    case 'visual':
      return `${prompts.getVisualPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('visual', subtopic)}`;
    case 'practice':
      return `${prompts.getPracticePrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('practice', subtopic)}`;
    case 'assignment':
      return `${prompts.getAssignmentPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('assignment', subtopic)}`;
    case 'project':
      return `${prompts.getProjectPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('project', subtopic)}`;
    case 'quiz':
      return `${prompts.getQuizPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('quiz', subtopic)}`;
    case 'summary':
      return `${prompts.getSummaryPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('summary', subtopic)}`;
    case 'interview':
      return `${prompts.getInterviewPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('interview', subtopic)}`;
    case 'ai_tutor':
      return `${prompts.getAiTutorPrompt(domain, subject, topic, subtopic)}\n\n${getStrictCanonicalPrompt('ai_tutor', subtopic)}`;
    default:
      return prompts.getNotesPrompt(domain, subject, topic, subtopic);
  }
};

export const getSvgAssetPromptForSection = (
  section: string,
  subtopic: string,
  assetId: string | null = null
) => {
  const specs = ASSET_SPECS[section];
  if (!specs) return '';

  const targetSpecs = assetId ? specs.filter((s) => s.id === assetId) : specs;
  if (targetSpecs.length === 0) return '';

  let prompt = `**SVG DIAGRAM GENERATION REQUEST (STRICT SCHEMA)**\n`;
  prompt += `Topic: ${subtopic}\n`;
  prompt += `Section: ${section}\n\n`;
  prompt += `**RULES**:\n`;
  prompt += `1. Output ONLY the raw SVG code inside a JSON object with a single "svg" key.\n`;
  prompt += `2. Style: Modern, Minimalist, Tech-focused (FAANG Style).\n`;
  prompt += `3. Colors: Use #f8fafc (slate-50), #3b82f6 (blue-500), #ef4444 (red-500), #22c55e (green-500).\n`;
  prompt += `4. Typography: Use "Inter" or sans-serif fonts.\n\n`;

  targetSpecs.forEach((spec) => {
    prompt += `--- ASSET: ${spec.label} ---\n`;
    prompt += `ID: ${spec.id}\n`;
    prompt += `Dimensions: ${spec.width}x${spec.height}\n`;
    prompt += `Target Field Path: ${spec.fieldPath}\n`;
    prompt += `Purpose: ${spec.purpose}\n\n`;
  });

  return prompt;
};
