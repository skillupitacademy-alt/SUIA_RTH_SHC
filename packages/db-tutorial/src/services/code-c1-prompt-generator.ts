/**
 * Code C1 Prompt Generator
 * Phase 2B: AI Contract Generation
 * 
 * Generates deterministic prompts for AI to produce Code C1 content.
 * 
 * CRITICAL ARCHITECTURE:
 * 
 * AI OWNS:
 *   page.type
 *   page.title
 *   page.introduction
 *   page.language
 *   page.code
 *   page.filename (optional)
 *   page.explanation
 *   page.output (optional)
 *   page.takeaway
 *   page.practiceHint (optional)
 * 
 * SYSTEM OWNS:
 *   block.id (UUID)
 *   block.type ('code')
 *   block.version ('C1')
 *   domainId, subjectId, topicId, subtopicId (hierarchy)
 *   brandId, theme (runtime resolution)
 *   schemaVersion, metadata (canonical layer)
 *   database columns (status, published_at, etc.)
 * 
 * SECURITY BOUNDARY:
 * This prompt is NOT a security mechanism.
 * The actual trust boundary is validateCodeC1AIOutput().
 * 
 * PIPELINE:
 * Context → Prompt → AI → { page: {...} } → Validator → Canonical Builder
 */

import type { CodeC1AIInputContext } from '@quiz/types';

/**
 * Build Code C1 AI Prompt
 * 
 * Generates a deterministic prompt instructing AI to produce
 * Code C1 author content.
 * 
 * DETERMINISM:
 * For identical input context, this function MUST produce
 * identical output prompts. No timestamps, random IDs, or
 * dynamic metadata.
 * 
 * EDUCATIONAL QUALITY:
 * The prompt instructs AI to produce:
 * - Syntactically valid, runnable code
 * - Beginner-friendly explanations
 * - Focused explanation items (2-6)
 * - Clear progression from basics to understanding
 * - Concrete examples demonstrating the syntax
 * - Practical takeaways
 * - Optional practice hints
 * 
 * @param context - Deterministic AI input context from Phase 1E
 * @returns Prompt string instructing AI to generate Code C1
 * 
 * @example
 * ```typescript
 * const context = buildCodeC1AIContext(selection);
 * const prompt = buildCodeC1AIPrompt(context);
 * // Send prompt to AI
 * const aiResponse = await callAI(prompt);
 * // Validate response
 * const authorContent = validateCodeC1AIOutput(aiResponse);
 * ```
 */
export function buildCodeC1AIPrompt(
  context: CodeC1AIInputContext
): string {
  const { context: hierarchy, block, output } = context;

  return `You are generating educational content for a tutorial platform.

# TASK

Generate a Code C1 block for the following topic:

**Domain**: ${hierarchy.domainName}
**Subject**: ${hierarchy.subjectName}
**Topic**: ${hierarchy.topicName}
**Subtopic**: ${hierarchy.subtopicName}

# BLOCK TYPE

You are generating: **Code ${block.version}**

# OUTPUT REQUIREMENTS

## Structure

You MUST return ONLY a JSON object with this exact structure:

\`\`\`json
{
  "page": {
    "type": "code",
    "title": "...",
    "introduction": "...",
    "language": "...",
    "code": "...",
    "filename": "...",
    "explanation": [
      {
        "focus": "...",
        "description": "..."
      }
    ],
    "output": {
      "value": "...",
      "description": "..."
    },
    "takeaway": "...",
    "practiceHint": "..."
  }
}
\`\`\`

## Field Specifications

### page.type
- MUST be exactly: \`"code"\`

### page.title
- A concise, descriptive title for this code example
- Should clearly indicate what the code demonstrates
- Example: "Hello World in Python", "Variable Declaration", "Loop Through a List"
- Length: 10-150 characters

### page.introduction
- A learner-friendly introduction explaining what this code does and why it matters
- Set context before showing the code
- 2-3 sentences
- Length: 50-500 characters

### page.language
- Programming language of the code
- Supported languages: javascript, typescript, python, java, sql, bash, scala, go, rust, cpp, csharp, php, ruby, swift, kotlin
- Use lowercase

### page.code
- The actual code to demonstrate
- MUST be syntactically valid and runnable
- Keep it focused and concise
- Include necessary imports/context
- Length: 10-2000 characters

### page.filename (OPTIONAL)
- Suggested filename for this code
- Example: "hello.py", "main.js", "App.java"
- Length: 1-100 characters
- Omit if not relevant

### page.explanation
- An array of 2-6 focused explanation items
- Each item explains one specific aspect of the code
- Structure:
  - \`focus\`: What part/concept you're explaining (5-100 characters)
  - \`description\`: Clear explanation of that part (20-300 characters)
- Order from basic to advanced
- Be specific, not generic

Example:
\`\`\`json
[
  {
    "focus": "print() function",
    "description": "The print() function outputs text to the console. It's the most basic way to display information."
  },
  {
    "focus": "String literal",
    "description": "Text enclosed in quotes is a string literal. Python treats it as data, not code."
  }
]
\`\`\`

### page.output (OPTIONAL)
- Expected output when the code runs
- Structure:
  - \`value\`: The actual output (1-500 characters)
  - \`description\`: Optional explanation of the output (0-200 characters)
- Include if the code produces visible output
- Omit for code that doesn't print/return anything visible

### page.takeaway
- A concise summary of what the learner should remember
- 1 sentence capturing the key learning point
- Length: 20-200 characters

### page.practiceHint (OPTIONAL)
- A suggestion for how the learner can practice or experiment
- Example: "Try changing the message", "Experiment with different numbers"
- Length: 20-200 characters
- Omit if not relevant

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

1. **Correctness**: Code must be syntactically valid and runnable
2. **Clarity**: Explanations must be beginner-friendly
3. **Focus**: Each explanation item addresses one specific concept
4. **Progression**: Order explanations from basic to advanced
5. **Completeness**: Cover the essential aspects without overwhelming
6. **Practicality**: Provide realistic, useful examples
7. **Consistency**: Use consistent terminology throughout

# CODE-SPECIFIC GUIDELINES

- Write production-quality, syntactically correct code
- Include necessary imports/setup
- Use meaningful variable names
- Add inline comments only if they clarify non-obvious logic
- Keep code focused on demonstrating the concept
- Avoid deprecated syntax
- Follow language conventions and best practices

# CRITICAL REMINDERS

- Output format: \`${output.format}\`
- Root key: \`${output.rootKey}\`
- You are generating CONTENT ONLY, not system metadata
- The system will add block IDs, versions, and hierarchy metadata
- Return pure JSON without Markdown formatting

Generate the Code C1 block now.`;
}
