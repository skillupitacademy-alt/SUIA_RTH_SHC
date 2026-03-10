import { describe, it, expect } from 'vitest';
import { applyCacheHeaders, CACHE_STRATEGIES } from '../cache-headers';

describe('Lib: Cache Headers (Task 102)', () => {
  it('should apply correct headers for IMMUTABLE strategy', () => {
    const headers = new Headers();
    applyCacheHeaders(headers, 'IMMUTABLE');
    
    expect(headers.get('Cache-Control')).toContain('public');
    expect(headers.get('Cache-Control')).toContain('max-age=31536000');
    expect(headers.get('Cache-Control')).toContain('immutable');
  });

  it('should apply correct headers for SESSION strategy', () => {
    const headers = new Headers();
    applyCacheHeaders(headers, 'SESSION');
    
    expect(headers.get('Cache-Control')).toContain('private');
    expect(headers.get('Cache-Control')).toContain('no-cache');
  });

  it('should apply correct headers for DYNAMIC strategy', () => {
    const headers = new Headers();
    applyCacheHeaders(headers, 'DYNAMIC');
    
    expect(headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate');
    expect(headers.get('Pragma')).toBe('no-cache');
    expect(headers.get('Expires')).toBe('0');
  });
});
