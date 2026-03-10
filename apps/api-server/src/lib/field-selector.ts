/**
 * Field Selection Utility for Phase 3 Scale Preparation.
 * Filters objects to only include requested fields, while respecting allowlists for security.
 */

export type FieldAllowlist = string[];

/**
 * Filters an object or array of objects to only include the specified fields.
 * Always excludes sensitive fields like password, tokens, etc.
 */
export function selectFields(
  data: Record<string, unknown> | Record<string, unknown>[],
  fieldsParam: string | null | undefined,
  allowlist: FieldAllowlist
): Record<string, unknown> | Array<Record<string, unknown>> {
  if (data === null || data === undefined) return data;
  
  // Default fields to allowlist if not provided
  const hasFieldsParam = typeof fieldsParam === 'string' && fieldsParam.trim() !== '';
  const requestedFields = hasFieldsParam
    ? fieldsParam.split(',').map(f => f.trim()).filter(f => allowlist.includes(f))
    : allowlist;

  // Always block known sensitive fields even if in allowlist
  const BLOCKED_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'key'];
  const finalFields = requestedFields.filter(f => !BLOCKED_FIELDS.some(b => f.toLowerCase().includes(b)));

  const filterItem = (item: Record<string, unknown>): Record<string, unknown> => {
    const filtered: Record<string, unknown> = {};
    for (const field of finalFields) {
      if (Object.prototype.hasOwnProperty.call(item, field)) {
        filtered[field] = item[field];
      }
    }
    return filtered;
  };

  if (Array.isArray(data)) {
    return data.map(filterItem);
  }

  return filterItem(data);
}

/**
 * Extracts fields from a URL query string for use in Drizzle SELECT.
 * Maps CSV field string to actual Drizzle column references.
 */
export function getDrizzleFields(
  fieldsParam: string | null | undefined,
  allowlist: FieldAllowlist,
  schemaTable: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (fieldsParam === null || fieldsParam === undefined || fieldsParam.trim() === '') return undefined;

  const requestedFields = fieldsParam.split(',').map(f => f.trim()).filter(f => allowlist.includes(f));
  
  if (requestedFields.length === 0) return undefined;

  // Always block known sensitive fields even if mistakenly in allowlist
  const BLOCKED_FIELDS = ['password', 'passwordhash', 'token', 'secret', 'key'];
  const finalFields = requestedFields.filter(f => !BLOCKED_FIELDS.some(b => f.toLowerCase().includes(b)));

  if (finalFields.length === 0) return undefined;

  const fields: Record<string, unknown> = {};
  for (const field of finalFields) {
    if (field in schemaTable) {
      fields[field] = schemaTable[field];
    }
  }
  
  return Object.keys(fields).length > 0 ? fields : undefined;
}
