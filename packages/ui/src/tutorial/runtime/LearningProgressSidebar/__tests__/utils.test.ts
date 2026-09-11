/**
 * RSSB Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { formatSeconds, formatDate } from '../utils';

describe('formatSeconds', () => {
  it('should format 0 seconds as "0s"', () => {
    expect(formatSeconds(0)).toBe('0s');
  });
  
  it('should format undefined as "0s"', () => {
    expect(formatSeconds(undefined)).toBe('0s');
  });
  
  it('should format seconds only', () => {
    expect(formatSeconds(45)).toBe('45s');
  });
  
  it('should format minutes and seconds', () => {
    expect(formatSeconds(89)).toBe('1m 29s');
  });
  
  it('should format large time values', () => {
    expect(formatSeconds(3661)).toBe('61m 1s');
  });
  
  it('should format exact minutes', () => {
    expect(formatSeconds(120)).toBe('2m 0s');
  });
});

describe('formatDate', () => {
  it('should format null as "—"', () => {
    expect(formatDate(null)).toBe('—');
  });
  
  it('should format undefined as "—"', () => {
    expect(formatDate(undefined)).toBe('—');
  });
  
  it('should format Date object', () => {
    const date = new Date('2026-01-15T10:30:00Z');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/Jan 15, 2026/);
  });
  
  it('should format ISO string', () => {
    const formatted = formatDate('2026-01-15T10:30:00Z');
    expect(formatted).toMatch(/Jan 15, 2026/);
  });
  
  it('should handle different date formats', () => {
    const date1 = formatDate(new Date('2026-09-11'));
    const date2 = formatDate('2026-09-11T00:00:00Z');
    expect(date1).toBeTruthy();
    expect(date2).toBeTruthy();
  });
});

