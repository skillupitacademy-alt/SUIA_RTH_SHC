import { describe, it, expect } from 'vitest';
import { verifyCookiePolicySafely, ContextCookie, CookiePolicyRule } from './cookie-policy-verifier';

describe('Task-local Cookie Policy Verifier (Offline Synthetic Tests)', () => {
  const validCookies: ContextCookie[] = [
    {
      name: 'accessToken',
      domain: '.skillup.localhost',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
    {
      name: 'refreshToken',
      domain: 'skillup.localhost',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
    {
      name: 'csrfToken',
      domain: 'skillup.localhost',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    },
  ];

  const standardRules: CookiePolicyRule[] = [
    {
      name: 'accessToken',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      exactDomain: 'skillup.localhost',
      exactPath: '/',
    },
  ];

  it('passes on valid canonical cookies with matching attributes', () => {
    expect(() => verifyCookiePolicySafely(validCookies, standardRules)).not.toThrow();
  });

  it('fails closed when required cookie is absent', () => {
    expect(() =>
      verifyCookiePolicySafely(validCookies, [
        { name: 'nonExistentCookie', httpOnly: true },
      ])
    ).toThrow(/must be present in context/);
  });

  it('fails closed when duplicate same-name cookies exist with scope ambiguity', () => {
    const duplicateCookies: ContextCookie[] = [
      {
        name: 'accessToken',
        domain: '.skillup.localhost',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'accessToken',
        domain: 'skillup.localhost',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ];

    expect(() => verifyCookiePolicySafely(duplicateCookies, standardRules)).toThrow(
      /must have exactly 1 instance in context/
    );
  });

  it('fails closed when httpOnly flag mismatches', () => {
    const badCookies: ContextCookie[] = [
      {
        name: 'accessToken',
        domain: 'skillup.localhost',
        path: '/',
        httpOnly: false, // mismatch
        secure: true,
        sameSite: 'None',
      },
    ];

    expect(() => verifyCookiePolicySafely(badCookies, standardRules)).toThrow(/HttpOnly match/);
  });

  it('fails closed when secure flag mismatches', () => {
    const badCookies: ContextCookie[] = [
      {
        name: 'accessToken',
        domain: 'skillup.localhost',
        path: '/',
        httpOnly: true,
        secure: false, // mismatch
        sameSite: 'None',
      },
    ];

    expect(() => verifyCookiePolicySafely(badCookies, standardRules)).toThrow(/Secure match/);
  });

  it('fails closed when sameSite mismatches', () => {
    const badCookies: ContextCookie[] = [
      {
        name: 'accessToken',
        domain: 'skillup.localhost',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax', // mismatch: expected None
      },
    ];

    expect(() => verifyCookiePolicySafely(badCookies, standardRules)).toThrow(/SameSite match/);
  });

  it('fails closed when path mismatches', () => {
    const badCookies: ContextCookie[] = [
      {
        name: 'accessToken',
        domain: 'skillup.localhost',
        path: '/api', // mismatch: expected /
        httpOnly: true,
        secure: true,
        sameSite: 'None',
      },
    ];

    expect(() => verifyCookiePolicySafely(badCookies, standardRules)).toThrow(/Path match/);
  });

  it('fails closed when domain is foreign or an unauthorized extra subdomain', () => {
    const extraSubdomainCookies: ContextCookie[] = [
      {
        name: 'accessToken',
        domain: 'sub.skillup.localhost', // mismatch: expected skillup.localhost
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
      },
    ];

    expect(() => verifyCookiePolicySafely(extraSubdomainCookies, standardRules)).toThrow(
      /Domain match/
    );
  });
});
