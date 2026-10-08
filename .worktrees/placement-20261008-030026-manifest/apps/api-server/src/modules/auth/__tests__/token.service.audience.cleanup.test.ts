import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';
import type { NextRequest } from 'next/server';

describe('TokenService Audience Cleanup', () => {
  beforeEach(() => {
    container.reset();
  });

  it('getAccessToken: skips empty strings in scoped cookies', () => {
    const service = container.get(TokenService);
    const mockReq = { 
        cookies: { get: (name: string) => {
            if (name === 'accessToken') return { value: '' };
            if (name === 'admin_accessToken') return { value: 'real-admin-token' };
            return undefined;
        }},
        headers: { get: () => null }
    } as unknown as NextRequest;
    
    expect(service.getAccessToken(mockReq, { scope: 'admin' })).toBe('real-admin-token');
  });

  it('getAccessToken: reads the user cookie only when user scope is explicit', () => {
      const service = container.get(TokenService);
      const mockReq = { 
          cookies: { get: (name: string) => {
              if (name === 'accessToken') return { value: 'user-token' };
              if (name === 'admin_accessToken') return { value: 'admin-token' };
              return undefined;
          }},
          headers: { get: () => null }
      } as unknown as NextRequest;
      
      expect(service.getAccessToken(mockReq, { scope: 'user' })).toBe('user-token');
  });
});
