import { NextResponse } from 'next/server';

/**
 * Converts a string to an MD5 hash using the Web Crypto API
 * This is safe for Edge runtimes (unlike the Node 'crypto' module)
 */
async function generateMd5(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8); // Using SHA-1 as a fast stand-in since WebCrypto doesn't mandate MD5
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * ETag Conditional GET Middleware
 * 
 * Computes a weak ETag based on the JSON response body. 
 * If the client's 'If-None-Match' header matches the computed ETag,
 * it returns a 304 Not Modified to save bandwidth.
 */
export async function withEtags(request: Request, response: Response): Promise<Response> {
  // Only process successful GET requests that return JSON
  const contentType = response.headers.get('content-type');
  const isJson = contentType !== null && contentType.includes('application/json');

  if (
    request.method !== 'GET' ||
    response.ok !== true ||
    !isJson ||
    response.headers.has('ETag')
  ) {
    return response;
  }

  try {
    // Clone response to read body
    const clonedResponse = response.clone();
    const body = await clonedResponse.text();

    if (!body || body.length === 0) return response;

    // Generate weak ETag (W/"...")
    const hash = await generateMd5(body);
    const etag = `W/"${hash}"`;

    // Check If-None-Match header
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      const notModified = new Response(null, {
        status: 304,
        headers: response.headers,
      });
      notModified.headers.set('ETag', etag);
      return notModified;
    }

    // Create new response with ETag header
    const newHeaders = new Headers(response.headers);
    newHeaders.set('ETag', etag);

    return new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('[ETag Middleware] Error generating ETag:', error);
    return response;
  }
}
