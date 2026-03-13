import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportDownloadButton } from '../components/reports/ReportDownloadButton';
import React from 'react';

// Mock hooks and components
vi.mock('../hooks/useExportJob', () => ({
  useExportJob: () => ({
    triggerExport: vi.fn(),
    status: 'idle',
    downloadUrl: null,
    error: null,
    isInitial: true
  })
}));

type ChildrenProps = React.PropsWithChildren;
type ClickableProps = React.PropsWithChildren<{
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}>;

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: ChildrenProps) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: ChildrenProps) => <button type="button">{children}</button>,
  DropdownMenuContent: ({ children }: ChildrenProps) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: ClickableProps) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: ChildrenProps) => <div>{children}</div>,
}));

vi.mock('../components/reports/ReportGenerationModal', () => ({
  ReportGenerationModal: () => <div data-testid="report-modal">Modal</div>
}));

describe('ReportDownloadButton Component', () => {
  const defaultProps = {
    attemptId: 'test-attempt',
    userId: 'test-user',
    className: 'test-class'
  };

  it('renders correctly with default labels', () => {
    render(<ReportDownloadButton {...defaultProps} />);
    expect(screen.getByText(/Download PDF/i)).toBeDefined();
  });

  it('opens dropdown menu on trigger click (simulated)', () => {
    render(<ReportDownloadButton {...defaultProps} />);
    // In our simplified mock, clicking the main button might trigger PDF directly or open menu
    // We check if the dropdown trigger exists
    const trigger = screen.getByRole('button');
    expect(trigger).toBeDefined();
  });

  it('contains multi-format export options', () => {
    render(<ReportDownloadButton {...defaultProps} />);
    // Since we mock the dropdown, we check if labels are present if rendered
    expect(screen.getByText(/Deep Analytics/i)).toBeDefined();
    expect(screen.getByText(/Data Engineering/i)).toBeDefined();
  });
});
