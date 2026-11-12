/**
 * PHASE 7K STAGE 1.9 REGRESSION TEST
 *
 * Verifies the fix that ensures BOTH localhost AND production hostnames work for SkillHubCore.
 *
 * REGRESSION TIMELINE:
 * - Before Aug 27: Only RTH + SkillUp supported
 * - Aug 27-28: Attempted SkillHubCore support but INCOMPLETE (no production hostnames)
 * - Aug 30: Complete SkillHubCore support (localhost + production)
 *
 * INVARIANT: Adding localhost support must NOT break production hostnames.
 */

import { describe, expect, it } from 'vitest';
import { resolveBrandFromHostname } from '../brand-resolution';

describe('Phase 7K Regression: SkillHubCore localhost + production', () => {
  it('MUST resolve skillhubcore.localhost for local development', () => {
    expect(resolveBrandFromHostname('skillhubcore.localhost')).toBe('skillhubcore');
  });

  it('MUST resolve admin.skillhubcore.localhost', () => {
    expect(resolveBrandFromHostname('admin.skillhubcore.localhost')).toBe('skillhubcore');
  });

  it('MUST resolve admin.skillhubcore.in (production)', () => {
    expect(resolveBrandFromHostname('admin.skillhubcore.in')).toBe('skillhubcore');
  });

  it('MUST resolve api.skillhubcore.in (production)', () => {
    expect(resolveBrandFromHostname('api.skillhubcore.in')).toBe('skillhubcore');
  });

  it('MUST resolve quiz.skillhubcore.in (production)', () => {
    expect(resolveBrandFromHostname('quiz.skillhubcore.in')).toBe('skillhubcore');
  });

  it('MUST resolve tutorial.skillhubcore.in (production)', () => {
    expect(resolveBrandFromHostname('tutorial.skillhubcore.in')).toBe('skillhubcore');
  });

  it('MUST resolve placement.skillhubcore.in (production)', () => {
    expect(resolveBrandFromHostname('placement.skillhubcore.in')).toBe('skillhubcore');
  });

  it('MUST preserve admin.realtutorialhub.com (RTH)', () => {
    expect(resolveBrandFromHostname('admin.realtutorialhub.com')).toBe('realtutorialhub');
  });

  it('MUST preserve user.realtutorialhub.com (RTH)', () => {
    expect(resolveBrandFromHostname('user.realtutorialhub.com')).toBe('realtutorialhub');
  });

  it('MUST preserve admin.skillupitacademy.com (SkillUp)', () => {
    expect(resolveBrandFromHostname('admin.skillupitacademy.com')).toBe('skillup');
  });

  it('MUST preserve user.skillupitacademy.com (SkillUp)', () => {
    expect(resolveBrandFromHostname('user.skillupitacademy.com')).toBe('skillup');
  });

  it('MUST NOT resolve localhost without brand prefix', () => {
    expect(resolveBrandFromHostname('localhost')).toBeUndefined();
  });

  it('MUST NOT resolve 127.0.0.1', () => {
    expect(resolveBrandFromHostname('127.0.0.1')).toBeUndefined();
  });

  it('MUST NOT resolve spoofed skillhubcore.in.evil.com', () => {
    expect(resolveBrandFromHostname('skillhubcore.in.evil.com')).toBeUndefined();
  });

  it('MUST NOT resolve evil-skillhubcore.in', () => {
    expect(resolveBrandFromHostname('evil-skillhubcore.in')).toBeUndefined();
  });
});
