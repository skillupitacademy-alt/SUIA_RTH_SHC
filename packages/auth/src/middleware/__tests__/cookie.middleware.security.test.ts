/**
 * Cookie Domain Security Tests
 * 
 * Tests validateCookieDomain() to ensure it prevents domain spoofing attacks.
 * Critical security boundary: must reject malicious domains that contain brand domains as substrings.
 */

import { describe, it, expect } from 'vitest';
import { validateCookieDomain } from '../cookie.middleware';

describe('validateCookieDomain - Security Tests', () => {
  describe('SkillHubCore domain validation', () => {
    it('accepts valid skillhubcore.in domain', () => {
      expect(() => validateCookieDomain('skillhubcore.in', 'skillhubcore')).not.toThrow();
    });

    it('accepts valid *.skillhubcore.in subdomain', () => {
      expect(() => validateCookieDomain('app.skillhubcore.in', 'skillhubcore')).not.toThrow();
      expect(() => validateCookieDomain('www.skillhubcore.in', 'skillhubcore')).not.toThrow();
    });

    it('accepts localhost variations for skillhubcore', () => {
      expect(() => validateCookieDomain('shc.localhost', 'skillhubcore')).not.toThrow();
      expect(() => validateCookieDomain('skillhubcore.localhost', 'skillhubcore')).not.toThrow();
    });

    it('rejects domain spoofing: skillhubcore.in.evil.com', () => {
      expect(() => validateCookieDomain('skillhubcore.in.evil.com', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects domain spoofing: evil-skillhubcore.in', () => {
      expect(() => validateCookieDomain('evil-skillhubcore.in', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects domain spoofing: skillhubcorexin', () => {
      expect(() => validateCookieDomain('skillhubcorexin', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects unrelated domains containing substring', () => {
      expect(() => validateCookieDomain('fakeskillhubcore.in.attacker.com', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
    });
  });

  describe('RealTutorialHub domain validation', () => {
    it('accepts valid realtutorialhub.com domain', () => {
      expect(() => validateCookieDomain('realtutorialhub.com', 'realtutorialhub')).not.toThrow();
    });

    it('accepts valid *.realtutorialhub.com subdomain', () => {
      expect(() => validateCookieDomain('app.realtutorialhub.com', 'realtutorialhub')).not.toThrow();
      expect(() => validateCookieDomain('www.realtutorialhub.com', 'realtutorialhub')).not.toThrow();
    });

    it('accepts localhost variations for realtutorialhub', () => {
      expect(() => validateCookieDomain('rth.localhost', 'realtutorialhub')).not.toThrow();
      expect(() => validateCookieDomain('realtutorialhub.localhost', 'realtutorialhub')).not.toThrow();
    });

    it('rejects domain spoofing: realtutorialhub.com.evil.com', () => {
      expect(() => validateCookieDomain('realtutorialhub.com.evil.com', 'realtutorialhub')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects domain spoofing: evil-realtutorialhub.com', () => {
      expect(() => validateCookieDomain('evil-realtutorialhub.com', 'realtutorialhub')).toThrow(/Cookie domain mismatch/);
    });
  });

  describe('SkillUp domain validation', () => {
    it('accepts valid skillupitacademy.com domain', () => {
      expect(() => validateCookieDomain('skillupitacademy.com', 'skillup')).not.toThrow();
    });

    it('accepts valid *.skillupitacademy.com subdomain', () => {
      expect(() => validateCookieDomain('app.skillupitacademy.com', 'skillup')).not.toThrow();
      expect(() => validateCookieDomain('www.skillupitacademy.com', 'skillup')).not.toThrow();
    });

    it('accepts localhost variations for skillup', () => {
      expect(() => validateCookieDomain('skillup.localhost', 'skillup')).not.toThrow();
    });

    it('rejects domain spoofing: skillupitacademy.com.evil.com', () => {
      expect(() => validateCookieDomain('skillupitacademy.com.evil.com', 'skillup')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects domain spoofing: evil-skillupitacademy.com', () => {
      expect(() => validateCookieDomain('evil-skillupitacademy.com', 'skillup')).toThrow(/Cookie domain mismatch/);
    });
  });

  describe('Generic attack vectors', () => {
    it('rejects raw localhost without brand prefix', () => {
      expect(() => validateCookieDomain('localhost', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('localhost', 'realtutorialhub')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('localhost', 'skillup')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects 127.0.0.1', () => {
      expect(() => validateCookieDomain('127.0.0.1', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('127.0.0.1', 'realtutorialhub')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('127.0.0.1', 'skillup')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects localhost with port', () => {
      expect(() => validateCookieDomain('localhost:3007', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects completely unrelated domains', () => {
      expect(() => validateCookieDomain('attacker.com', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('evil.org', 'realtutorialhub')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('phishing.net', 'skillup')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects empty string', () => {
      expect(() => validateCookieDomain('', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
    });

    it('rejects brand mismatch', () => {
      expect(() => validateCookieDomain('realtutorialhub.com', 'skillhubcore')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('skillupitacademy.com', 'realtutorialhub')).toThrow(/Cookie domain mismatch/);
      expect(() => validateCookieDomain('skillhubcore.in', 'skillup')).toThrow(/Cookie domain mismatch/);
    });
  });

  describe('Edge cases', () => {
    it('handles case sensitivity correctly', () => {
      // Domains are case-insensitive per DNS spec, resolver normalizes
      expect(() => validateCookieDomain('SKILLHUBCORE.IN', 'skillhubcore')).not.toThrow();
      expect(() => validateCookieDomain('SkillHubCore.in', 'skillhubcore')).not.toThrow();
    });

    it('handles multiple subdomains', () => {
      expect(() => validateCookieDomain('api.app.skillhubcore.in', 'skillhubcore')).not.toThrow();
      expect(() => validateCookieDomain('cdn.static.realtutorialhub.com', 'realtutorialhub')).not.toThrow();
    });

    it('handles domains with trailing dots (normalized)', () => {
      // Trailing dots are valid DNS and are normalized away by the resolver
      expect(() => validateCookieDomain('skillhubcore.in.', 'skillhubcore')).not.toThrow();
    });
  });
});
