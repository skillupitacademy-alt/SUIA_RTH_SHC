import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

// Node fetch's default headers timeout is shorter than an isolated build.
export function requestVerificationBackend(
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string },
  timeoutMs = 2_400_000,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    if (!['http:', 'https:'].includes(target.protocol)) {
      reject(new Error('Unsupported backend protocol'));
      return;
    }
    const transport = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = transport(target, options, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 32 * 1024 * 1024) {
          req.destroy(new Error('Backend response exceeds size limit'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('aborted', () => reject(new Error('Backend response interrupted')));
      response.on('end', () => resolve({
        status: response.statusCode ?? 502,
        text: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    const timer = setTimeout(() => req.destroy(new Error('Backend verification timed out')), timeoutMs);
    req.on('close', () => clearTimeout(timer));
    req.on('error', reject);
    req.end(options.body);
  });
}
