/**
 * Code C1 Block Converter
 * 
 * Pure conversion logic for Code C1 blocks.
 * Handles legacy TutorialCodePayload → canonical CodeC1AuthorContent transformation.
 * 
 * PURE MODULE - No React dependencies, no side effects, no state mutations.
 * LOSSLESS CONVERSION - Preserves ALL educational content from legacy format.
 */

import { CodeC1AuthorContent, CodeC1AuthorContentSchema, HistoricalTutorialCodePayloadSchema } from '@quiz/types/tutorial-rich-document';

/**
 * Result of Code C1 canonicalization with optional warning
 */
export interface CanonicalCodeC1Result {
  content: CodeC1AuthorContent;
  memoryModelWarning?: string;
}

/**
 * Converts any Code block payload to canonical CodeC1AuthorContent.
 * 
 * LOSSLESS FUNCTION - Preserves complete legacy structure including memoryModel.
 * 
 * @param payload - Either legacy TutorialCodePayload or canonical CodeC1AuthorContent
 * @returns Result with canonical content
 * @throws Error if payload cannot be converted to valid C1
 */
export function toCanonicalCodeC1(payload: unknown): CanonicalCodeC1Result {
  // First, check if already canonical C1 format
  const canonicalCheck = CodeC1AuthorContentSchema.safeParse(payload);
  if (canonicalCheck.success) {
    // Already canonical - return as-is
    return { content: canonicalCheck.data };
  }

  // Not canonical - try historical format
  const historicalCheck = HistoricalTutorialCodePayloadSchema.safeParse(payload);
  
  if (!historicalCheck.success) {
    const errors = historicalCheck.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    
    throw new Error(
      `Code C1 validation failed: ${errors}. ` +
      `The payload structure does not match either canonical C1 or historical CodeBlock format.`
    );
  }

  const legacy = historicalCheck.data;

  // Transform historical format → canonical C1 format
  const canonical: CodeC1AuthorContent = {
    page: {
      type: 'code' as const,
      title: legacy.page.title,
      introduction: legacy.page.introduction,
      language: legacy.code.language.toLowerCase(), // Normalize to lowercase
      code: legacy.code.source,
      filename: undefined, // Not in historical format
      explanation: legacy.explanation?.steps.map(step => ({
        focus: step.code,
        description: step.description,
      })) ?? [],
      output: legacy.output ? {
        value: legacy.output.value,
        description: legacy.output.inputExample
          ? `Input: ${JSON.stringify(legacy.output.inputExample)}`
          : undefined,
      } : undefined,
      takeaway: legacy.takeaway?.items.join('\n\n') ?? '',
      practiceHint: legacy.tip?.text,
      memoryModel: legacy.memoryModel, // ✅ PRESERVED
    },
  };

  // Validate the constructed canonical format
  const finalValidation = CodeC1AuthorContentSchema.safeParse(canonical);
  if (!finalValidation.success) {
    const errors = finalValidation.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    
    throw new Error(
      `Code C1 canonical validation failed after conversion: ${errors}`
    );
  }

  return { content: finalValidation.data };
}
