export function getEffectiveUserId(source: Headers | HeadersInit): string | null {
  const headers = source instanceof Headers ? source : new Headers(source);
  const shadowUserId = headers.get('x-shadow-user-id');
  if (typeof shadowUserId === 'string' && shadowUserId.trim().length > 0) {
    return shadowUserId.trim();
  }
  return null;
}
