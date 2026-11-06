/**
 * Normalizes email address for storage and lookup.
 * - Converts to lowercase (emails are case-insensitive per RFC 5321)
 * - Trims leading/trailing whitespace
 * - Does NOT perform Unicode normalization (emails must be ASCII)
 * 
 * @param email Raw email address
 * @returns Normalized email address
 * @throws {Error} If email is invalid
 */
export function normalizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  const normalized = email.trim().toLowerCase();
  
  if (normalized === '') {
    throw new Error('Email cannot be empty');
  }
  
  // Basic RFC 5322 validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new Error('Invalid email format');
  }
  
  if (normalized.length > 254) {
    throw new Error('Email exceeds maximum length');
  }
  
  return normalized;
}

/**
 * Validates and normalizes email address.
 * Use this at API boundaries before storing or querying.
 * 
 * @param email Raw email input
 * @returns Normalized email or null if invalid
 */
export function safeNormalizeEmail(email: unknown): string | null {
  try {
    if (typeof email !== 'string') return null;
    return normalizeEmail(email);
  } catch {
    return null;
  }
}
