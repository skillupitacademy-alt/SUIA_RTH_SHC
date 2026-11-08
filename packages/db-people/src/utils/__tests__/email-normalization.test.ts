import { describe, expect, it } from 'vitest';
import { normalizeEmail, safeNormalizeEmail } from '../email-normalization';

describe('normalizeEmail', () => {
  it('converts email to lowercase', () => {
    expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
    expect(normalizeEmail('ADMIN@TEST.ORG')).toBe('admin@test.org');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
    expect(normalizeEmail('\tuser@example.com\n')).toBe('user@example.com');
  });

  it('combines lowercase and trim transformations', () => {
    expect(normalizeEmail('  Admin@Example.COM  ')).toBe('admin@example.com');
  });

  it('accepts valid email formats', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
    expect(normalizeEmail('user.name@example.com')).toBe('user.name@example.com');
    expect(normalizeEmail('user+tag@example.co.uk')).toBe('user+tag@example.co.uk');
    expect(normalizeEmail('user_123@sub.example.org')).toBe('user_123@sub.example.org');
  });

  it('throws on empty string', () => {
    expect(() => normalizeEmail('')).toThrow('Email cannot be empty');
  });

  it('throws on whitespace-only string', () => {
    expect(() => normalizeEmail('   ')).toThrow('Email cannot be empty');
    expect(() => normalizeEmail('\t\n')).toThrow('Email cannot be empty');
  });

  it('throws on invalid email format - missing @', () => {
    expect(() => normalizeEmail('userexample.com')).toThrow('Invalid email format');
  });

  it('throws on invalid email format - missing domain', () => {
    expect(() => normalizeEmail('user@')).toThrow('Invalid email format');
  });

  it('throws on invalid email format - missing local part', () => {
    expect(() => normalizeEmail('@example.com')).toThrow('Invalid email format');
  });

  it('throws on invalid email format - missing TLD', () => {
    expect(() => normalizeEmail('user@example')).toThrow('Invalid email format');
  });

  it('throws on invalid email format - spaces in email', () => {
    expect(() => normalizeEmail('user name@example.com')).toThrow('Invalid email format');
    expect(() => normalizeEmail('user@exam ple.com')).toThrow('Invalid email format');
  });

  it('throws on email exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com'; // 263 chars total
    expect(() => normalizeEmail(longEmail)).toThrow('Email exceeds maximum length');
  });

  it('accepts email at 254 character boundary', () => {
    // 254 chars: 241 char local part + @ + 12 char domain
    const maxEmail = 'a'.repeat(241) + '@example.com';
    expect(normalizeEmail(maxEmail)).toBe(maxEmail);
  });

  it('throws on non-string input', () => {
    expect(() => normalizeEmail(null as any)).toThrow('Email must be a string');
    expect(() => normalizeEmail(undefined as any)).toThrow('Email must be a string');
    expect(() => normalizeEmail(123 as any)).toThrow('Email must be a string');
    expect(() => normalizeEmail({} as any)).toThrow('Email must be a string');
    expect(() => normalizeEmail([] as any)).toThrow('Email must be a string');
  });
});

describe('safeNormalizeEmail', () => {
  it('returns normalized email for valid input', () => {
    expect(safeNormalizeEmail('User@Example.COM')).toBe('user@example.com');
    expect(safeNormalizeEmail('  admin@test.org  ')).toBe('admin@test.org');
  });

  it('returns null for non-string input', () => {
    expect(safeNormalizeEmail(null)).toBe(null);
    expect(safeNormalizeEmail(undefined)).toBe(null);
    expect(safeNormalizeEmail(123)).toBe(null);
    expect(safeNormalizeEmail({})).toBe(null);
    expect(safeNormalizeEmail([])).toBe(null);
  });

  it('returns null for empty string', () => {
    expect(safeNormalizeEmail('')).toBe(null);
    expect(safeNormalizeEmail('   ')).toBe(null);
  });

  it('returns null for invalid email format', () => {
    expect(safeNormalizeEmail('invalid')).toBe(null);
    expect(safeNormalizeEmail('no-at-sign.com')).toBe(null);
    expect(safeNormalizeEmail('@no-local.com')).toBe(null);
    expect(safeNormalizeEmail('no-domain@')).toBe(null);
  });

  it('returns null for email exceeding max length', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(safeNormalizeEmail(longEmail)).toBe(null);
  });

  it('handles edge cases gracefully', () => {
    expect(safeNormalizeEmail('user name@example.com')).toBe(null);
    expect(safeNormalizeEmail('user@example')).toBe(null);
  });
});
