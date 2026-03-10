import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FetchClient, TimeoutError } from '../fetch-client';

describe('Core: FetchClient Resilience (Task 101, 102)', () => {
    const BASE_URL = 'https://api.example.com';
    let client: FetchClient;

    beforeEach(() => {
        client = new FetchClient(BASE_URL);
        vi.stubGlobal('fetch', vi.fn());
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('should retry on 500 Internal Server Error for GET requests', async () => {
        const mockFetch = vi.mocked(fetch);
        
        // Fail twice, succeed on third
        mockFetch
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error', json: () => Promise.resolve({}) } as Response)
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error', json: () => Promise.resolve({}) } as Response)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) } as Response);

        const promise = client.get('/test');
        
        // Fast-forward through retries
        await vi.runAllTimersAsync();
        
        const result = await promise;
        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should NOT retry on 500 for POST requests by default (non-idempotent)', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({ 
            ok: false, 
            status: 500, 
            json: () => Promise.resolve({ message: 'Server Error' }) 
        } as Response);

        await expect(client.post('/test', {})).rejects.toThrow('Server Error');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout and retry', async () => {
        const mockFetch = vi.mocked(fetch);
        
        // Mock a slow request that triggers AbortController
        mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

        const promise = client.get('/test', { timeout: 100 });

        // Trigger timeout
        await vi.advanceTimersByTimeAsync(150);
        // Trigger first retry delay
        await vi.advanceTimersByTimeAsync(2000); 
        
        // We expect it to have attempted at least twice
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should honor 429 Retry-After header', async () => {
        const mockFetch = vi.mocked(fetch);
        
        mockFetch
            .mockResolvedValueOnce({ 
                ok: false, 
                status: 429, 
                headers: new Headers({ 'Retry-After': '5' }),
                json: () => Promise.resolve({}) 
            } as Response)
            .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) } as Response);

        const promise = client.get('/test');

        // Wait for 429 delay (5s)
        await vi.advanceTimersByTimeAsync(5100);
        
        const result = await promise;
        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
