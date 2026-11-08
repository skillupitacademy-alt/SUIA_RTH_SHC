/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuestionTable } from '../QuestionTable';

const { mockBatchDeleteQuestions, sampleQuestions } = vi.hoisted(() => ({
  mockBatchDeleteQuestions: vi.fn().mockResolvedValue({ success: true }),
  sampleQuestions: [
    {
      id: 'q-1',
      title: 'Sample Question 1',
      domainId: 'd-1',
      subjectId: 's-1',
      topicId: 't-1',
      subtopicId: 'sub-1',
      skillId: 'sk-1',
      difficulty: 'easy',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
}));

vi.mock('@quiz/api-client', () => ({
  apiClient: {
    admin: {
      getQuestions: vi.fn().mockResolvedValue({ data: sampleQuestions, nextCursor: null }),
      getDomains: vi.fn().mockResolvedValue({ data: [] }),
      getSubjects: vi.fn().mockResolvedValue({ data: [] }),
      getTopics: vi.fn().mockResolvedValue({ data: [] }),
      getSubtopics: vi.fn().mockResolvedValue({ data: [] }),
      getSkills: vi.fn().mockResolvedValue({ data: [] }),
      deleteQuestion: vi.fn().mockResolvedValue({ success: true }),
      batchDeleteQuestions: (...args: unknown[]) => mockBatchDeleteQuestions(...args),
    },
  },
}));

vi.mock('@quiz/ui', () => ({
  HierarchySearchBar: () => null,
  ZLoader: () => null,
  ZPagination: () => null,
  ZPortalModal: () => null,
  SelectField: () => null,
  useDebounce: (val: unknown) => val,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  clientLogger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('QuestionTable Bulk Deletion Modal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not invoke batchDeleteQuestions immediately when clicking Delete Selected', async () => {
    render(<QuestionTable />);

    // Wait for questions to load and checkboxes to appear
    const checkboxes = await waitFor(() => {
      const items = screen.getAllByRole('checkbox');
      expect(items.length).toBeGreaterThan(0);
      return items;
    });

    // Click "Select All" checkbox
    fireEvent.click(checkboxes[0]);

    // Click "Delete Selected" button
    const deleteSelectedBtn = await screen.findByText(/Delete Selected/i);
    fireEvent.click(deleteSelectedBtn);

    // Modal should now be open with confirmation copy
    expect(screen.getByText(/Confirm Bulk Deletion/i)).toBeDefined();
    expect(
      screen.getByText(/Are you sure you want to decommission/i)
    ).toBeDefined();

    // Verify backend batch delete was NOT called yet
    expect(mockBatchDeleteQuestions).not.toHaveBeenCalled();

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    fireEvent.click(cancelBtn);

    // Still not called
    expect(mockBatchDeleteQuestions).not.toHaveBeenCalled();
  });

  it('invokes batchDeleteQuestions when clicking confirm inside the modal', async () => {
    render(<QuestionTable />);

    // Wait for questions to load
    const checkboxes = await waitFor(() => {
      const items = screen.getAllByRole('checkbox');
      expect(items.length).toBeGreaterThan(0);
      return items;
    });

    // Select all questions
    fireEvent.click(checkboxes[0]);

    // Click "Delete Selected" button to open modal
    const deleteSelectedBtn = await screen.findByText(/Delete Selected/i);
    fireEvent.click(deleteSelectedBtn);

    // Confirm button inside modal
    const confirmBtn = screen.getByRole('button', { name: /decommission 1 questions/i });
    fireEvent.click(confirmBtn);

    // Verify backend batch delete WAS called
    expect(mockBatchDeleteQuestions).toHaveBeenCalledWith(['q-1']);
  });
});
