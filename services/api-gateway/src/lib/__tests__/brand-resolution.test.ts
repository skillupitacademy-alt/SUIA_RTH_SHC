import { describe, expect, it } from 'vitest';

import {
  resolveBrandFromHostname,
  isSupportedBrand,
} from '../brand-resolution';

describe('resolveBrandFromHostname', () => {
  describe('SkillUp local development', () => {
    it('resolves skillup.localhost', () => {
      expect(
        resolveBrandFromHostname(
          'skillup.localhost',
        ),
      ).toBe('skillup');
    });

    it('resolves skillup.localhost case-insensitively', () => {
      expect(
        resolveBrandFromHostname(
          'SKILLUP.LOCALHOST',
        ),
      ).toBe('skillup');
    });

    it('resolves with trailing dot', () => {
      expect(
        resolveBrandFromHostname(
          'skillup.localhost.',
        ),
      ).toBe('skillup');
    });
  });

  describe('RTH local development', () => {
    it('resolves rth.localhost', () => {
      expect(
        resolveBrandFromHostname(
          'rth.localhost',
        ),
      ).toBe('realtutorialhub');
    });

    it('resolves rth.localhost case-insensitively', () => {
      expect(
        resolveBrandFromHostname(
          'RTH.LOCALHOST',
        ),
      ).toBe('realtutorialhub');
    });
  });

  describe('production SkillUp', () => {
    it('resolves apex domain', () => {
      expect(
        resolveBrandFromHostname(
          'skillupitacademy.com',
        ),
      ).toBe('skillup');
    });

    it('resolves user subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'user.skillupitacademy.com',
        ),
      ).toBe('skillup');
    });

    it('resolves admin subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'admin.skillupitacademy.com',
        ),
      ).toBe('skillup');
    });

    it('resolves api subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'api.skillupitacademy.com',
        ),
      ).toBe('skillup');
    });

    it('resolves faculty subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'faculty.skillupitacademy.com',
        ),
      ).toBe('skillup');
    });

    it('resolves case-insensitively', () => {
      expect(
        resolveBrandFromHostname(
          'USER.SKILLUPITACADEMY.COM',
        ),
      ).toBe('skillup');
    });
  });

  describe('production RTH', () => {
    it('resolves apex domain', () => {
      expect(
        resolveBrandFromHostname(
          'realtutorialhub.com',
        ),
      ).toBe('realtutorialhub');
    });

    it('resolves user subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'user.realtutorialhub.com',
        ),
      ).toBe('realtutorialhub');
    });

    it('resolves admin subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'admin.realtutorialhub.com',
        ),
      ).toBe('realtutorialhub');
    });

    it('resolves api subdomain', () => {
      expect(
        resolveBrandFromHostname(
          'api.realtutorialhub.com',
        ),
      ).toBe('realtutorialhub');
    });

    it('resolves case-insensitively', () => {
      expect(
        resolveBrandFromHostname(
          'USER.REALTUTORIALHUB.COM',
        ),
      ).toBe('realtutorialhub');
    });
  });

  describe('ambiguous hosts', () => {
    it('does not resolve localhost', () => {
      expect(
        resolveBrandFromHostname(
          'localhost',
        ),
      ).toBeUndefined();
    });

    it('does not resolve 127.0.0.1', () => {
      expect(
        resolveBrandFromHostname(
          '127.0.0.1',
        ),
      ).toBeUndefined();
    });

    it('does not resolve localhost with port', () => {
      expect(
        resolveBrandFromHostname(
          'localhost:3009',
        ),
      ).toBeUndefined();
    });

    it('does not default unknown host to RTH', () => {
      expect(
        resolveBrandFromHostname(
          'unknown.example.com',
        ),
      ).toBeUndefined();
    });

    it('does not resolve empty hostname', () => {
      expect(
        resolveBrandFromHostname(
          '',
        ),
      ).toBeUndefined();
    });

    it('does not resolve whitespace-only hostname', () => {
      expect(
        resolveBrandFromHostname(
          '   ',
        ),
      ).toBeUndefined();
    });
  });

  describe('hostname boundary protection', () => {
    it('rejects fake SkillUp suffix', () => {
      expect(
        resolveBrandFromHostname(
          'evil-skillupitacademy.com',
        ),
      ).toBeUndefined();
    });

    it('rejects SkillUp as a subdomain of another domain', () => {
      expect(
        resolveBrandFromHostname(
          'skillupitacademy.com.evil.com',
        ),
      ).toBeUndefined();
    });

    it('rejects fake RTH suffix', () => {
      expect(
        resolveBrandFromHostname(
          'evil-realtutorialhub.com',
        ),
      ).toBeUndefined();
    });

    it('rejects RTH as a subdomain of another domain', () => {
      expect(
        resolveBrandFromHostname(
          'realtutorialhub.com.evil.com',
        ),
      ).toBeUndefined();
    });

    it('rejects hostname containing skillup keyword', () => {
      expect(
        resolveBrandFromHostname(
          'my-skillup-site.example.com',
        ),
      ).toBeUndefined();
    });

    it('rejects similar-looking domains', () => {
      expect(
        resolveBrandFromHostname(
          'skillupacademy.com',
        ),
      ).toBeUndefined();
    });
  });
});

describe('isSupportedBrand', () => {
  it('identifies skillup as supported', () => {
    expect(isSupportedBrand('skillup')).toBe(true);
  });

  it('identifies realtutorialhub as supported', () => {
    expect(isSupportedBrand('realtutorialhub')).toBe(true);
  });

  it('rejects invalid brand', () => {
    expect(isSupportedBrand('invalid')).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isSupportedBrand(undefined)).toBe(false);
  });

  it('rejects null', () => {
    expect(isSupportedBrand(null)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isSupportedBrand('')).toBe(false);
  });
});
