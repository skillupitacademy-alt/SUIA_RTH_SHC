import { describe, it, expect } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';
import type { NextRequest } from 'next/server';

describe('TokenService Tail 5', () => {
    it('getAccessToken: returns undefined if cookie exists but is empty string', () => {
        container.reset();
        const service = container.get(TokenService);
        const mockReq = { 
            cookies: { get: () => ({ value: '' }) },
            headers: { get: () => null }
        } as unknown as NextRequest;
        
        expect(service.getAccessToken(mockReq)).toBeUndefined();
    });

    it('getAccessToken: reads admin token as fallback when user token is empty', () => {
        container.reset();
        const service = container.get(TokenService);
        const mockReq = { 
            cookies: { get: (name: string) => {
                if (name === 'accessToken') return { value: '' };
                if (name === 'admin_accessToken') return { value: 'admin-val' };
                return undefined;
            }},
            headers: { get: () => null }
        } as unknown as NextRequest;
        
        expect(service.getAccessToken(mockReq)).toBe('admin-val'); // Now returns admin token as fallback
    });
});
