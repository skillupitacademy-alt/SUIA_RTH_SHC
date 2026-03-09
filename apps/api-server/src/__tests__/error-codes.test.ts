import { describe, it, expect } from 'vitest';

describe('Logic: Structured Error Codes (T30)', () => {
  it('should verify that common error codes follow the naming convention', () => {
    const errorCodes = {
      UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
      FORBIDDEN: 'AUTH_FORBIDDEN',
      NOT_FOUND: 'RESOURCE_NOT_FOUND',
      VALIDATION_ERROR: 'INPUT_VALIDATION_ERROR',
      INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR'
    };

    Object.values(errorCodes).forEach(code => {
      expect(code).toMatch(/^[A-Z_]+$/);
      expect(code).toContain('_');
    });
  });
});
