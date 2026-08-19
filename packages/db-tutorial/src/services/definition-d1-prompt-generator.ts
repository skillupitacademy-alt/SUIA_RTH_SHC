/**
 * Definition D1 Prompt Generator
 * Phase 1I: AI Contract Generation
 * 
 * Generates deterministic prompts for AI to produce Definition D1 content.
 * 
 * CRITICAL ARCHITECTURE:
 * 
 * AI OWNS:
 *   page.type
 *   page.category
 *   page.title
 *   page.intro
 *   page.definition
 *   page.explanation
 *   page.example
 *   page.characteristics
 *   page.takeaway
 * 
 * SYSTEM OWNS:
 *   block.id (UUID)
 *   block.type ('definition')
 *   block.version ('D1')
 *   domainId, subjectId, topicId, subtopicId (hierarchy)
 *   brandId, theme (runtime resolution)
 *   schemaVersion, metadata (canonical layer)
 *   database columns (status, published_at, etc.)
 * 
 * SECURITY BOUNDARY:
 * This prompt is NOT a security mechanism.
 * The actual trust boundary is validateDefinitionD1AIOutput().
 * 
 * PIPELINE:
 * Context → Prompt → AI → { page: {...} } → Validator → Canonical Builder
 */

import type { DefinitionD1AIInputContext } from '@quiz/types';

/**
 * Build Definition D1 AI Prompt
 * 
 * Generates a deterministic prompt instructing AI to produce
 * Definition D1 author content.
 * 
 * DETERMINISM:
 * For identical input context, this function MUST produce
 * identical output prompts. No timestamps, random IDs, or
 * dynamic metadata.
 * 
 * EDUCATIONAL QUALITY:
 * The prompt instructs AI to produce:
 * - Technically accurate explanations
 * - Beginner-friendly language where appropriate
 * - Concrete, syntactically valid code examples
 * - Logical explanation ordering (simple → deeper)
 * - Consistent terminology
 * - No unnecessary verbosity
 * 
 * @param context - Deterministic AI input context from Phase 1E
 * @returns Prompt string instructing AI to generate Definition D1
 * 
 * @example
 * ```typescript
 * const context = buildDefinitionD1AIContext(selection);
 * const prompt = buildDefinitionD1AIPrompt(context);
 * // Send prompt to AI
 * const aiResponse = await callAI(prompt);
 * // Validate response
 * const authorContent = validateDefinitionD1AIOutput(aiResponse);
 * ```
 */
export function buildDefinitionD1AIPrompt(
  context: DefinitionD1AIInputContext
): string {
  const { context: hierarchy, block, output } = context;

  return `You are generating educational content for a tutorial platform.

# TASK

Generate a Definition D1 block for the following topic:

**Domain**: ${hierarchy.domainName}
**Subject**: ${hierarchy.subjectName}
**Topic**: ${hierarchy.topicName}
**Subtopic**: ${hierarchy.subtopicName}

# BLOCK TYPE

You are generating: **Definition ${block.version}**

# OUTPUT REQUIREMENTS

## Structure

You MUST return ONLY a JSON object with this exact structure:

\`\`\`json
{
  "page": {
    "type": "definition",
    "category": "...",
    "title": "...",
    "intro": "...",
    "definition": "...",
    "explanation": [
      "...",
      "...",
      "..."
    ],
    "example": {
      "language": "...",
      "code": "..."
    },
    "characteristics": [
      {
        "icon": "...",
        "title": "...",
        "description": "..."
      }
    ],
    "takeaway": "..."
  }
}
\`\`\`

## Field Specifications

### page.type
- MUST be exactly: \`"definition"\`

### page.category
- The conceptual category of this definition
- Example: "Python Fundamentals", "Data Structures", "Control Flow"
- Keep it short and clear (max 100 characters)

### page.title
- A concise educational title
- Should be a question or statement that captures the concept
- Example: "What Is a Variable?", "Understanding Functions", "The for Loop"
- Max 200 characters

### page.intro
- A short learner-friendly introduction
- Explain what the concept is and why the learner should care
- 1-2 sentences
- Max 1000 characters

### page.definition
- A precise, technical definition of the concept
- Should be clear and authoritative
- Can reference technical specifications if appropriate
- Max 3000 characters

### page.explanation
- An array of explanation paragraphs
- Order from simple to deeper understanding
- Each paragraph should build on previous ones
- Use consistent terminology
- Avoid unnecessary verbosity
- At least 1 paragraph, each max 2000 characters

### page.example
- A concrete code example demonstrating the concept
- \`language\`: programming language (e.g., "python", "javascript", "java")
- \`code\`: syntactically valid code
- The example MUST match the definition
- Keep examples simple but complete

### page.characteristics
- An array of key defining properties
- Each characteristic has:
  - \`icon\`: A simple symbol (e.g., "○", "◆", "▸", "✓")
  - \`title\`: Short characteristic name (max 100 characters)
  - \`description\`: Explanation of that characteristic (max 500 characters)
- Include 2-4 characteristics

### page.takeaway
- A concise final statement capturing the central idea
- Should reinforce the key learning point
- 1 sentence
- Max 1000 characters

## JSON Format Rules

1. Return ONLY the JSON object
2. Do NOT wrap in Markdown code fences
3. Do NOT include comments
4. Do NOT include explanatory text outside the JSON
5. The response must be directly parseable by JSON.parse()

## What You MUST NOT Include

You MUST NOT include any of these fields:
- \`id\`, \`blockId\`
- \`version\`
- \`domainId\`, \`subjectId\`, \`topicId\`, \`subtopicId\`
- \`brandId\`, \`theme\`
- \`status\`, \`publishedAt\`
- \`generatedByAi\`, \`aiModelUsed\`, \`qualityScore\`
- \`schemaVersion\`, \`metadata\`
- Any fields not explicitly specified above

# EDUCATIONAL QUALITY REQUIREMENTS

1. **Accuracy**: All technical information must be correct
2. **Clarity**: Use beginner-friendly language where possible
3. **Examples**: Code examples must be syntactically valid
4. **Completeness**: Cover the concept thoroughly but concisely
5. **Consistency**: Use consistent terminology throughout
6. **Relevance**: Stay focused on the subtopic
7. **Structure**: Explanations should flow logically

# PYTHON-SPECIFIC GUIDELINES

If the topic is Python-related:
- Use Python 3.x syntax
- Include actual Python code in examples
- Use \`language: "python"\` in the example field
- Show realistic, runnable code
- Include output in comments where helpful

# CRITICAL REMINDERS

- Output format: \`${output.format}\`
- Root key: \`${output.rootKey}\`
- You are generating CONTENT ONLY, not system metadata
- The system will add block IDs, versions, and hierarchy metadata
- Return pure JSON without Markdown formatting

Generate the Definition D1 block now.`;
}
