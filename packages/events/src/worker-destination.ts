/** Call only after the queue signature and body have been verified. */
export function assertWorkerDestination(signature: string, requestUrl: string): void {
  try {
    const payload = JSON.parse(Buffer.from(signature.split('.')[1], 'base64url').toString('utf8')) as { sub?: unknown };
    if (typeof payload.sub !== 'string') throw new Error('Missing destination');
    const signed = new URL(payload.sub);
    const actual = new URL(requestUrl);
    // Public and internal origins can differ behind the gateway. The signed
    // destination must still identify this exact worker path and query.
    if (!['http:', 'https:'].includes(signed.protocol) || signed.username || signed.password || signed.hash ||
        signed.pathname !== actual.pathname || signed.search !== actual.search) {
      throw new Error('Destination mismatch');
    }
  } catch {
    const error = new Error('Invalid worker destination');
    error.name = 'SignatureError';
    throw error;
  }
}
