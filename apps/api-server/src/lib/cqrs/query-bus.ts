import { logger } from '@/lib/logger';

export interface Query {
  type: string;
}

export interface QueryHandler<T extends Query = Query, R = unknown> {
  handle(query: T): Promise<R>;
}

/**
 * Query Bus for handling read operations (Q in CQRS).
 * Uses the read replica database (dbReadOnly).
 */
export class QueryBus {
  private handlers = new Map<string, QueryHandler<Query, unknown>>();
  private static instance: QueryBus | undefined;

  private constructor() {}

  public static getInstance(): QueryBus {
    if (QueryBus.instance === undefined) {
      QueryBus.instance = new QueryBus();
    }
    return QueryBus.instance;
  }

  register(type: string, handler: QueryHandler) {
    this.handlers.set(type, handler);
  }

  async dispatch<T extends Query, R = unknown>(query: T): Promise<R> {
    const handler = this.handlers.get(query.type) as QueryHandler<T, R> | undefined;
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.type}`);
    }

    logger.debug({ type: query.type }, '[QueryBus] Dispatching query');
    try {
      // Handlers will use dbReadOnly internally
      return await handler.handle(query);
    } catch (error) {
      logger.error({ error, type: query.type }, '[QueryBus] Query failed');
      throw error;
    }
  }
}

export const queryBus = QueryBus.getInstance();
