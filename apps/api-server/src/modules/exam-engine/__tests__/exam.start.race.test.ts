import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { ExamEngine } from '@/modules/exam-engine/exam.engine'

describe('ExamEngine start race branch', () => {
  it('recovers via race-condition handler when unique constraint hits', async () => {
    const startedAt = new Date(Date.now() - 20_000)
    ;(db.query as any).idempotencyKeys = { findFirst: vi.fn().mockResolvedValue({ examId: 'e1', userId: 'u1', key: 'dup' }) }
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue({
      id: 'e1',
      status: 'started',
      durationSeconds: 600,
      startedAt,
      examQuestions: [{ order: 1, question: { id: 'q1', questionText: 'Q', options: [], codeSnippet: null, type: 'mcq' } }]
    }) }
    ;(db as any).transaction = vi.fn().mockImplementation(async () => {
      const err: any = { code: '23505', message: 'unq_user_key' }
      throw err
    })

    const res = await ExamEngine.startExam('u1', 'bp1', 'dup')
    expect(res.examId).toBe('e1')
  })
})
