/**
 * Keyset (cursor-based) pagination utilities.
 * Replaces OFFSET pagination which degrades at scale.
 */

export interface PageCursor {
  lastId: string;
  lastSortValue: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Encodes a keyset cursor to a base64url string.
 */
export function encodePageCursor(lastId: string, lastSortValue: string): string {
  const cursor: PageCursor = { lastId, lastSortValue };
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/**
 * Decodes a base64url keyset cursor.
 */
export function decodePageCursor(cursor: string): PageCursor {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
  } catch {
    throw new Error('Invalid pagination cursor');
  }
}

/**
 * Builds a standardized paginated response.
 * @param items The items fetched (should be limit + 1)
 * @param limit The requested page size
 * @param getSortValue Function to extract the sort value (e.g., createdAt.toISOString())
 */
export function buildPaginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number,
  getSortValue: (item: T) => string,
  total?: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  
  return {
    data,
    nextCursor: hasMore && lastItem !== undefined ? encodePageCursor(lastItem.id, getSortValue(lastItem)) : null,
    hasMore,
    total
  };
}
