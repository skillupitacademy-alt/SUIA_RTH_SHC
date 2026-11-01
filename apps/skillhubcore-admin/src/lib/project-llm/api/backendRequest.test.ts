// @vitest-environment node
import { createServer, type Server, type RequestListener } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { requestVerificationBackend } from './backendRequest';

let server: Server | undefined;
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
});

async function listen(handler: RequestListener) {
  server = createServer(handler);
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test port');
  return `http://127.0.0.1:${address.port}`;
}

describe('verification backend transport', () => {
  it('preserves authorization, request body, and failure status', async () => {
    const url = await listen((req, res) => {
      expect(req.headers.authorization).toBe('Bearer fixture');
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        expect(body).toBe('{"fixture":true}');
        res.writeHead(409).end('{"detail":"busy"}');
      });
    });
    await expect(requestVerificationBackend(url, {
      method: 'POST', headers: { Authorization: 'Bearer fixture' }, body: '{"fixture":true}',
    })).resolves.toEqual({ status: 409, text: '{"detail":"busy"}' });
  });

  it('terminates a stalled backend request', async () => {
    const url = await listen(() => {});
    await expect(requestVerificationBackend(url, { method: 'POST', headers: {} }, 30))
      .rejects.toThrow('timed out');
  });

  it('rejects unsupported protocols', async () => {
    await expect(requestVerificationBackend('file:///tmp/private', { method: 'GET', headers: {} }))
      .rejects.toThrow('Unsupported backend protocol');
  });
});
