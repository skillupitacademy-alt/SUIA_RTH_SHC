/**
 * Apply Suggestion Contracts - Unit Tests
 * 
 * PROMPT 08 WAVE 1: Phase E+F
 * 
 * Verifies API contract schemas for suggestion application endpoint.
 * 
 * TEST CATEGORIES:
 * 1. Request validation (strict mode, security boundaries)
 * 2. Response validation
 * 3. Error code validation
 * 4. Version conflict detail validation
 */

import { describe, it, expect } from 'vitest';
import {
  ApplySuggestionRequestSchema,
  ApplySuggestionResponseSchema,
  ApplySuggestionErrorCode,
  VersionConflictDetailSchema,
  ApplySuggestionErrorResponseSchema,
} from '../apply-suggestion-contracts';

describe('ApplySuggestionRequestSchema', () => {
  describe('valid requests', () => {
    it('should accept valid request with all required fields', () => {
      const validRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64), // Valid SHA-256 hex
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it('should accept uppercase hexadecimal fingerprint', () => {
      const validRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'A'.repeat(64),
        expectedVersion: 1,
      };

      const result = ApplySuggestionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept mixed-case hexadecimal fingerprint', () => {
      const validRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'aB'.repeat(32),
        expectedVersion: 100,
      };

      const result = ApplySuggestionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('suggestionId validation', () => {
    it('should reject empty suggestionId', () => {
      const invalidRequest = {
        suggestionId: '',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('suggestionId is required');
      }
    });

    it('should reject missing suggestionId', () => {
      const invalidRequest = {
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('suggestionFingerprint validation', () => {
    it('should reject fingerprint with invalid length (too short)', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(63), // 63 chars (too short)
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SHA-256 hash');
      }
    });

    it('should reject fingerprint with invalid length (too long)', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(65), // 65 chars (too long)
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SHA-256 hash');
      }
    });

    it('should reject fingerprint with non-hexadecimal characters', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'g'.repeat(64), // 'g' is not hex
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SHA-256 hash');
      }
    });

    it('should reject fingerprint with spaces', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(63) + ' ', // Space at end
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject missing fingerprint', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        expectedVersion: 5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('expectedVersion validation', () => {
    it('should reject zero expectedVersion', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 0,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject negative expectedVersion', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: -1,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject float expectedVersion', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5.5,
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    it('should reject missing expectedVersion', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('strict mode security', () => {
    it('should reject request with suggestedContent field', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
        suggestedContent: { type: 'paragraph', content: 'malicious' },
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
      }
    });

    it('should reject request with block field', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
        block: { id: 'block_1', type: 'paragraph' },
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
      }
    });

    it('should reject request with document field', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
        document: { metadata: {}, sections: [] },
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
      }
    });

    it('should reject request with content field', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
        content: 'Some malicious content',
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
      }
    });

    it('should reject request with arbitrary unknown field', () => {
      const invalidRequest = {
        suggestionId: 'sug_12345',
        suggestionFingerprint: 'a'.repeat(64),
        expectedVersion: 5,
        maliciousField: 'attack',
      };

      const result = ApplySuggestionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
      }
    });
  });
});

describe('ApplySuggestionResponseSchema', () => {
  it('should accept valid response', () => {
    const validResponse = {
      section: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subtopicId: '223e4567-e89b-12d3-a456-426614174000',
        sectionType: 'notes' as const,
        difficulty: 'intermediate' as const,
        orderIndex: 1,
        content: {
          schemaVersion: 1,
          metadata: {
            title: 'Test Section',
            description: 'Test description',
            brandVisibility: 'shared_visible' as const,
            documentLanguage: 'en',
            contentClassification: 'educational' as const,
          },
          blocks: [],
        },
        version: 6,
        language: 'en',
        status: 'draft' as const,
        brandId: 'realtutorialhub' as const,
        generatedByAi: true,
        aiModelUsed: 'claude-sonnet-4.5',
        qualityScore: 85,
        createdAt: '2026-08-16T10:00:00Z',
        updatedAt: '2026-08-16T11:00:00Z',
        publishedAt: null,
      },
      previousVersion: 5,
      newVersion: 6,
      appliedSuggestionId: 'sug_12345',
      appliedSuggestionType: 'summary',
    };

    const result = ApplySuggestionResponseSchema.safeParse(validResponse);
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.errors, null, 2));
    }
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.previousVersion).toBe(5);
      expect(result.data.newVersion).toBe(6);
      expect(result.data.appliedSuggestionId).toBe('sug_12345');
      expect(result.data.appliedSuggestionType).toBe('summary');
    }
  });

  it('should reject response with missing section', () => {
    const invalidResponse = {
      previousVersion: 5,
      newVersion: 6,
      appliedSuggestionId: 'sug_12345',
      appliedSuggestionType: 'summary',
    };

    const result = ApplySuggestionResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it('should reject response with missing version fields', () => {
    const invalidResponse = {
      section: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subtopicId: '223e4567-e89b-12d3-a456-426614174000',
        sectionType: 'notes' as const,
        difficulty: 'intermediate' as const,
        orderIndex: 1,
        content: {
          schemaVersion: 1,
          metadata: {
            title: 'Test Section',
            description: 'Test description',
            brandVisibility: 'shared_visible' as const,
            documentLanguage: 'en',
            contentClassification: 'educational' as const,
          },
          blocks: [],
        },
        version: 6,
        language: 'en',
        status: 'draft' as const,
        brandId: 'realtutorialhub' as const,
        generatedByAi: true,
        aiModelUsed: 'claude-sonnet-4.5',
        qualityScore: 85,
        createdAt: '2026-08-16T10:00:00Z',
        updatedAt: '2026-08-16T11:00:00Z',
        publishedAt: null,
      },
      appliedSuggestionId: 'sug_12345',
      appliedSuggestionType: 'summary',
    };

    const result = ApplySuggestionResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });
});

describe('ApplySuggestionErrorCode', () => {
  it('should include all expected error codes', () => {
    const errorCodes = ApplySuggestionErrorCode.enum;
    
    expect(errorCodes).toHaveProperty('UNAUTHENTICATED');
    expect(errorCodes).toHaveProperty('FORBIDDEN');
    expect(errorCodes).toHaveProperty('NOT_FOUND');
    expect(errorCodes).toHaveProperty('VALIDATION_ERROR');
    expect(errorCodes).toHaveProperty('SECTION_NOT_FOUND');
    expect(errorCodes).toHaveProperty('SUGGESTION_NOT_FOUND');
    expect(errorCodes).toHaveProperty('SUGGESTION_INVALID');
    expect(errorCodes).toHaveProperty('TRANSFORMATION_FAILED');
    expect(errorCodes).toHaveProperty('VERSION_CONFLICT');
    expect(errorCodes).toHaveProperty('INTERNAL_ERROR');
  });
});

describe('VersionConflictDetailSchema', () => {
  it('should accept valid version conflict detail', () => {
    const validDetail = {
      expectedVersion: 5,
      currentVersion: 6,
    };

    const result = VersionConflictDetailSchema.safeParse(validDetail);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validDetail);
    }
  });

  it('should accept -1 as currentVersion (TOCTOU race)', () => {
    const validDetail = {
      expectedVersion: 5,
      currentVersion: -1,
    };

    const result = VersionConflictDetailSchema.safeParse(validDetail);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentVersion).toBe(-1);
    }
  });

  it('should reject zero expectedVersion', () => {
    const invalidDetail = {
      expectedVersion: 0,
      currentVersion: 1,
    };

    const result = VersionConflictDetailSchema.safeParse(invalidDetail);
    expect(result.success).toBe(false);
  });

  it('should reject negative expectedVersion', () => {
    const invalidDetail = {
      expectedVersion: -5,
      currentVersion: 1,
    };

    const result = VersionConflictDetailSchema.safeParse(invalidDetail);
    expect(result.success).toBe(false);
  });
});

describe('ApplySuggestionErrorResponseSchema', () => {
  it('should accept error response with code and message', () => {
    const validError = {
      error: {
        code: 'VERSION_CONFLICT' as const,
        message: 'Version conflict detected',
      },
    };

    const result = ApplySuggestionErrorResponseSchema.safeParse(validError);
    expect(result.success).toBe(true);
  });

  it('should accept error response with details', () => {
    const validError = {
      error: {
        code: 'VERSION_CONFLICT' as const,
        message: 'Version conflict detected',
        details: {
          expectedVersion: 5,
          currentVersion: 6,
        },
      },
    };

    const result = ApplySuggestionErrorResponseSchema.safeParse(validError);
    expect(result.success).toBe(true);
  });

  it('should reject error response with missing code', () => {
    const invalidError = {
      error: {
        message: 'Some error',
      },
    };

    const result = ApplySuggestionErrorResponseSchema.safeParse(invalidError);
    expect(result.success).toBe(false);
  });

  it('should reject error response with invalid code', () => {
    const invalidError = {
      error: {
        code: 'INVALID_CODE',
        message: 'Some error',
      },
    };

    const result = ApplySuggestionErrorResponseSchema.safeParse(invalidError);
    expect(result.success).toBe(false);
  });
});
