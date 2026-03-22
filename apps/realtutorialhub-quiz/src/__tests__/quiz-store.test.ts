import { describe, it, expect, beforeEach } from 'vitest';
import { useQuizStore } from '../store/quiz-store';

describe('QuizStore (Task 55 Refactoring)', () => {
  beforeEach(() => {
    // Manually reset state because we use persist/create and want clean tests
    useQuizStore.setState({
      isActive: false,
      isSubmitted: false,
      questions: [],
      answers: {},
      markedForReview: [],
      timeLeft: 0,
      currentQuestionIndex: 0,
      config: null,
      examId: null
    });
  });

  it('should start a quiz with startQuiz (backward compatibility)', () => {
    const questions: Array<{ id: string; type: string; text: string; options: string[]; difficulty: string }> = [
      { id: '1', type: 'MCQ', text: 'Q1', options: ['A', 'B'], difficulty: 'Simple' },
    ];
    const config = { domain: 'tech', subjects: [], difficulty: 'mixed' };
    const duration = 600;

    useQuizStore.getState().startQuiz(questions, config, duration);

    const state = useQuizStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.questions).toHaveLength(1);
    expect(state.config).toEqual(config);
    expect(state.timeLeft).toBe(600);
    expect(state.answers).toEqual({});
  });

  it('should update answers correctly', () => {
    useQuizStore.getState().setAnswer('q1', 1);
    expect(useQuizStore.getState().answers['q1']).toBe(1);
    
    useQuizStore.getState().setAnswer('q1', 0);
    expect(useQuizStore.getState().answers['q1']).toBe(0);
  });

  it('should toggle review status', () => {
    useQuizStore.getState().toggleReview('q1');
    expect(useQuizStore.getState().markedForReview).toContain('q1');
    
    useQuizStore.getState().toggleReview('q1');
    expect(useQuizStore.getState().markedForReview).not.toContain('q1');
  });

  it('should update timer', () => {
    useQuizStore.getState().setTimeRemaining(100);
    useQuizStore.getState().updateTimer();
    expect(useQuizStore.getState().timeLeft).toBe(99);
  });

  it('should handle finish quiz', () => {
    useQuizStore.getState().finishQuiz();
    expect(useQuizStore.getState().isActive).toBe(false);
    expect(useQuizStore.getState().isSubmitted).toBe(true);
  });

  it('should maintain state indices', () => {
    useQuizStore.getState().setCurrentIndex(5);
    expect(useQuizStore.getState().currentQuestionIndex).toBe(5);
  });
});
