type RequestLike = {
  headers: { get(name: string): string | null };
  ip?: string;
};

export function getClientIp(request: RequestLike): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const cfConnectingIp = request.headers.get('cf-connecting-ip')?.trim();
  const xRealIp = request.headers.get('x-real-ip')?.trim();
  const requestIp = request.ip?.trim();

  if (forwarded !== undefined && forwarded !== '') return forwarded;
  if (cfConnectingIp !== undefined && cfConnectingIp !== '') return cfConnectingIp;
  if (xRealIp !== undefined && xRealIp !== '') return xRealIp;
  if (requestIp !== undefined && requestIp !== '') return requestIp;
  return 'unknown';
}
