import { expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ create: vi.fn(async (value) => ({ id: 'q', ...value })), transaction: vi.fn(async (cb) => cb({})) }));
vi.mock('@quiz/db', () => ({ db: { transaction: f.transaction } }));
vi.mock('@/modules/core/container', () => ({ container: { get: vi.fn() } }));
vi.mock('@/modules/auth/audit.service', () => ({ AuditService: class {} }));
vi.mock('@/modules/question/duplicate-detector', () => ({ DuplicateDetector: { evaluate: vi.fn(async () => ({ status: 'new', signals: {} })) } }));
vi.mock('@/modules/admin-engine/core/queue.service', () => ({ queueService: { enqueue: vi.fn(async () => ({})) } }));
import { questionSchema } from '@/schemas/admin.schemas';
import { AdminQuestionEngine } from '../admin.question.engine';
const base = { topicId: '11111111-1111-4111-8111-111111111111', questionText: 'Question', options: ['A', 'B'] };
it('shows current answerless schema and engine behavior without certifying scoring', async () => {
  const input = questionSchema.parse(base);
  const engine = new AdminQuestionEngine({ create: f.create } as never, { log: vi.fn() } as never);
  await engine.createQuestion(input, 'admin');
  expect(f.create.mock.calls[0][0]).toMatchObject({ correctAnswer: 'No correct answer provided' });
});

it('retains flagged correct options when no explicit answer is supplied', async () => {
  const input = questionSchema.parse({ ...base, options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] });
  const engine = new AdminQuestionEngine({ create: f.create } as never, { log: vi.fn() } as never);
  await engine.createQuestion(input, 'admin');
  expect(f.create.mock.calls.at(-1)![0].options).toEqual(expect.arrayContaining([expect.objectContaining({ text: 'A', isCorrect: true })]));
});
