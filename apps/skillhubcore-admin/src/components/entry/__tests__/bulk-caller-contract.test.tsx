import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ bulkCreateQuestions: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: api } }));
vi.mock('@quiz/ui', () => ({ ZLoader: () => null }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));
import { BulkUploadPanel } from '../BulkUploadPanel';
beforeEach(() => { api.bulkCreateQuestions.mockResolvedValue({}); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
const valid = { options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }], explanation: 'Explanation', type: 'mcq' };
async function selectFile(value: unknown) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File([JSON.stringify(value)], 'questions.json', { type: 'application/json' })] } });
}
it.each(['text', 'questionText'])('normalizes supported %s to the API questionText', async (key) => {
  render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={vi.fn()} />);
  await selectFile([{ ...valid, [key]: 'Question' }]);
  await screen.findByText('Question');
  fireEvent.click(screen.getByRole('button', { name: /Finalize & Upload All/i }));
  await waitFor(() => expect(api.bulkCreateQuestions).toHaveBeenCalledWith(expect.objectContaining({ questions: [expect.objectContaining({ questionText: 'Question' })] })));
});
it('does not dispatch invalid input', async () => {
  const onError = vi.fn();
  render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={onError} />);
  await selectFile([{ ...valid, text: '' }]);
  await waitFor(() => expect(onError).toHaveBeenCalled());
  expect(api.bulkCreateQuestions).not.toHaveBeenCalled();
});

