import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HUDControls } from '../HUDControls';

describe('HUDControls', () => {
    const defaultProps = {
        currentIndex: 0,
        totalQuestions: 5,
        onGoToQuestion: vi.fn(),
        onSubmit: vi.fn(),
        isSubmitting: false,
        theme: {
            colors: {
                primaryButton: 'bg-pink-500',
                primaryButtonText: 'text-white',
                secondaryButton: 'bg-white',
                secondaryButtonText: 'text-gray-900',
            },
            effects: {
                buttonRadius: 'rounded-xl',
                primaryButtonShadow: 'shadow-pink-500/20',
            }
        }
    };

    it('should disable PREVIOUS button on the first question', () => {
        render(<HUDControls {...defaultProps} currentIndex={0} />);
        const prevButton = screen.getByText('PREVIOUS');
        expect(prevButton).toBeDisabled();
    });

    it('should enable PREVIOUS button on subsequent questions', () => {
        render(<HUDControls {...defaultProps} currentIndex={1} />);
        const prevButton = screen.getByText('PREVIOUS');
        expect(prevButton).not.toBeDisabled();
        fireEvent.click(prevButton);
        expect(defaultProps.onGoToQuestion).toHaveBeenCalledWith(0);
    });

    it('should show SAVE & NEXT on non-terminal questions', () => {
        render(<HUDControls {...defaultProps} currentIndex={0} />);
        expect(screen.getByText('SAVE & NEXT')).toBeInTheDocument();
    });

    it('should show FINISH on the last question', () => {
        render(<HUDControls {...defaultProps} currentIndex={4} />); // totalQuestions is 5
        expect(screen.getByText('FINISH')).toBeInTheDocument();
    });

    it('should call onSubmit when FINISH is clicked', () => {
        render(<HUDControls {...defaultProps} currentIndex={4} />);
        fireEvent.click(screen.getByText('FINISH'));
        expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it('should call onGoToQuestion(next) when SAVE & NEXT is clicked', () => {
        render(<HUDControls {...defaultProps} currentIndex={0} />);
        fireEvent.click(screen.getByText('SAVE & NEXT'));
        expect(defaultProps.onGoToQuestion).toHaveBeenCalledWith(1);
    });

    it('should disable button and show processing during submission', () => {
        render(<HUDControls {...defaultProps} isSubmitting={true} />);
        const finishButton = screen.getByText('PROCESSING...');
        expect(finishButton).toBeDisabled();
    });

    it('should render the correct number of checkpoints', () => {
        const { container } = render(<HUDControls {...defaultProps} />);
        // Checkpoints are divs inside the hidden md:flex container
        const checkpoints = container.querySelectorAll('.md\\:flex div.w-1\\.5');
        // Total should be 5, but one is active (w-4)
        const activeCheckpoint = container.querySelector('.md\\:flex div.w-4');
        expect(checkpoints.length + (activeCheckpoint ? 1 : 0)).toBe(5);
    });
});
