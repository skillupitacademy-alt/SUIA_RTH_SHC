import { describe, it, expect } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';
import type { NextRequest } from 'next/server';

describe('TokenService Tail 4', () => {
    it('getAccessToken: handles infrastructure scope cookie', () => {
        container.reset();
        const service = container.get(TokenService);
        const mockReq = { 
            cookies: { get: (name: string) => name === 'infra_accessToken' ? { value: 'infra-token' } : undefined },
            headers: { get: () => null }
        } as unknown as NextRequest;
        
        expect(service.getAccessToken(mockReq, { scope: 'infrastructure' })).toBe('infra-token');
    });

    it('getAccessToken: reads infra_accessToken as fallback when no scope specified', () => {
        container.reset();
        const service = container.get(TokenService);
        const mockReq = { 
            cookies: { get: (name: string) => name === 'infra_accessToken' ? { value: 'infra-fallback' } : undefined },
            headers: { get: () => null }
        } as unknown as NextRequest;
        
        expect(service.getAccessToken(mockReq)).toBe('infra-fallback'); // Now returns infra token as fallback
    });
});
