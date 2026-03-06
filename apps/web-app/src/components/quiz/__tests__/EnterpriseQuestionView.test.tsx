import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnterpriseQuestionView } from '../EnterpriseQuestionView';

describe('EnterpriseQuestionView', () => {
    const defaultProps = {
        question: {
            id: 'q1',
            text: 'Analyze the following code snippet',
            type: 'CODE_MCQ',
            code: 'function test() { return true; }',
            options: ['Option A', 'Option B', 'Option C'],
            difficulty: 'Intermediate'
        },
        currentQuestionIndex: 0,
        totalQuestions: 10,
        answerIndex: undefined,
        onAnswer: vi.fn(),
    };

    it('should render question progress and difficulty', () => {
        render(<EnterpriseQuestionView {...defaultProps} />);
        expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('should render the question text and code snippet', () => {
        render(<EnterpriseQuestionView {...defaultProps} />);
        expect(screen.getByText('Analyze the following code snippet')).toBeInTheDocument();
        expect(screen.getByText('function test() { return true; }')).toBeInTheDocument();
        expect(screen.getByText('TypeScript Snippet')).toBeInTheDocument();
    });

    it('should render all options with correct labels (A, B, C)', () => {
        render(<EnterpriseQuestionView {...defaultProps} />);
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should call onAnswer when an option is clicked', () => {
        render(<EnterpriseQuestionView {...defaultProps} />);
        fireEvent.click(screen.getByText('Option B'));
        expect(defaultProps.onAnswer).toHaveBeenCalledWith(1);
    });

    it('should show selected state (ARIA and icon) for the chosen answer', () => {
        render(<EnterpriseQuestionView {...defaultProps} answerIndex={0} />);
        const firstOption = screen.getByLabelText('Select option A: Option A');
        expect(firstOption).toHaveAttribute('aria-pressed', 'true');
        expect(firstOption).toHaveClass('border-primary');
    });

    it('should not render code snippet if not CODE_MCQ', () => {
        const mcqProps = {
            ...defaultProps,
            question: { ...defaultProps.question, type: 'MCQ', code: '' }
        };
        render(<EnterpriseQuestionView {...mcqProps} />);
        expect(screen.queryByText('TypeScript Snippet')).not.toBeInTheDocument();
    });
});
