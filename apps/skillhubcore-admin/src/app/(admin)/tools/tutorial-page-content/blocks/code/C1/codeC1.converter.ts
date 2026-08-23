/**
 * Code C1 Block Converter
 * 
 * Pure conversion logic for Code C1 blocks.
 * Handles legacy TutorialCodePayload → canonical CodeC1AuthorContent transformation.
 * 
 * PURE MODULE - No React dependencies, no side effects, no state mutations.
 */

import { CodeC1AuthorContent, CodeC1AuthorContentSchema } from '@quiz/types/tutorial-rich-document';
import { TutorialCodePayload } from '@quiz/types/tutorial-page-content.types';

/**
 * Result of Code C1 canonicalization with optional warning
 */
export interface CanonicalCodeC1Result {
  content: CodeC1AuthorContent;
  memoryModelWarning?: string;
}

/**
 * Converts legacy TutorialCodePayload to canonical CodeC1AuthorContent.
 * 
 * This function implements the proven mapping from the authoritative C1 fixture.
 * 
 * @param legacy - Legacy TutorialCodePayload structure
 * @returns Object with canonical content and optional warning message
 */
export function legacyCodePayloadToC1Content(
  legacy: TutorialCodePayload
): { content: CodeC1AuthorContent; warning?: string } {
  let warning: string | undefined;

  // Detect unsupported rich content that will be lost
  if (legacy.memoryModel) {
    const nodeCount = legacy.memoryModel.nodes?.length || 0;
    const columnCount = legacy.memoryModel.columns?.length || 0;
    const connectionCount = legacy.memoryModel.connections?.length || 0;
    
    warning = 
      `Memory Model detected (${columnCount} columns, ${nodeCount} nodes, ${connectionCount} connections) ` +
      `but NOT supported by canonical C1. This visualization will be LOST. ` +
      `Manual migration to DiagramBlock or future C2 required.`;
    
    console.warn(`[C1 Migration Warning] ${warning}`);
  }

  // Build canonical C1 content
  const page = legacy.page || { type: 'CODE + EXPLANATION', title: '', introduction: '' };
  const code = legacy.code || { language: 'text', source: '' };
  const steps = Array.isArray(legacy.explanation?.steps) ? legacy.explanation.steps : [];
  const takeawayItems = Array.isArray(legacy.takeaway?.items) ? legacy.takeaway.items : [];

  const c1Content: CodeC1AuthorContent = {
    page: {
      type: 'code', // Transform 'CODE + EXPLANATION' → 'code'
      title: page.title || 'Code Example',
      introduction: page.introduction || 'Code introduction',
      language: code.language || 'text',
      code: code.source || '// Code example',
      explanation: steps.length >= 2 ? steps.map((step, index) => ({
        focus: step.code || `// Step ${index + 1}`, // Map steps[].code → focus
        description: step.description || 'Step description',
      })) : [
        { focus: '// First step', description: 'First step description (minimum 2 required)' },
        { focus: '// Second step', description: 'Second step description' },
      ],
      output: legacy.output?.value
        ? {
            value: legacy.output.value,
            description: undefined, // output.description not in legacy schema
          }
        : undefined,
      takeaway: takeawayItems.length > 0 
        ? takeawayItems.join(' ') // Transform array → single string
        : 'Review the code example above to understand the concept.',
      practiceHint: legacy.tip?.text, // Map tip.text → practiceHint (optional)
    },
  };

  return { content: c1Content, warning };
}

/**
 * Converts any Code block payload to canonical CodeC1AuthorContent.
 * 
 * PURE FUNCTION - does not mutate React state.
 * Returns warning message if memoryModel detected.
 * 
 * @param payload - Either legacy TutorialCodePayload or canonical CodeC1AuthorContent
 * @returns Result with canonical content and optional warning
 * @throws Error if payload cannot be converted to valid C1
 */
export function toCanonicalCodeC1(payload: unknown): CanonicalCodeC1Result {
  // First, check if already canonical C1
  const parseResult = CodeC1AuthorContentSchema.safeParse(payload);
  
  if (parseResult.success) {
    // Already canonical - return as-is with no warning
    return { content: parseResult.data };
  }
  
  // Not canonical - attempt legacy conversion
  const { content: converted, warning } = legacyCodePayloadToC1Content(
    payload as TutorialCodePayload
  );
  
  // Validate the conversion result
  const validationResult = CodeC1AuthorContentSchema.safeParse(converted);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    
    throw new Error(
      `Legacy → C1 conversion produced invalid canonical content: ${errors}`
    );
  }
  
  return {
    content: validationResult.data,
    memoryModelWarning: warning,
  };
}
