import { REPORT_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db';

import { db } from '../db';
import type { TutorialDbClientLike } from '@quiz/types';

export abstract class TutorialRepositoryBase {
  constructor(protected dbInstance: typeof db = db) {}

  abstract withDb(dbClient: TutorialDbClientLike): this;

  protected runRead<T>(queryPromise: Promise<T>, description: string): Promise<T> {
    return withTimeout(queryPromise, STANDARD_QUERY_TIMEOUT, description);
  }

  protected runReport<T>(queryPromise: Promise<T>, description: string): Promise<T> {
    return withTimeout(queryPromise, REPORT_QUERY_TIMEOUT, description);
  }
}
