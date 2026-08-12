function isIpAddress(value: string): boolean {
  const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  return ipv4.test(value);
}

function normalizeHost(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) return undefined;

  let host = trimmed;
  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      return undefined;
    }
  }

  host = host.split('/')[0].split(':')[0].replace(/^\.+/, '');

  if (host.length === 0 || isIpAddress(host) || !host.includes('.')) {
    return undefined;
  }

  return host;
}

function toSharedDomain(host: string): string {
  const labels = host.split('.').filter(Boolean);
  if (labels.length < 2) {
    return host;
  }

  if (labels.length === 2) {
    return host;
  }

  // Keep cookies usable across quiz/admin/api subdomains.
  return `.${labels.slice(-2).join('.')}`;
}

export function resolveCookieDomain(rawDomain?: string | null, requestHostname?: string): string | undefined {
  const envHost = typeof rawDomain === 'string' ? normalizeHost(rawDomain) : undefined;
  if (envHost !== undefined) {
    return toSharedDomain(envHost);
  }

  const requestHost = typeof requestHostname === 'string' ? normalizeHost(requestHostname) : undefined;
  if (requestHost !== undefined) {
    return toSharedDomain(requestHost);
  }

  return undefined;
}
