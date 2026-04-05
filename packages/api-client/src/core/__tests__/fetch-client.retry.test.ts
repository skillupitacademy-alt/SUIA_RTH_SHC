import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FetchClient, TimeoutError } from '../fetch-client';

describe('Core: FetchClient Resilience (Task 101, 102)', () => {
    const BASE_URL = 'https://api.example.com';
    let client: FetchClient;
    const headers = () => new Headers();

    beforeEach(() => {
        client = new FetchClient(BASE_URL);
        vi.stubGlobal('fetch', vi.fn());
        vi.useFakeTimers();
        vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should retry on 500 Internal Server Error for GET requests', async () => {
        const mockFetch = vi.mocked(fetch);
        
        // Fail twice, succeed on third
        mockFetch
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error', headers: headers(), json: () => Promise.resolve({}) } as Response)
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error', headers: headers(), json: () => Promise.resolve({}) } as Response)
            .mockResolvedValueOnce({ ok: true, status: 200, headers: headers(), json: () => Promise.resolve({ success: true }) } as Response);

        const promise = client.get('/test', {
            retry: { maxRetries: 2, delay: 10, backoff: 1, jitter: false }
        });

        vi.useRealTimers();
        const result = await promise;
        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should NOT retry on 500 for POST requests by default (non-idempotent)', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({ 
            ok: false, 
            status: 500, 
            headers: headers(),
            json: () => Promise.resolve({ message: 'Server Error' }) 
        } as Response);

        await expect(client.post('/test', {})).rejects.toThrow('Server Error');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout and retry', async () => {
        const mockFetch = vi.mocked(fetch);
        
        // Mock a slow request that triggers AbortController
        mockFetch.mockImplementation((_url, options) => {
            return new Promise((_resolve, reject) => {
                if (options?.signal) {
                    options.signal.addEventListener('abort', () => {
                        const error = new Error('The operation was aborted');
                        error.name = 'AbortError';
                        reject(error);
                    });
                }
            });
        });

        const promise = client.get('/test', { 
            timeout: 50,
            retry: { maxRetries: 1, delay: 10, backoff: 1, jitter: false }
        });

        let caught: unknown;
        const handled = promise.catch((err) => {
            caught = err;
        });

        await vi.runAllTimersAsync();
        await handled;
        expect(caught).toBeInstanceOf(TimeoutError);
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
            .mockResolvedValueOnce({ ok: true, status: 200, headers: headers(), json: () => Promise.resolve({ success: true }) } as Response);

        const promise = client.get('/test');

        await vi.runAllTimersAsync();
        
        const result = await promise;
        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not auto-refresh auth login failures', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: headers(),
            json: () => Promise.resolve({ message: 'Invalid credentials' }),
        } as Response);

        await expect(client.post('/auth/login', { email: 'a@b.com', password: 'pw' }))
            .rejects.toThrow('Invalid credentials');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0]?.[0]).toBe('https://api.example.com/auth/login');
    });

    it('should not auto-refresh admin auth session checks', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: headers(),
            json: () => Promise.resolve({ error: 'Unauthorized' }),
        } as Response);

        await expect(client.get('/admin/auth/me')).rejects.toThrow('Unauthorized');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0]?.[0]).toBe('https://api.example.com/admin/auth/me');
    });

    it('should not treat 403 as a session-expired condition', async () => {
        const mockFetch = vi.mocked(fetch);

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            headers: headers(),
            json: () => Promise.resolve({ error: 'Forbidden' }),
        } as Response);

        await expect(client.get('/dashboard')).rejects.toThrow('Forbidden');

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry once on csrf validation failure for mutations', async () => {
        const mockFetch = vi.mocked(fetch);

        Object.defineProperty(globalThis, 'document', {
            value: { cookie: 'csrfToken=first-token' },
            configurable: true,
        });

        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 403,
                headers: headers(),
                json: () => Promise.resolve({ error: 'CSRF validation failed', message: 'Missing or invalid CSRF token' }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: headers(),
                json: () => Promise.resolve({ success: true }),
            } as Response);

        const promise = client.patch('/domains/1', { name: 'Updated' });

        vi.useRealTimers();

        await expect(promise).resolves.toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not dispatch auth:forbidden for csrf validation failures', async () => {
        const mockFetch = vi.mocked(fetch);
        const dispatchEvent = vi.fn();

        Object.defineProperty(globalThis, 'document', {
            value: { cookie: 'csrfToken=first-token' },
            configurable: true,
        });
        Object.defineProperty(globalThis, 'window', {
            value: { dispatchEvent, location: { pathname: '/questions', search: '' } },
            configurable: true,
        });

        mockFetch.mockResolvedValue({
            ok: false,
            status: 403,
            headers: headers(),
            json: () => Promise.resolve({ error: 'CSRF validation failed', message: 'Missing or invalid CSRF token' }),
        } as Response);

        vi.useRealTimers();

        await expect(client.patch('/domains/1', { name: 'Updated' })).rejects.toThrow('Missing or invalid CSRF token');
        expect(dispatchEvent).not.toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should forward the current browser host to the api for cookie scoping', async () => {
        const mockFetch = vi.mocked(fetch);

        Object.defineProperty(globalThis, 'window', {
            value: { location: { host: 'quiz.skillhubcore.in' } },
            configurable: true,
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: headers(),
            json: () => Promise.resolve({ success: true }),
        } as Response);

        await expect(client.post('/auth/signup', { email: 'x@y.com' })).resolves.toEqual({ success: true });

        const init = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined;
        const sentHeaders = init?.headers as Record<string, string> | undefined;
        expect(sentHeaders?.['x-original-host']).toBe('quiz.skillhubcore.in');
    });
});
