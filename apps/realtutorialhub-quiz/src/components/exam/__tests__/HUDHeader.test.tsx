import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HUDHeader } from '../HUDHeader';

describe('HUDHeader', () => {
    const defaultProps = {
        examId: 'test-exam-id',
        timeLeft: 600,
        isNearEnd: false,
        formatTime: vi.fn((s) => `${Math.floor(s / 60)}:00`),
        onTerminate: vi.fn(),
        theme: {
            spacing: { headerHeight: 'h-20' }
        }
    };

    it('should render the exam id and formatted time', () => {
        render(<HUDHeader {...defaultProps} />);
        expect(screen.getByText('test-exam-id')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('should apply urgency styles when isNearEnd is true', () => {
        const { container } = render(<HUDHeader {...defaultProps} isNearEnd={true} />);
        const timerContainer = container.querySelector('.animate-pulse');
        expect(timerContainer).toBeInTheDocument();
        expect(timerContainer).toHaveClass('border-pink-500/50');
    });

    it('should call onTerminate when button is clicked', () => {
        render(<HUDHeader {...defaultProps} />);
        const button = screen.getByText('TERMINATE SESSION');
        fireEvent.click(button);
        expect(defaultProps.onTerminate).toHaveBeenCalled();
    });
});
