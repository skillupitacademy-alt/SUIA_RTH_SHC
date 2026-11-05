import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

// Install offline network guard before importing page
beforeEach(() => {
  global.fetch = vi.fn(() => {
    throw new Error('TEST VIOLATION: Unexpected fetch() call during offline test. All network must be mocked.');
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Project LLM context
vi.mock('../context/ProjectLlmContext', () => ({
  useProjectLlm: () => ({
    state: { workflowId: '', familyName: '', targetVersion: '' },
    setState: vi.fn(),
  }),
}));

// Mock Project LLM client - returns unavailable/reference data only
vi.mock('@/lib/project-llm/api/projectLlmClient', () => ({
  projectLlmClient: {
    getCertificationStatus: vi.fn(() =>
      Promise.reject(new Error('Certification status unavailable in offline test'))
    ),
    getRuntimeHealth: vi.fn(() =>
      Promise.reject(new Error('Runtime health unavailable in offline test'))
    ),
    getBrowserVerificationStatus: vi.fn(() =>
      Promise.reject(new Error('Browser verification unavailable in offline test'))
    ),
    getPlacementManifest: vi.fn(() =>
      Promise.reject(new Error('Placement manifest unavailable in offline test'))
    ),
  },
  ProjectLlmError: class ProjectLlmError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ProjectLlmError';
    }
  },
}));

import Page from '../integration-certification/page';

it('marks unsourced certification health and approval evidence unavailable without live backend', async () => {
  render(<Page />);

  // Verify no fabricated PASS/VERIFIED/HEALTHY status appears without backend
  // The page shows PENDING statuses only when backend is unavailable
  expect(screen.queryByText(/HEALTHY/i)).toBeNull();

  // Verify no fabricated browser verification or runtime health data appears
  expect(screen.queryByText(/WCAG.*AA.*verified/i)).toBeNull();
  expect(screen.queryByText(/6.*width.*passed/i)).toBeNull();
  expect(screen.queryByText(/Axe.*audit.*passed/i)).toBeNull();
  
  // Page header should exist without fabricated certification claims
  expect(screen.getByText(/Integration.*Repository Certification/i)).toBeTruthy();
});

it('marks unsourced gate approval and evidence hash claims unavailable', () => {
  render(<Page />);

  // Verify no fabricated Gate 2/Gate 3 approval state without backend
  // Gates should show PENDING status only, not APPROVED
  expect(screen.queryByText(/Administrator.*approval.*verified/i)).toBeNull();

  // Verify no fabricated evidence SHA-256 values displayed (actual hex strings)
  // Stage labels are allowed, but actual hash values should not appear
  expect(screen.queryByText(/Evidence SHA-256:\s*[a-f0-9]{12}/i)).toBeNull();
  expect(screen.queryByText(/evidence_hash.*[a-f0-9]{12}/i)).toBeNull();
  expect(screen.queryByText(/screenshot_sha256.*[a-f0-9]/i)).toBeNull();
});

it('marks unsourced placement execution and manifest claims unavailable', () => {
  render(<Page />);

  // Verify no fabricated placement commit displayed without backend execution
  // Actual commit hashes should not appear without real placement
  expect(screen.queryByText(/Placement committed at [a-f0-9]{10}/i)).toBeNull();
  expect(screen.queryByText(/committed at isolated branch/i)).toBeNull();

  // Verify no fabricated manifest hash displayed (12+ hex chars)
  // Real manifest hashes require backend generation
  expect(screen.queryByText(/manifest [a-f0-9]{12,}/i)).toBeNull();
});
