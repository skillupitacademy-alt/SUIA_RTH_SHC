/**
 * Learning Progress Sidebar Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LearningProgressSidebar } from '../LearningProgressSidebar';
import type { ILSContextValue } from '../../ILSProvider';
import * as ILSProviderModule from '../../ILSProvider';

// Mock the ILSProvider module
vi.mock('../../ILSProvider', async () => {
  const actual = await vi.importActual<typeof ILSProviderModule>('../../ILSProvider');
  return {
    ...actual,
    useILS: vi.fn(),
  };
});

const mockUseILS = vi.mocked(ILSProviderModule.useILS);

describe('LearningProgressSidebar', () => {
  const defaultBrand = {
    primaryColor: '#f54a8d',
    secondaryColor: '#133382',
  };
  
  const mockILSData: ILSContextValue = {
    navigationNodeId: 'test-node',
    subtopicId: 'test-subtopic',
    sectionId: null,
    overallProgress: {
      status: 'in_progress',
      progressPercentage: 67,
      completedBlockCount: 2,
      totalBlockCount: 3,
      visitCount: 5,
      revisionCount: 2,
      timeSpentActiveSec: 120,
      firstViewedAt: new Date('2026-01-10'),
      lastViewedAt: new Date('2026-01-15'),
      completedAt: null,
    },
    activeBlockProgress: {
      blockId: 'block-d1',
      blockType: 'D1',
      blockVersion: 'D1',
      isCompleted: false,
      completedAt: null,
      visitCount: 2,
      revisionCount: 1,
      activeTimeSec: 60,
      expectedTimeSec: 180,
      firstViewedAt: new Date('2026-01-10T10:00:00Z'),
      lastViewedAt: new Date('2026-01-15T14:30:00Z'),
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  };
  
  beforeEach(() => {
    mockUseILS.mockReturnValue(mockILSData);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render with isOpen=false (hidden)', () => {
    const { container } = render(
      <LearningProgressSidebar
        isOpen={false}
        onClose={vi.fn()}
        brand={defaultBrand}
      />
    );
    
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-full');
  });
  
  it('should render with isOpen=true (visible)', () => {
    const { container } = render(
      <LearningProgressSidebar
        isOpen={true}
        onClose={vi.fn()}
        brand={defaultBrand}
      />
    );
    
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-0');
  });
  
  it('should display "Learning Progress" title', () => {
    render(
      <LearningProgressSidebar
        isOpen={true}
        onClose={vi.fn()}
        brand={defaultBrand}
      />
    );
    
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
  });
  
  it('should display all 4 section titles', () => {
    render(
      <LearningProgressSidebar
        isOpen={true}
        onClose={vi.fn()}
        brand={defaultBrand}
      />
    );
    
    expect(screen.getByText('Lifecycle Metrics')).toBeInTheDocument();
    expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
    expect(screen.getByText('Time Analysis')).toBeInTheDocument();
  });
  
  it('should display loading state', () => {
    mockUseILS.mockReturnValue({ ...mockILSData, loading: true });
    
    render(
      <LearningProgressSidebar
        isOpen={true}
        onClose={vi.fn()}
        brand={defaultBrand}
      />
    );
    
    expect(screen.getByText('Loading progress...')).toBeInTheDocument();
  });
  
  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    
    render(
      <LearningProgressSidebar
        isOpen={true}
        onClose={onClose}
        brand={defaultBrand}
      />
    );
    
    const closeButton = screen.getByLabelText('Close sidebar');
    closeButton.click();
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  
  it('should call onClose when overlay clicked', () => {
    const onClose = vi.fn();
    
    const { container } = render(
      <LearningProgressSidebar
        isOpen={true}
        onClose={onClose}
        brand={defaultBrand}
      />
    );
    
    const overlay = container.querySelector('div[aria-hidden="true"]');
    expect(overlay).toBeTruthy();
    
    if (overlay) {
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

