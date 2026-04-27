export async function unifiedFetch(
  url: string,
  options: RequestInit = {}
) {
  const isServer = typeof window === 'undefined';

  let finalUrl = url;

  let headerStore: Headers | null = null;

  // =========================================
  // ✅ 1. GET HEADERS SAFELY (ONCE)
  // =========================================
  if (isServer) {
    try {
      // Dynamic import to avoid bundling in client components
      const { headers } = await import('next/headers');
      headerStore = await headers();
    } catch {
      headerStore = null;
    }
  }

  // =========================================
  // ✅ 2. SSR BASE URL RESOLUTION
  // =========================================
  if (isServer && url.startsWith('/') && headerStore) {
    const protocol =
      headerStore.get('x-forwarded-proto') ||
      (process.env.NODE_ENV === 'development' ? 'http' : 'https');

    const host = headerStore.get('host');

    if (host) {
      finalUrl = `${protocol}://${host}${url}`;
    }
  }

  // =========================================
  // ✅ 3. NORMALIZE HEADERS (SAFE)
  // =========================================
  const finalHeaders = new Headers(options.headers || {});

  // =========================================
  // ✅ 4. SERVER COOKIE FORWARDING
  // =========================================
  if (isServer && headerStore) {
    const cookie = headerStore.get('cookie');

    if (cookie && !finalHeaders.has('cookie')) {
      finalHeaders.set('cookie', cookie);
    }
  }

  // =========================================
  // ✅ 5. FINAL FETCH OPTIONS
  // =========================================
  const finalOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: finalHeaders,
  };

  // =========================================
  // 🔍 DEV DEBUG
  // =========================================
  if (process.env.NODE_ENV === 'development') {
    console.log('[unifiedFetch]', {
      isServer,
      inputUrl: url,
      finalUrl,
    });
  }

  return fetch(finalUrl, finalOptions);
}