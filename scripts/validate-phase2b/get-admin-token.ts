/**
 * Admin Token Fetcher
 * ====================
 * Gets admin access token for validation tests
 */

export async function getAdminToken(baseUrl: string): Promise<string | null> {
  try {
    // Try RTH admin with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const rthResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@realtutorialhub.com',
        password: 'admin123',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (rthResponse.ok) {
      // Extract token from Set-Cookie header
      const setCookie = rthResponse.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/accessToken=([^;]+)/);
        if (match) {
          return match[1];
        }
      }

      // Or from response body
      const data = await rthResponse.json();
      if (data.accessToken || data.token) {
        return data.accessToken || data.token;
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`     ⚠️  Token fetch timed out after 10 seconds`);
    } else {
      console.log(`     ⚠️  Token fetch failed: ${error}`);
    }
    return null;
  }
}
