import { vi } from 'vitest';

export type SelectResolveOn = 'where' | 'limit' | 'orderBy';

type SelectQueueEntry = {
  result: unknown;
  resolveOn: SelectResolveOn;
};

export const makeSelectBuilder = (result: unknown, resolveOn: SelectResolveOn) => {
  const builder: Record<string, unknown> = {};

  const maybeResolve = () => Promise.resolve(result);

  builder.from = vi.fn().mockReturnValue(builder);
  builder.leftJoin = vi.fn().mockReturnValue(builder);
  builder.innerJoin = vi.fn().mockReturnValue(builder);
  builder.groupBy = vi.fn().mockReturnValue(builder);
  builder.where = vi.fn().mockImplementation(() => (resolveOn === 'where' ? maybeResolve() : builder));
  builder.limit = vi.fn().mockImplementation(() => (resolveOn === 'limit' ? maybeResolve() : builder));
  builder.orderBy = vi.fn().mockImplementation(() => (resolveOn === 'orderBy' ? maybeResolve() : builder));

  return builder;
};

export const installSelectMock = (db: Record<string, unknown>, queue: SelectQueueEntry[]) => {
  const selectMock = vi.fn();

  for (const entry of queue) {
    selectMock.mockImplementationOnce(() => makeSelectBuilder(entry.result, entry.resolveOn));
  }

  selectMock.mockImplementation(() => makeSelectBuilder([], 'where'));

  db.select = selectMock;

  return selectMock;
};
