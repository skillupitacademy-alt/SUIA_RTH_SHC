import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnterpriseControls } from '../EnterpriseControls';

describe('EnterpriseControls', () => {
    const defaultProps = {
        currentQuestionIndex: 0,
        totalQuestions: 5,
        questionId: 'q1',
        isMarkedForReview: false,
        onSetCurrentIndex: vi.fn(),
        onToggleReview: vi.fn(),
        onFinish: vi.fn(),
        isSubmitting: false,
    };

    it('should disable Previous button on the first question', () => {
        render(<EnterpriseControls {...defaultProps} />);
        const prevButton = screen.getByLabelText('Previous question');
        expect(prevButton).toBeDisabled();
    });

    it('should enable Previous button on subsequent questions', () => {
        render(<EnterpriseControls {...defaultProps} currentQuestionIndex={1} />);
        const prevButton = screen.getByLabelText('Previous question');
        expect(prevButton).not.toBeDisabled();
        fireEvent.click(prevButton);
        expect(defaultProps.onSetCurrentIndex).toHaveBeenCalledWith(0);
    });

    it('should show Next Question on non-terminal questions', () => {
        render(<EnterpriseControls {...defaultProps} />);
        expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('should show Finish Attempt on the last question', () => {
        render(<EnterpriseControls {...defaultProps} currentQuestionIndex={4} />);
        expect(screen.getByText('Finish Attempt')).toBeInTheDocument();
    });

    it('should call onToggleReview when review button is clicked', () => {
        render(<EnterpriseControls {...defaultProps} />);
        const reviewButton = screen.getByText('Review later');
        fireEvent.click(reviewButton);
        expect(defaultProps.onToggleReview).toHaveBeenCalledWith('q1');
    });

    it('should show active state when isMarkedForReview is true', () => {
        render(<EnterpriseControls {...defaultProps} isMarkedForReview={true} />);
        const reviewButton = screen.getByLabelText('Unmark question for review');
        expect(reviewButton).toHaveClass('bg-orange-500');
    });

    it('should call onFinish when Finish Attempt is clicked', () => {
        render(<EnterpriseControls {...defaultProps} currentQuestionIndex={4} />);
        fireEvent.click(screen.getByText('Finish Attempt'));
        expect(defaultProps.onFinish).toHaveBeenCalled();
    });

    it('should show Submitting... when isSubmitting is true', () => {
        render(<EnterpriseControls {...defaultProps} currentQuestionIndex={4} isSubmitting={true} />);
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
});
