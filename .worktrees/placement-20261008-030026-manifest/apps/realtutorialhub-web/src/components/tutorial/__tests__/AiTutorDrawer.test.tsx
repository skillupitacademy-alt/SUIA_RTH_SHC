import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiTutorDrawer } from '../AiTutorDrawer';
import { getDomainTheme } from '@/lib/domain-themes';

const theme = getDomainTheme('full-stack');

function createResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AiTutorDrawer', () => {
  it('opens the drawer and submits a question using tutorial notes', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createResponse({
        source: 'qa_pairs',
        answer: 'Promises let JavaScript handle future results without blocking the rest of the app.',
        chunks: null,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AiTutorDrawer
        subtopicId="11111111-1111-1111-1111-111111111111"
        subtopicName="Promises"
        theme={theme}
        greeting="Let us review how promises work in JavaScript."
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));
    const textarea = screen.getByPlaceholderText('Ask a question about Promises...');
    fireEvent.change(textarea, { target: { value: 'What problem do promises solve?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/ai-tutor/query', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        subtopicId: '11111111-1111-1111-1111-111111111111',
        question: 'What problem do promises solve?',
        difficulty: 'simple',
      }),
    }));
    expect(await screen.findByText(/Promises let JavaScript handle future results/)).toBeDefined();
  });
});
