import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionView } from '../QuestionView';

describe('QuestionView', () => {
    const defaultProps = {
        question: {
            questionId: 'q1',
            text: 'What is the capital of France?',
            options: ['Paris', 'London', 'Berlin', 'Madrid'],
            codeSnippet: 'const x = 10;'
        },
        currentIndex: 0,
        answer: undefined,
        isFlagged: false,
        onSelectOption: vi.fn(),
        onToggleFlag: vi.fn(),
        theme: {
            colors: {
                questionCard: 'bg-white',
                questionCardBorder: 'border-gray-200',
                answerSelected: 'bg-pink-50',
                answerSelectedBorder: 'border-pink-500',
                answerUnselected: 'bg-white',
                answerUnselectedBorder: 'border-gray-200',
                answerSelectedText: 'text-pink-900',
                answerUnselectedText: 'text-gray-900',
            },
            spacing: {
                questionCardPadding: 'p-8',
                answerOptionPadding: 'p-4',
                answerMinHeight: 'min-h-[80px]',
            },
            effects: {
                questionCardRadius: 'rounded-3xl',
                buttonRadius: 'rounded-xl',
                answerRadius: 'rounded-2xl',
                selectedShadow: 'shadow-md',
            },
            typography: {
                answerTextSize: 'text-base',
            }
        }
    };

    it('should render the question text and code snippet', () => {
        render(<QuestionView {...defaultProps} />);
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
        expect(screen.getByText('const x = 10;')).toBeInTheDocument();
    });

    it('should render all options', () => {
        render(<QuestionView {...defaultProps} />);
        expect(screen.getByText('Paris')).toBeInTheDocument();
        expect(screen.getByText('London')).toBeInTheDocument();
        expect(screen.getByText('Berlin')).toBeInTheDocument();
        expect(screen.getByText('Madrid')).toBeInTheDocument();
    });

    it('should call onSelectOption when an option is clicked', () => {
        render(<QuestionView {...defaultProps} />);
        fireEvent.click(screen.getByText('Paris'));
        expect(defaultProps.onSelectOption).toHaveBeenCalledWith('q1', 'Paris');
    });

    it('should show selected state for the chosen answer', () => {
        render(<QuestionView {...defaultProps} answer="Paris" />);
        const selectedButton = screen.getByText('Paris').closest('button');
        expect(selectedButton).toHaveClass('bg-pink-50');
    });

    it('should call onToggleFlag when flag button is clicked', () => {
        render(<QuestionView {...defaultProps} />);
        fireEvent.click(screen.getByText('Flag for Review'));
        expect(defaultProps.onToggleFlag).toHaveBeenCalledWith('q1');
    });

    it('should show flag active state when isFlagged is true', () => {
        render(<QuestionView {...defaultProps} isFlagged={true} />);
        expect(screen.getByText('Review Flag Set')).toBeInTheDocument();
    });
});
