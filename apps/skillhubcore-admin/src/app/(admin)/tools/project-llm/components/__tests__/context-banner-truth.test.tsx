import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../context/ProjectLlmContext', () => ({ useProjectLlm: () => ({ state: { familyName: 'Introduction', targetVersion: 'I7', purpose: '', existingVersions: [] } }) }));
import { ProjectLlmContextBanner } from '../ProjectLlmContextBanner';
afterEach(cleanup);
it('labels draft context and does not infer an initial version from an empty list', () => {
  render(<ProjectLlmContextBanner />);
  expect(screen.getByText('Draft purpose')).toBeTruthy();
  expect(screen.getByText('Proposed')).toBeTruthy();
  expect(screen.getByText('No versions supplied')).toBeTruthy();
  expect(screen.queryByText('None (initial version)')).toBeNull();
});
it('shows supplied version references without claiming runtime registration', () => {
  render(<ProjectLlmContextBanner existingVersions={['I1', 'I2']} purpose="Draft purpose text" />);
  expect(screen.getByText('2 versions supplied')).toBeTruthy();
  expect(screen.getByText('I1')).toBeTruthy();
  expect(screen.getByText('Draft purpose text')).toBeTruthy();
});
