import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ContentFactoryPage from '../content/page';
import TutorialDashboardPage from '../tutorial/page';

vi.mock('@/hooks/useAdminHierarchy', () => ({
  useDomains: () => ({ data: [{ id: 'dom-1', name: 'Software Engineering', slug: 'software-engineering' }], loading: false }),
  useSubjects: () => ({ data: [{ id: 'sub-1', name: 'Java', slug: 'java' }], loading: false }),
  useTopics: () => ({ data: [{ id: 'top-1', name: 'Basics', slug: 'basics' }], loading: false }),
  useSubtopics: () => ({ data: [{ id: 'subtop-1', name: 'Overview', slug: 'overview' }], loading: false }),
}));

vi.mock('@/components/admin/BlockEditor', () => ({
  BlockEditor: () => <div data-testid="mock-block-editor" />,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('RTH Admin Legacy Tutorial Retirement (OD-01, OD-05, R2)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('ContentFactoryPage', () => {
    it('renders the retirement banner and does not provide Save Draft or Publish buttons', () => {
      render(<ContentFactoryPage />);

      // Verify retirement guidance banner is visible
      expect(
        screen.getByText(/Tutorial authoring is retired in RTH Admin\. Content is authored and published exclusively in SHC Admin Tutorial Composer/i)
      ).toBeDefined();

      // Verify obsolete Save Draft and Publish buttons do not exist
      expect(screen.queryByRole('button', { name: /save draft/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /^publish$/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /publish content/i })).toBeNull();

      // Zero calls made to retired tutorial content endpoints
      const tutorialContentCalls = fetchMock.mock.calls.filter((call: [string, RequestInit?]) =>
        typeof call[0] === 'string' && call[0].includes('/api/tutorial/content')
      );
      expect(tutorialContentCalls.length).toBe(0);
    });
  });

  describe('TutorialDashboardPage', () => {
    it('renders retirement guidance on Version History tab with zero legacy network calls', async () => {
      render(<TutorialDashboardPage />);

      // Switch to Version History tab
      const versionTab = screen.getByRole('button', { name: /version history/i });
      fireEvent.click(versionTab);

      // Verify retirement explanation
      expect(
        screen.getByText(/Version Management Centralized in SHC Admin/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Direct version inspection and restoration from RTH Admin are permanently retired/i)
      ).toBeDefined();

      // Restore button must not exist
      expect(screen.queryByRole('button', { name: /restore/i })).toBeNull();

      // Zero calls made to /api/tutorial/content/versions or restore
      const versionCalls = fetchMock.mock.calls.filter((call: [string, RequestInit?]) =>
        typeof call[0] === 'string' &&
        (call[0].includes('/api/tutorial/content/versions') || call[0].includes('/restore'))
      );
      expect(versionCalls.length).toBe(0);
    });

    it('renders retirement guidance on Audit Log tab with zero legacy network calls', async () => {
      render(<TutorialDashboardPage />);

      // Switch to Audit Log tab
      const auditTab = screen.getByRole('button', { name: /audit log/i });
      fireEvent.click(auditTab);

      // Verify retirement explanation
      expect(
        screen.getByText(/Tutorial Audit Logs Centralized in SHC Admin/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Direct audit trail queries from RTH Admin are permanently retired/i)
      ).toBeDefined();

      // Zero calls made to /api/tutorial/content/audit
      const auditCalls = fetchMock.mock.calls.filter((call: [string, RequestInit?]) =>
        typeof call[0] === 'string' && call[0].includes('/api/tutorial/content/audit')
      );
      expect(auditCalls.length).toBe(0);
    });
  });
});

