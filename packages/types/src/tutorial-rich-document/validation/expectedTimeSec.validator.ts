/**
 * expectedTimeSec Metadata Validation
 * 
 * Runtime validation and warnings for the global expectedTimeSec contract.
 * 
 * VALIDATION STRATEGY:
 * - **Zod Schemas**: Enforce structure (root-level only, positive integer type)
 * - **Custom Validator**: Provide enhanced feedback (missing warnings, unusual values)
 * 
 * This validator runs AFTER Zod schema validation. Zod rejects malformed structures
 * (e.g., nested expectedTimeSec, wrong types). This validator adds guidance for
 * correct structures that could be improved.
 * 
 * ARCHITECTURAL NOTE:
 * - expectedTimeSec is ANALYTICS METADATA ONLY
 * - It does NOT affect completion logic or progress eligibility
 * - progressRole (instructional/structural/assessment/media) controls those
 */

import type { TutorialBlock } from '../blocks';

export interface ExpectedTimeSecValidationResult {
  valid: boolean;
  warnings: ExpectedTimeSecWarning[];
  errors: ExpectedTimeSecError[];
}

export interface ExpectedTimeSecWarning {
  code: 'MISSING_EXPECTED_TIME' | 'UNUSUAL_VALUE';
  message: string;
  blockId: string;
  blockType: string;
  blockVersion?: string;
  suggestedAction?: string;
}

export interface ExpectedTimeSecError {
  code: 'INVALID_TYPE' | 'INVALID_PLACEMENT' | 'INVALID_RANGE';
  message: string;
  blockId: string;
  blockType: string;
  blockVersion?: string;
  actualValue?: unknown;
}

/**
 * Typical time ranges for each instructional block type (in seconds)
 * These are guidance ranges, not strict constraints
 */
const TYPICAL_RANGES: Record<string, { min: number; max: number; name: string }> = {
  'D1': { min: 90, max: 300, name: 'Definition' },
  'C1': { min: 180, max: 480, name: 'Code' },
  'I1': { min: 300, max: 600, name: 'Introduction' },
  'S1': { min: 60, max: 180, name: 'Summary' },
};

/**
 * Validates expectedTimeSec for a single block
 * 
 * Provides warnings for missing or unusual values
 * Provides errors for invalid types or placement
 */
export function validateExpectedTimeSec(block: TutorialBlock): ExpectedTimeSecValidationResult {
  const warnings: ExpectedTimeSecWarning[] = [];
  const errors: ExpectedTimeSecError[] = [];

  const blockVersion = 'version' in block ? block.version : undefined;
  const instructionalBlocks = ['definition', 'code', 'introduction', 'summary'];
  const isInstructional = instructionalBlocks.includes(block.type);

  // Check if expectedTimeSec exists
  if (block.expectedTimeSec === undefined || block.expectedTimeSec === null) {
    // Only warn for instructional blocks
    if (isInstructional) {
      warnings.push({
        code: 'MISSING_EXPECTED_TIME',
        message: `Instructional block missing expectedTimeSec. AI should generate this metadata.`,
        blockId: block.id,
        blockType: block.type,
        blockVersion,
        suggestedAction: `Add expectedTimeSec at root level based on content complexity. Typical range for ${blockVersion}: ${TYPICAL_RANGES[blockVersion || '']?.min}-${TYPICAL_RANGES[blockVersion || '']?.max} seconds`,
      });
    }
    
    // Not an error - schema allows optional
    return { valid: true, warnings, errors };
  }

  // Check type
  if (typeof block.expectedTimeSec !== 'number') {
    errors.push({
      code: 'INVALID_TYPE',
      message: `expectedTimeSec must be a number, got ${typeof block.expectedTimeSec}`,
      blockId: block.id,
      blockType: block.type,
      blockVersion,
      actualValue: block.expectedTimeSec,
    });
    return { valid: false, warnings, errors };
  }

  // Check if it's an integer
  if (!Number.isInteger(block.expectedTimeSec)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `expectedTimeSec must be a whole number (integer), got ${block.expectedTimeSec}`,
      blockId: block.id,
      blockType: block.type,
      blockVersion,
      actualValue: block.expectedTimeSec,
    });
    return { valid: false, warnings, errors };
  }

  // Check if positive
  if (block.expectedTimeSec <= 0) {
    errors.push({
      code: 'INVALID_RANGE',
      message: `expectedTimeSec must be greater than 0, got ${block.expectedTimeSec}`,
      blockId: block.id,
      blockType: block.type,
      blockVersion,
      actualValue: block.expectedTimeSec,
    });
    return { valid: false, warnings, errors };
  }

  // Defensive check for nested expectedTimeSec
  // Note: Zod schemas enforce root-level placement, so this should never occur
  // in validated blocks. This check catches programming errors where malformed
  // objects bypass schema validation.
  if ('content' in block && block.content && typeof block.content === 'object') {
    const content = block.content as Record<string, unknown>;
    if ('expectedTimeSec' in content) {
      errors.push({
        code: 'INVALID_PLACEMENT',
        message: `expectedTimeSec found inside content object. It must be at block root level only.`,
        blockId: block.id,
        blockType: block.type,
        blockVersion,
      });
      return { valid: false, warnings, errors };
    }

    // Check if nested in page (common AI generation mistake for D1/C1/I1)
    if ('page' in content && content.page && typeof content.page === 'object') {
      const page = content.page as Record<string, unknown>;
      if ('expectedTimeSec' in page) {
        errors.push({
          code: 'INVALID_PLACEMENT',
          message: `expectedTimeSec found inside content.page object. It must be at block root level only.`,
          blockId: block.id,
          blockType: block.type,
          blockVersion,
        });
        return { valid: false, warnings, errors };
      }
    }
  }

  // Check if value is unusually high or low for the block type
  if (blockVersion && TYPICAL_RANGES[blockVersion] && isInstructional) {
    const range = TYPICAL_RANGES[blockVersion];
    
    if (block.expectedTimeSec < range.min * 0.5) {
      // Less than 50% of minimum typical range
      warnings.push({
        code: 'UNUSUAL_VALUE',
        message: `expectedTimeSec (${block.expectedTimeSec}s) is unusually low for ${range.name} blocks. Typical range: ${range.min}-${range.max}s. Verify content isn't more complex than estimated.`,
        blockId: block.id,
        blockType: block.type,
        blockVersion,
      });
    } else if (block.expectedTimeSec > range.max * 2) {
      // More than 200% of maximum typical range
      warnings.push({
        code: 'UNUSUAL_VALUE',
        message: `expectedTimeSec (${block.expectedTimeSec}s) is unusually high for ${range.name} blocks. Typical range: ${range.min}-${range.max}s. Consider breaking into smaller blocks or verify estimate.`,
        blockId: block.id,
        blockType: block.type,
        blockVersion,
      });
    }
  }

  return { valid: true, warnings, errors };
}

/**
 * Validates expectedTimeSec for multiple blocks
 * Collects all warnings and errors
 */
export function validateExpectedTimeSecForBlocks(
  blocks: TutorialBlock[]
): ExpectedTimeSecValidationResult {
  const allWarnings: ExpectedTimeSecWarning[] = [];
  const allErrors: ExpectedTimeSecError[] = [];

  for (const block of blocks) {
    const result = validateExpectedTimeSec(block);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
  }

  return {
    valid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
  };
}
