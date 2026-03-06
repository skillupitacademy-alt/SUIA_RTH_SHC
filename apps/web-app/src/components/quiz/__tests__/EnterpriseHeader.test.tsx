import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnterpriseHeader } from '../EnterpriseHeader';

describe('EnterpriseHeader', () => {
    const defaultProps = {
        error: null,
        setError: vi.fn(),
        questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }],
        currentQuestionIndex: 0,
        answers: { q2: 1 },
        markedForReview: ['q3'],
        timeLeft: 600,
        formatTime: vi.fn((s) => `${Math.floor(s / 60)}:00`),
        onSetCurrentIndex: vi.fn(),
        onFinish: vi.fn(),
        isSubmitting: false,
    };

    it('should render the header title and domain', () => {
        render(<EnterpriseHeader {...defaultProps} />);
        expect(screen.getByText('Enterprise Exam')).toBeInTheDocument();
        expect(screen.getByText('Domain: Technical Assessment')).toBeInTheDocument();
    });

    it('should show an error message when error is provided', () => {
        render(<EnterpriseHeader {...defaultProps} error="Critical Error" />);
        expect(screen.getByText('Critical Error')).toBeInTheDocument();
    });

    it('should call setError(null) when dismiss button is clicked', () => {
        render(<EnterpriseHeader {...defaultProps} error="Critical Error" />);
        const dismissButton = screen.getByLabelText('Dismiss error message');
        fireEvent.click(dismissButton);
        expect(defaultProps.setError).toHaveBeenCalledWith(null);
    });

    it('should render all question buttons with correct labels', () => {
        render(<EnterpriseHeader {...defaultProps} />);
        expect(screen.getByLabelText('Go to question 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Go to question 2 (answered)')).toBeInTheDocument();
        expect(screen.getByLabelText('Go to question 3 (marked for review)')).toBeInTheDocument();
    });

    it('should call onSetCurrentIndex when a question button is clicked', () => {
        render(<EnterpriseHeader {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(defaultProps.onSetCurrentIndex).toHaveBeenCalledWith(1);
    });

    it('should apply urgency styles when timeLeft < 300', () => {
        const { container } = render(<EnterpriseHeader {...defaultProps} timeLeft={299} />);
        const timerContainer = container.querySelector('.border-red-500');
        expect(timerContainer).toBeInTheDocument();
        expect(timerContainer).toHaveClass('text-red-500');
    });

    it('should call onFinish when Submit Exam is clicked', () => {
        render(<EnterpriseHeader {...defaultProps} />);
        fireEvent.click(screen.getByText('Submit Exam'));
        expect(defaultProps.onFinish).toHaveBeenCalled();
    });

    it('should show Submitting... when isSubmitting is true', () => {
        render(<EnterpriseHeader {...defaultProps} isSubmitting={true} />);
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(screen.getByLabelText('Submit exam')).toBeDisabled();
    });
});
