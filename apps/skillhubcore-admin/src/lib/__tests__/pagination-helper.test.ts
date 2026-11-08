import { describe, expect, it } from 'vitest';
import { parsePaginationLimit } from '../pagination-helper';

describe('parsePaginationLimit', () => {
  it('returns default fallback of 20 for null, undefined, or empty values', () => {
    expect(parsePaginationLimit(null)).toBe(20);
    expect(parsePaginationLimit(undefined)).toBe(20);
    expect(parsePaginationLimit('')).toBe(20);
    expect(parsePaginationLimit('   ')).toBe(20);
  });

  it('accepts valid integers within range', () => {
    expect(parsePaginationLimit('1')).toBe(1);
    expect(parsePaginationLimit('10')).toBe(10);
    expect(parsePaginationLimit('20')).toBe(20);
    expect(parsePaginationLimit('50')).toBe(50);
    expect(parsePaginationLimit('100')).toBe(100);
  });

  it('clamps values above maxLimit to 100', () => {
    expect(parsePaginationLimit('101')).toBe(100);
    expect(parsePaginationLimit('500')).toBe(100);
    expect(parsePaginationLimit('1000000')).toBe(100);
    expect(parsePaginationLimit('999999999999')).toBe(100);
  });

  it('falls back to default for zero or negative values', () => {
    expect(parsePaginationLimit('0')).toBe(20);
    expect(parsePaginationLimit('-1')).toBe(20);
    expect(parsePaginationLimit('-50')).toBe(20);
  });

  it('falls back to default for floats, NaN, or non-numeric strings', () => {
    expect(parsePaginationLimit('20.5')).toBe(20);
    expect(parsePaginationLimit('NaN')).toBe(20);
    expect(parsePaginationLimit('Infinity')).toBe(20);
    expect(parsePaginationLimit('-Infinity')).toBe(20);
    expect(parsePaginationLimit('abc')).toBe(20);
    expect(parsePaginationLimit('12px')).toBe(20);
  });

  it('supports custom fallback and custom maxLimit', () => {
    expect(parsePaginationLimit(null, 15, 50)).toBe(15);
    expect(parsePaginationLimit('75', 15, 50)).toBe(50);
    expect(parsePaginationLimit('25', 15, 50)).toBe(25);
  });
});
