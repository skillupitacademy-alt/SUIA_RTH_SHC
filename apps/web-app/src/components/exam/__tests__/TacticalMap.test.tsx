import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TacticalMap } from '../TacticalMap';

describe('TacticalMap', () => {
    const defaultProps = {
        questions: [
            { questionId: 'q1' },
            { questionId: 'q2' },
            { questionId: 'q3' },
        ],
        currentIndex: 0,
        answers: { q2: 'A' },
        flags: { q3: true },
        onGoToQuestion: vi.fn(),
        theme: {
            colors: {
                questionCard: 'bg-white',
                questionCardBorder: 'border-gray-200',
                tacticalChipCurrent: 'bg-pink-500',
                tacticalChipFlagged: 'bg-orange-500',
                tacticalChipAnswered: 'bg-green-500',
                tacticalChipUnvisited: 'bg-gray-100',
            },
            spacing: { tacticalChipSize: 'w-10' },
            effects: { chipRadius: 'rounded' }
        }
    };

    it('should render the correct number of question chips', () => {
        render(<TacticalMap {...defaultProps} />);
        const chips = screen.getAllByRole('button');
        expect(chips).toHaveLength(3);
    });

    it('should display the correct completion metrics', () => {
        render(<TacticalMap {...defaultProps} />);
        expect(screen.getByText('1/3 COMPLETE')).toBeInTheDocument();
        expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should call onGoToQuestion when a chip is clicked', () => {
        render(<TacticalMap {...defaultProps} />);
        const secondChip = screen.getByText('02');
        fireEvent.click(secondChip);
        expect(defaultProps.onGoToQuestion).toHaveBeenCalledWith(1);
    });

    it('should render a flag icon on flagged questions', () => {
        render(<TacticalMap {...defaultProps} />);
        // Find the chip for q3 (index 2, text "03")
        const thirdChip = screen.getByText('03').closest('button');
        const flagIcon = thirdChip?.querySelector('svg');
        expect(flagIcon).toBeInTheDocument();
    });
});
