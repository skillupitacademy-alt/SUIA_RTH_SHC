import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ bulkCreateQuestions: vi.fn() }));
vi.mock('@quiz/api-client', () => ({ apiClient: { admin: api } }));
vi.mock('@quiz/ui', () => ({ ZLoader: () => null }));
vi.mock('@/utils/clientLogger', () => ({ clientLogger: { error: vi.fn() } }));

import { BulkUploadPanel } from '../BulkUploadPanel';
import { bulkQuestionSchema } from '../../../../../api-server/src/schemas/admin.schemas';

beforeEach(() => { 
  api.bulkCreateQuestions.mockResolvedValue({}); 
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); 
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

const validQuestion = { 
  options: [{ text: 'Alpha', isCorrect: true }, { text: 'Beta', isCorrect: false }], 
  explanation: 'Valid explanation text', 
  type: 'mcq' 
};

async function selectFile(value: unknown) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { 
    target: { 
      files: [new File([JSON.stringify(value)], 'questions.json', { type: 'application/json' })] 
    } 
  });
}

describe('FND20 SHC client → API → schema round-trip', () => {
  it('rejects bulk upload with invalid question type before API dispatch', async () => {
    const onError = vi.fn();
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={onError} />);
    
    await selectFile([{ ...validQuestion, questionText: 'Q', type: 'invalid_type' }]);
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(api.bulkCreateQuestions).not.toHaveBeenCalled();
  });

  it('rejects bulk upload with empty options before API dispatch', async () => {
    const onError = vi.fn();
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={onError} />);
    
    await selectFile([{ questionText: 'Q?', type: 'mcq', options: [], explanation: 'Exp' }]);
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(api.bulkCreateQuestions).not.toHaveBeenCalled();
  });

  it('rejects bulk upload with missing questionText before API dispatch', async () => {
    const onError = vi.fn();
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={onError} />);
    
    await selectFile([{ type: 'mcq', options: ['A', 'B'], explanation: 'Exp' }]);
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(api.bulkCreateQuestions).not.toHaveBeenCalled();
  });

  it('rejects bulk upload with missing explanation before API dispatch', async () => {
    const onError = vi.fn();
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={onError} />);
    
    await selectFile([{ questionText: 'Q?', type: 'mcq', options: ['A', 'B'] }]);
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(api.bulkCreateQuestions).not.toHaveBeenCalled();
  });

  it('invokes API when valid questions pass client validation', async () => {
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={vi.fn()} />);
    
    await selectFile([{ 
      text: 'Valid question', 
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
      explanation: 'Valid explanation'
    }]);
    
    await screen.findByText('Valid question');
    fireEvent.click(screen.getByRole('button', { name: /Finalize & Upload All/i }));
    
    await waitFor(() => expect(api.bulkCreateQuestions).toHaveBeenCalledTimes(1));
    expect(api.bulkCreateQuestions).toHaveBeenCalledWith(expect.objectContaining({
      topicId: 'topic'
    }));
  });

  it('propagates subtopicId to API when provided', async () => {
    const subtopicId = '22222222-2222-4222-8222-222222222222';
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={subtopicId} skillIds={[]} onSuccess={vi.fn()} onError={vi.fn()} />);
    
    await selectFile([{ 
      text: 'Question with subtopic', 
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
      explanation: 'Explanation'
    }]);
    
    await screen.findByText('Question with subtopic');
    fireEvent.click(screen.getByRole('button', { name: /Finalize & Upload All/i }));
    
    await waitFor(() => expect(api.bulkCreateQuestions).toHaveBeenCalledTimes(1));
    const payload = api.bulkCreateQuestions.mock.calls[0][0];
    expect(payload.subtopicId).toBe(subtopicId);
  });

  it('propagates skillIds to API when provided', async () => {
    const skillIds = ['33333333-3333-4333-8333-333333333333'];
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={skillIds} onSuccess={vi.fn()} onError={vi.fn()} />);
    
    await selectFile([{ 
      text: 'Question with skills', 
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
      explanation: 'Explanation'
    }]);
    
    await screen.findByText('Question with skills');
    fireEvent.click(screen.getByRole('button', { name: /Finalize & Upload All/i }));
    
    await waitFor(() => expect(api.bulkCreateQuestions).toHaveBeenCalledTimes(1));
    const payload = api.bulkCreateQuestions.mock.calls[0][0];
    expect(payload.skillIds).toEqual(skillIds);
  });

  it('supports code_mcq question type through client validation', async () => {
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={vi.fn()} />);
    
    await selectFile([{ 
      text: 'Code question', 
      type: 'code_mcq',
      options: [{ text: 'Option A', isCorrect: true }, { text: 'Option B', isCorrect: false }],
      explanation: 'Explanation'
    }]);
    
    await screen.findByText('Code question');
    fireEvent.click(screen.getByRole('button', { name: /Finalize & Upload All/i }));
    
    await waitFor(() => expect(api.bulkCreateQuestions).toHaveBeenCalledTimes(1));
  });

  it('rejects multi_select at client validation (SHC UI constraint)', async () => {
    const onError = vi.fn();
    render(<BulkUploadPanel topicId="topic" topicName="Topic" subtopicId={null} skillIds={[]} onSuccess={vi.fn()} onError={onError} />);
    
    await selectFile([{ 
      text: 'Multi-select question', 
      type: 'multi_select',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }],
      explanation: 'Explanation'
    }]);
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(api.bulkCreateQuestions).not.toHaveBeenCalled();
  });
});
