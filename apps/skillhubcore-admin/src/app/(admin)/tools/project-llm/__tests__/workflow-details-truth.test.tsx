import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
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
    state: { workflowId: '' },
  }),
}));

// Mock Project LLM client - returns unavailable data
vi.mock('@/lib/project-llm/api/projectLlmClient', () => ({
  projectLlmClient: {
    getWorkflowState: vi.fn(() =>
      Promise.reject(new Error('Workflow state unavailable in offline test'))
    ),
  },
}));

import Page from '../workflow-details/page';

it('marks unsourced workflow and evidence details unavailable without live backend', async () => {
  render(<Page />);

  // Verify unavailable message is shown
  expect(screen.getByText(/Audit history and verification evidence are currently unavailable/i)).toBeTruthy();

  // Verify no fabricated workflow state appears
  expect(screen.queryByText(/Workflow status:.*CERTIFIED/i)).toBeNull();
  expect(screen.queryByText(/Workflow status:.*APPROVED/i)).toBeNull();
  expect(screen.queryByText(/Workflow status:.*VERIFIED/i)).toBeNull();
});

it('marks unsourced audit history unavailable', () => {
  render(<Page />);

  // Verify audit history is explicitly marked unavailable
  expect(screen.getByText(/Audit history.*unavailable/i)).toBeTruthy();

  // Verify no fabricated audit entries
  expect(screen.queryByText(/audit.*entry/i)).toBeNull();
  expect(screen.queryByText(/timestamp.*verified/i)).toBeNull();
});
