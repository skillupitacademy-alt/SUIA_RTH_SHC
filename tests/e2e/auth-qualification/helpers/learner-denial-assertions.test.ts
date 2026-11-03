import { describe, it, expect } from 'vitest';

/**
 * Validates unauthenticated learner dashboard denial response fail-closed.
 * Rejects wrong origins, foreign production hosts, arbitrary string matches,
 * network errors, and non-redirect responses.
 */
export function validateLearnerDashboardDenial(params: {
  status: number;
  finalUrl: string;
  expectedOrigin: string;
}): void {
  // 1. Must be redirect status
  if (![302, 307, 308].includes(params.status)) {
    throw new Error(`Expected redirect status (302/307/308), received ${params.status}`);
  }

  // 2. Must resolve strictly to expected same-origin login
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(params.finalUrl);
  } catch {
    throw new Error(`Invalid redirect URL: ${params.finalUrl}`);
  }

  const expectedOriginUrl = new URL(params.expectedOrigin);

  if (parsedUrl.origin.toLowerCase() !== expectedOriginUrl.origin.toLowerCase()) {
    throw new Error(
      `Redirect target origin mismatch: expected ${expectedOriginUrl.origin}, received ${parsedUrl.origin}`
    );
  }

  if (parsedUrl.pathname !== '/login') {
    throw new Error(`Redirect target path mismatch: expected /login, received ${parsedUrl.pathname}`);
  }

  const redirectParam = parsedUrl.searchParams.get('redirect');
  if (redirectParam !== '/dashboard') {
    throw new Error(`Redirect return parameter mismatch: expected /dashboard, received ${redirectParam}`);
  }
}

describe('Learner Denial Fail-Closed Assertions (Offline Synthetic Tests)', () => {
  const localSuiaOrigin = 'http://skillup.localhost:3009';

  it('passes on valid exact same-origin /login?redirect=/dashboard response', () => {
    expect(() =>
      validateLearnerDashboardDenial({
        status: 307,
        finalUrl: 'http://skillup.localhost:3009/login?redirect=%2Fdashboard',
        expectedOrigin: localSuiaOrigin,
      })
    ).not.toThrow();
  });

  it('fails closed when response is HTTP 200 (direct dashboard access allowed without auth)', () => {
    expect(() =>
      validateLearnerDashboardDenial({
        status: 200,
        finalUrl: 'http://skillup.localhost:3009/dashboard',
        expectedOrigin: localSuiaOrigin,
      })
    ).toThrow(/Expected redirect status/);
  });

  it('fails closed when redirect points to foreign/production origin (origin mismatch)', () => {
    expect(() =>
      validateLearnerDashboardDenial({
        status: 307,
        finalUrl: 'https://user.skillupitacademy.com/login?redirect=%2Fdashboard',
        expectedOrigin: localSuiaOrigin,
      })
    ).toThrow(/Redirect target origin mismatch/);
  });

  it('fails closed when redirect path is not /login', () => {
    expect(() =>
      validateLearnerDashboardDenial({
        status: 307,
        finalUrl: 'http://skillup.localhost:3009/unauthorized?redirect=%2Fdashboard',
        expectedOrigin: localSuiaOrigin,
      })
    ).toThrow(/Redirect target path mismatch/);
  });

  it('fails closed when redirect parameter is missing', () => {
    expect(() =>
      validateLearnerDashboardDenial({
        status: 307,
        finalUrl: 'http://skillup.localhost:3009/login',
        expectedOrigin: localSuiaOrigin,
      })
    ).toThrow(/Redirect return parameter mismatch/);
  });
});
