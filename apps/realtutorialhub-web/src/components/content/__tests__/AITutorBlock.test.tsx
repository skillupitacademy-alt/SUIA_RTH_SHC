import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AITutorBlock } from '../AITutorBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');
const subtopicId = '11111111-1111-1111-1111-111111111111';

function createResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AITutorBlock', () => {
  it('renders qa_pairs, has an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(
      <AITutorBlock data={mockTutorialContent.ai_tutor} theme={theme} subtopicId={subtopicId} subtopicName="Promises" />
    );

    expect(screen.getByLabelText('AI tutor block')).toBeDefined();
    expect(screen.getByText('Let us review how promises work in JavaScript.')).toBeDefined();
    expect(screen.getByText('Q: What problem do promises solve?')).toBeDefined();
    expect(screen.getByText('Promises let JavaScript handle future results without blocking the rest of the app.')).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', async () => {
    const { rerender } = renderWithIntl(
      <AITutorBlock data={null} theme={theme} subtopicId={subtopicId} subtopicName="Promises" />
    );

    expect(screen.getByLabelText('AI tutor block')).toBeDefined();

    rerender(
      <AITutorBlock
        data={{ greeting: '', qa_pairs: [] }}
        theme={theme}
        subtopicId={subtopicId}
        subtopicName="Promises"
      />
    );

    expect(screen.getByPlaceholderText('Ask a question about Promises...')).toBeDefined();
  });

  it('submits a question and renders vector chunks', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createResponse({
        source: 'vector_search',
        answer: null,
        chunks: [
          { blockType: 'notes', content: 'Chunk one' },
          { blockType: 'technical', content: 'Chunk two' },
        ],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    renderWithIntl(
      <AITutorBlock data={mockTutorialContent.ai_tutor} theme={theme} subtopicId={subtopicId} subtopicName="Promises" />
    );

    const input = screen.getByPlaceholderText('Ask a question about Promises...');
    fireEvent.change(input, { target: { value: 'How do promises chain?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/ai-tutor/query', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ subtopicId, question: 'How do promises chain?', difficulty: 'simple' }),
    }));
    expect(await screen.findByText('Relevant study blocks are listed below.')).toBeDefined();
    expect(screen.getByText('notes')).toBeDefined();
    expect(screen.getByText('technical')).toBeDefined();
  });

  it('shows the rate-limit message and disables the input after 429', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(createResponse({ error: 'Rate limit exceeded' }, 429));
    vi.stubGlobal('fetch', fetchMock);

    renderWithIntl(
      <AITutorBlock data={mockTutorialContent.ai_tutor} theme={theme} subtopicId={subtopicId} subtopicName="Promises" />
    );

    const input = screen.getByPlaceholderText('Ask a question about Promises...');
    fireEvent.change(input, { target: { value: 'How do promises chain?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect(await screen.findByText('You have used 10 questions this hour. Upgrade for unlimited AI Tutor access.')).toBeDefined();
    expect(screen.getByPlaceholderText('Ask a question about Promises...')).toBeDisabled();
  });

  it('shows a network error and keeps the input enabled', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network failure'));
    vi.stubGlobal('fetch', fetchMock);

    renderWithIntl(
      <AITutorBlock data={mockTutorialContent.ai_tutor} theme={theme} subtopicId={subtopicId} subtopicName="Promises" />
    );

    const input = screen.getByPlaceholderText('Ask a question about Promises...');
    fireEvent.change(input, { target: { value: 'How do promises chain?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to connect. Try again.');
    expect(screen.getByPlaceholderText('Ask a question about Promises...')).not.toBeDisabled();
  });
});
