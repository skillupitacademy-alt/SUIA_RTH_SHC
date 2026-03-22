import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AITutorBlock } from '../AITutorBlock';
import React from 'react';

describe('AITutorBlock', () => {
  type AITutorTheme = Parameters<typeof AITutorBlock>[0]['theme'];

  const mockData = {
    greeting: 'Hello! I am your AI tutor.',
    qa_pairs: [
      { question: 'What is React?', answer: 'React is a UI library.' },
      { question: 'What is Next.js?', answer: 'Next.js is a React framework.' }
    ],
  };

  const mockTheme = {
    blockAITutor: '#111',
    blockAITutorHeader: '#222',
  } satisfies AITutorTheme;

  it('renders correctly with given QA pairs and greeting', () => {
    render(<AITutorBlock data={mockData} theme={mockTheme} />);

    // Check Header and Greeting
    expect(screen.getByText('AI Tutor')).toBeDefined();
    expect(screen.getByText('Hello! I am your AI tutor.')).toBeDefined();

    // Check QA pairs
    expect(screen.getByText('Q: What is React?')).toBeDefined();
    expect(screen.getByText('React is a UI library.')).toBeDefined();
    expect(screen.getByText('Q: What is Next.js?')).toBeDefined();
    expect(screen.getByText('Next.js is a React framework.')).toBeDefined();
  });

  it('updates text area value when typed into', () => {
    render(<AITutorBlock data={mockData} theme={mockTheme} />);

    const textarea = screen.getByPlaceholderText('Type your question here') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');

    fireEvent.change(textarea, { target: { value: 'How does state work?' } });
    expect(textarea.value).toBe('How does state work?');
  });

  it('renders a disabled submit button', () => {
    render(<AITutorBlock data={mockData} theme={mockTheme} />);

    const button = screen.getByText('Send question') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
