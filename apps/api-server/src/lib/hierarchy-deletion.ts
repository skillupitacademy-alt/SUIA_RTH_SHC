import { withHierarchyDeletionLocks as coordinateDeletion } from '@quiz/db-tutorial';

import { ApiError } from './api-error';

/** Translate shared hierarchy outcomes into the existing backend HTTP taxonomy. */
export const withHierarchyDeletionLocks: typeof coordinateDeletion = async (...arguments_) => {
  try {
    return await coordinateDeletion(...arguments_);
  } catch (error) {
    if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
      throw new ApiError(error.status, error.message);
    }
    throw new ApiError(503, 'Hierarchy coordination unavailable');
  }
};
