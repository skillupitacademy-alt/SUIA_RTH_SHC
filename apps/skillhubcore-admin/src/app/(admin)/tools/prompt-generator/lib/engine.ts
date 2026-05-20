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

export const getStrictCanonicalSubsectionPrompt = (section: string, subtopicName: string, subsection: string) => {
  const fullTemplate = getStrictSectionJsonTemplate(section, subtopicName);
  const rootKeys = Object.keys(fullTemplate);
  const rootKey = rootKeys[0];
  const rootVal = (fullTemplate as Record<string, Record<string, unknown>>)[rootKey] || {};
  const subsectionVal = rootVal[subsection];

  if (subsectionVal === undefined) {
    return ``;
  }

  return `**STRICT CANONICAL DATA STRUCTURE FOR SUBSECTION "${subsection}"**:
The following JSON structure is the ONLY accepted format for the subsection "${subsection}" of the section "${section}".
Ensure you only return a JSON block or value matching this canonical format:

${JSON.stringify(subsectionVal, null, 2)}

**STRICT ENUM RULES FOR PERSISTENCE**:
- Use valid JSON formatting. Do not wrap in extra nested objects unless specified.
- Use lowercase-kebab-case for all internal IDs.`;
};

export const getPromptForSection = (
  section: string,
  domain: string,
  subject: string,
  topic: string,
  subtopic: string,
  subsection?: string
) => {
  if (subsection) {
    const basePrompt = `Generate ONLY the JSON content for the subsection "${subsection}" of the "${section}" section on the subtopic "${subtopic}".
Domain: ${domain}
Subject: ${subject}
Topic: ${topic}

Ensure you only return the JSON block for the "${subsection}" field. The output must be educational, extremely high quality, clear, and perfectly tailored for the subtopic.`;
    return `${basePrompt}\n\n${getStrictCanonicalSubsectionPrompt(section, subtopic, subsection)}`;
  }

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

  let prompt = `**SVG DIAGRAM GENERATION REQUEST (STRICT OUTPUT FORMAT)**\n`;
  prompt += `Topic: ${subtopic}\n`;
  prompt += `Section: ${section}\n\n`;
  prompt += `**CRITICAL OUTPUT RULES (Non-negotiable)**:\n`;
  prompt += `1. Output ONLY the raw SVG markup. Start your response with \`<svg\` and end with \`</svg>\`.\n`;
  prompt += `2. Do NOT wrap the SVG in JSON, markdown code fences (\`\`\`), or any other container.\n`;
  prompt += `3. Do NOT output \`{"svg": "..."}\` or any JSON object. Output the SVG element directly.\n`;
  prompt += `4. Do NOT include any text, explanation, or comments before or after the SVG tag.\n`;
  prompt += `5. Style: Modern, Minimalist, Tech-focused (FAANG Style).\n`;
  prompt += `6. Colors: Use #f8fafc (slate-50), #3b82f6 (blue-500), #ef4444 (red-500), #22c55e (green-500), #f59e0b (amber-500), #6366f1 (indigo-500).\n`;
  prompt += `7. Typography: Use "Inter" or sans-serif fonts.\n`;
  prompt += `8. All text must be embedded inside the SVG using <text> or <foreignObject> elements.\n`;
  prompt += `9. DO NOT include embedded top title headers, subtitles, or background header blocks (e.g. y=0 to y=80) inside the SVG, as the parent application wrapper dynamically renders the section headers. Start the actual diagram directly at the top.\n`;
  prompt += `10. AVOID BROKEN BLACK BOXES: EVERY single <rect> element in your SVG MUST have an explicit fill attribute (e.g., fill="none", fill="transparent", or a valid hex color). Never leave <rect> tags without a fill attribute.\n`;
  prompt += `11. ASPECT RATIO OPTIMIZATION: Keep the height tightly bounded (prefer 450px to 500px height for 1200px width). This allows the SVG to fit and stretch to full width within the application's max-height limits without being squished or leaving vast vertical white spaces.\n`;
  prompt += `12. HIGH-FIDELITY DESIGN DETAILS: The SVG must be a complete, highly polished, FAANG-level educational diagram. If representing code, include a modern editor panel with line numbers gutter (e.g., line numbers 1 to 10 in a left sidebar), accurate syntax highlighting, curved dotted connector lines to connect code to explanations, and uppercase/bold status badges for descriptive card panels.\n\n`;
  prompt += `**CORRECT output format example**:\n`;
  prompt += `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">...</svg>\n\n`;
  prompt += `**WRONG output formats (will cause a system error)**:\n`;
  prompt += `- {"svg": "<svg ...>"} ← JSON wrapper is FORBIDDEN\n`;
  prompt += `- \`\`\`svg\\n<svg ...>\\n\`\`\` ← Markdown fences are FORBIDDEN\n\n`;

  targetSpecs.forEach((spec) => {
    prompt += `--- ASSET: ${spec.label} ---\n`;
    prompt += `ID: ${spec.id}\n`;
    prompt += `Dimensions: ${spec.width}x${spec.height}px (set width and height attributes on <svg>)\n`;
    prompt += `Target Field Path: ${spec.fieldPath}\n`;
    prompt += `Purpose: ${spec.purpose}\n\n`;
  });

  return prompt;
};

