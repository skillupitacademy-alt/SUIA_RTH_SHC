
/**
 * Security: Input Sanitization Utility (Task 43)
 * Provides methods to strip HTML and protect JSONB fields.
 */

export const MAX_JSON_DEPTH = 5;
export const MAX_JSON_SIZE_BYTES = 1_000_000; // 1MB
export const MAX_STRING_LENGTH = 10_000;

/**
 * Strips all HTML tags from a string using regex.
 * For more complex needs, consider 'sanitize-html' or 'isomorphic-dompurify'.
 */
export function stripHtml(input: string): string {
    if (typeof input !== 'string') return input;
    // Basic regex to strip HTML tags
    return input.replace(/<[^>]*>?/gm, '');
}

/**
 * Enforces a maximum string length to avoid oversized payload fragments.
 */
export function clampString(input: string, maxLength: number = MAX_STRING_LENGTH): string {
    if (typeof input !== 'string') return input as unknown as string;
    return input.length > maxLength ? input.slice(0, maxLength) : input;
}

/**
 * Validates JSON depth to prevent "JSON bomb" attacks.
 */
export function validateJsonDepth(obj: unknown, maxDepth: number = MAX_JSON_DEPTH, currentDepth: number = 0): boolean {
    if (currentDepth > maxDepth) return false;
    
    if (obj !== null && typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return obj.every(item => validateJsonDepth(item, maxDepth, currentDepth + 1));
        } else {
            return Object.values(obj).every(value => validateJsonDepth(value, maxDepth, currentDepth + 1));
        }
    }
    
    return true;
}

/**
 * Validates serialized size to prevent large payload ingestion.
 */
export function validateJsonSize(obj: unknown, maxBytes: number = MAX_JSON_SIZE_BYTES): boolean {
    try {
        const size = Buffer.byteLength(JSON.stringify(obj ?? ''), 'utf8');
        return size <= maxBytes;
    } catch {
        return false;
    }
}

/**
 * Recursively walks an object or array and sanitizes all string values.
 * Prevents XSS in JSONB columns and clamps large strings.
 */
export function sanitizeJsonField<T>(data: T, currentDepth: number = 0): T {
    if (currentDepth > MAX_JSON_DEPTH) {
        return undefined as unknown as T;
    }

    if (typeof data === 'string') {
        const stripped = stripHtml(data);
        return clampString(stripped) as unknown as T;
    }

    if (Array.isArray(data)) {
        return data.map((item) => sanitizeJsonField(item, currentDepth + 1)) as unknown as T;
    }

    if (data !== null && typeof data === 'object') {
        const sanitizedObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            sanitizedObj[key] = sanitizeJsonField(value, currentDepth + 1);
        }
        return sanitizedObj as T;
    }

    return data;
}
