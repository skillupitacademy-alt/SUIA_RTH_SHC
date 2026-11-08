import { afterEach, expect, it, vi } from 'vitest';
const publish = vi.hoisted(() => vi.fn());
vi.mock('@quiz/events', () => ({ publishEvent: publish }));
vi.mock('@quiz/db-tutorial', () => ({ db: {}, AssignmentRepository: class {}, TutorialProgressRepository: class {} }));
import { AssignmentService } from '../assignment.service';
afterEach(() => { publish.mockReset(); });
it('returns persisted fixture when event publication rejects', async () => {
  publish.mockRejectedValue(new Error('offline'));
  const repository = { getAssignments: vi.fn(async () => [{ id: 'assignment' }]), createHelpRequest: vi.fn(async (input) => ({ id: 'help', ...input })) };
  const service = new AssignmentService({ assignmentRepository: repository as never, progressRepository: {} as never });
  await expect(service.submitHelpRequest('user', 'topic', 'assignment', 'Question')).resolves.toMatchObject({ id: 'help', status: 'open' });
  expect(repository.createHelpRequest).toHaveBeenCalledOnce();
  expect(publish).toHaveBeenCalledWith('assignment.help_requested', expect.objectContaining({ userId: 'user', assignmentId: 'assignment' }), expect.any(Object));
});
it('rejects a nonmember assignment before write or publish', async () => {
  const repository = { getAssignments: vi.fn(async () => [{ id: 'other' }]), createHelpRequest: vi.fn() };
  const service = new AssignmentService({ assignmentRepository: repository as never, progressRepository: {} as never });
  await expect(service.submitHelpRequest('user', 'topic', 'assignment', 'Question')).rejects.toThrow('does not belong');
  expect(repository.createHelpRequest).not.toHaveBeenCalled(); expect(publish).not.toHaveBeenCalled();
});
