/**
 * Brand Validator Middleware Tests
 * 
 * Tests the middleware's integration with the canonical brand resolver
 * and its validation behavior for token/hostname/header consistency.
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  validateBrandContext,
  enforceBrandValidation,
  BrandValidationError,
  type BrandValidationContext,
} from '../brand-validator.middleware';

function createMockRequest(url: string, headers?: Record<string, string>): NextRequest {
  const req = new NextRequest(url);
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      req.headers.set(key, value);
    });
  }
  return req;
}

describe('Brand Validator Middleware', () => {
  describe('SkillHubCore validation', () => {
    it('accepts valid SHC apex domain with matching token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      const context = validateBrandContext('skillhubcore', req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
      expect(context.hostnameBrand).toBe('skillhubcore');
      expect(context.requestBrand).toBeUndefined();
    });

    it('accepts valid SHC subdomain with matching token', () => {
      const req = createMockRequest('https://app.skillhubcore.in/api/test');
      const context = validateBrandContext('skillhubcore', req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
      expect(context.hostnameBrand).toBe('skillhubcore');
    });

    it('accepts shc.localhost with matching token', () => {
      const req = createMockRequest('http://shc.localhost:3007/api/test');
      const context = validateBrandContext('skillhubcore', req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
      expect(context.hostnameBrand).toBe('skillhubcore');
    });

    it('accepts skillhubcore.localhost with matching token', () => {
      const req = createMockRequest('http://skillhubcore.localhost:3007/api/test');
      const context = validateBrandContext('skillhubcore', req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
      expect(context.hostnameBrand).toBe('skillhubcore');
    });

    it('accepts x-brand header matching SHC token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test', { 'x-brand': 'skillhubcore' });
      const context = validateBrandContext('skillhubcore', req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
      expect(context.hostnameBrand).toBe('skillhubcore');
      expect(context.requestBrand).toBe('skillhubcore');
    });

    it('rejects SHC hostname with skillup token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('skillup', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('skillup', req)).toThrow(/Brand mismatch.*skillup.*skillhubcore/);
    });

    it('rejects SHC hostname with realtutorialhub token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('realtutorialhub', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('realtutorialhub', req)).toThrow(/Brand mismatch/);
    });

    it('rejects conflicting x-brand header', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test', { 'x-brand': 'skillup' });
      
      expect(() => validateBrandContext('skillhubcore', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('skillhubcore', req)).toThrow(/Brand header mismatch/);
    });
  });

  describe('RealTutorialHub validation', () => {
    it('accepts valid RTH domain with matching token', () => {
      const req = createMockRequest('https://realtutorialhub.com/api/test');
      const context = validateBrandContext('realtutorialhub', req);
      
      expect(context.tokenBrand).toBe('realtutorialhub');
      expect(context.hostnameBrand).toBe('realtutorialhub');
    });

    it('accepts RTH subdomain with matching token', () => {
      const req = createMockRequest('https://app.realtutorialhub.com/api/test');
      const context = validateBrandContext('realtutorialhub', req);
      
      expect(context.tokenBrand).toBe('realtutorialhub');
      expect(context.hostnameBrand).toBe('realtutorialhub');
    });

    it('accepts rth.localhost with matching token', () => {
      const req = createMockRequest('http://rth.localhost:3003/api/test');
      const context = validateBrandContext('realtutorialhub', req);
      
      expect(context.tokenBrand).toBe('realtutorialhub');
      expect(context.hostnameBrand).toBe('realtutorialhub');
    });
  });

  describe('SkillUp validation', () => {
    it('accepts valid SUIA domain with matching token', () => {
      const req = createMockRequest('https://skillupitacademy.com/api/test');
      const context = validateBrandContext('skillup', req);
      
      expect(context.tokenBrand).toBe('skillup');
      expect(context.hostnameBrand).toBe('skillup');
    });

    it('accepts SUIA subdomain with matching token', () => {
      const req = createMockRequest('https://app.skillupitacademy.com/api/test');
      const context = validateBrandContext('skillup', req);
      
      expect(context.tokenBrand).toBe('skillup');
      expect(context.hostnameBrand).toBe('skillup');
    });

    it('accepts skillup.localhost with matching token', () => {
      const req = createMockRequest('http://skillup.localhost:3004/api/test');
      const context = validateBrandContext('skillup', req);
      
      expect(context.tokenBrand).toBe('skillup');
      expect(context.hostnameBrand).toBe('skillup');
    });
  });

  describe('Security: spoofing protection', () => {
    it('rejects skillhubcore.in.evil.com', () => {
      const req = createMockRequest('https://skillhubcore.in.evil.com/api/test');
      
      expect(() => validateBrandContext('skillhubcore', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('skillhubcore', req)).toThrow(/Hostname does not resolve/);
    });

    it('rejects evil-skillhubcore.in', () => {
      const req = createMockRequest('https://evil-skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('skillhubcore', req)).toThrow(BrandValidationError);
    });

    it('rejects skillupitacademy.com.evil.com', () => {
      const req = createMockRequest('https://skillupitacademy.com.evil.com/api/test');
      
      expect(() => validateBrandContext('skillup', req)).toThrow(BrandValidationError);
    });

    it('rejects evil-skillupitacademy.com', () => {
      const req = createMockRequest('https://evil-skillupitacademy.com/api/test');
      
      expect(() => validateBrandContext('skillup', req)).toThrow(BrandValidationError);
    });

    it('rejects realtutorialhub.com.evil.com', () => {
      const req = createMockRequest('https://realtutorialhub.com.evil.com/api/test');
      
      expect(() => validateBrandContext('realtutorialhub', req)).toThrow(BrandValidationError);
    });

    it('rejects evil-realtutorialhub.com', () => {
      const req = createMockRequest('https://evil-realtutorialhub.com/api/test');
      
      expect(() => validateBrandContext('realtutorialhub', req)).toThrow(BrandValidationError);
    });
  });

  describe('Token validation boundary', () => {
    it('rejects undefined token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext(undefined, req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext(undefined, req)).toThrow(/Token missing or invalid/);
    });

    it('rejects empty string token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('', req)).toThrow(/Token missing or invalid/);
    });

    it('rejects whitespace-only token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('   ', req)).toThrow(BrandValidationError);
    });

    it('rejects invalid brand value', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('attacker', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('unknown', req)).toThrow(/Token missing or invalid/);
    });

    it('rejects spoofed brand value', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      
      expect(() => validateBrandContext('skillhubcore.evil', req)).toThrow(BrandValidationError);
      expect(() => validateBrandContext('skillup123', req)).toThrow(BrandValidationError);
    });

    it('normalizes valid token brand (case insensitive)', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      const context = validateBrandContext('SkillHubCore', req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
    });
  });

  describe('enforceBrandValidation wrapper', () => {
    it('returns context for valid brand', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      const auth = { brand: 'skillhubcore', userId: 'test-user-123' };
      
      const context = enforceBrandValidation(auth, req);
      
      expect(context.tokenBrand).toBe('skillhubcore');
      expect(context.hostnameBrand).toBe('skillhubcore');
    });

    it('throws BrandValidationError for mismatch', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      const auth = { brand: 'skillup', userId: 'test-user-123' };
      
      expect(() => enforceBrandValidation(auth, req)).toThrow(BrandValidationError);
    });

    it('throws for missing brand', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test');
      const auth = { userId: 'test-user-123' };
      
      expect(() => enforceBrandValidation(auth, req)).toThrow(BrandValidationError);
    });
  });

  describe('x-platform header (alternative to x-brand)', () => {
    it('accepts x-platform header matching token', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test', { 'x-platform': 'skillhubcore' });
      const context = validateBrandContext('skillhubcore', req);
      
      expect(context.requestBrand).toBe('skillhubcore');
    });

    it('rejects conflicting x-platform header', () => {
      const req = createMockRequest('https://skillhubcore.in/api/test', { 'x-platform': 'skillup' });
      
      expect(() => validateBrandContext('skillhubcore', req)).toThrow(BrandValidationError);
    });
  });
});
