import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';
import type { NextRequest } from 'next/server';

describe('TokenService Audience Cleanup', () => {
  beforeEach(() => {
    container.reset();
  });

  it('getAccessToken: skips empty strings in cookies', () => {
    const service = container.get(TokenService);
    const mockReq = { 
        cookies: { get: (name: string) => {
            if (name === 'accessToken') return { value: '' };
            if (name === 'admin_accessToken') return { value: 'real-admin-token' };
            return undefined;
        }},
        headers: { get: () => null }
    } as unknown as NextRequest;
    
    expect(service.getAccessToken(mockReq)).toBe('real-admin-token');
  });

  it('getAccessToken: prioritizes accessToken cookie over others when no scope', () => {
      const service = container.get(TokenService);
      const mockReq = { 
          cookies: { get: (name: string) => {
              if (name === 'accessToken') return { value: 'user-token' };
              if (name === 'admin_accessToken') return { value: 'admin-token' };
              return undefined;
          }},
          headers: { get: () => null }
      } as unknown as NextRequest;
      
      expect(service.getAccessToken(mockReq)).toBe('user-token');
  });
});
