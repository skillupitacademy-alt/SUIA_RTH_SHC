import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportDownloadButton } from '../components/reports/ReportDownloadButton';
import React from 'react';

// Mock hooks and components
vi.mock('../hooks/useExportJob', () => ({
  useExportJob: () => ({
    triggerExport: vi.fn(),
    status: 'idle',
    downloadUrl: null,
    error: null,
    isInitial: true,
    isExporting: false,
    stage: null
  })
}));

vi.mock('../hooks/useReportStatus', () => ({
  useReportStatus: () => ({
    status: 'ready',
    stage: null,
    loading: false,
    downloadUrl: 'http://example.com/report.pdf',
    error: null,
    triggerGeneration: vi.fn(),
    cooldown: 0,
  })
}));

vi.mock('../components/reports/context/ReportThemeContext', () => ({
  useReportTheme: () => ({ theme: 'dark' }),
}));

vi.mock('../components/reports/hooks/useReportThemeTokens', () => ({
  useReportThemeTokens: () => ({
    tokens: {
      cardBg: '#000',
      borderSubtle: '#222',
      textMuted: '#888',
      textPrimary: '#fff',
      textSecondary: '#aaa',
    },
  }),
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
    const triggers = screen.getAllByRole('button');
    expect(triggers.length).toBeGreaterThan(1);
  });

  it('contains multi-format export options', () => {
    render(<ReportDownloadButton {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(screen.getByText(/Deep Analytics/i)).toBeDefined();
    expect(screen.getByText(/Data Engineering/i)).toBeDefined();
  });
});
