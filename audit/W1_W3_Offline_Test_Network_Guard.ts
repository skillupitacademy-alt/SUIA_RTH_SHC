// Offline test setup: prohibit outbound network before test modules are imported.
// Tests may replace fetch with an in-memory stub; socket access remains blocked.
import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';
import dns from 'node:dns';

const deny = () => { throw new Error('Unexpected network access in offline test'); };
globalThis.fetch = deny as typeof fetch;
net.connect = deny as typeof net.connect;
net.createConnection = deny as typeof net.createConnection;
net.Socket.prototype.connect = deny as typeof net.Socket.prototype.connect;
tls.connect = deny as typeof tls.connect;
dgram.Socket.prototype.send = deny as typeof dgram.Socket.prototype.send;
dns.lookup = deny as typeof dns.lookup;
dns.resolve = deny as typeof dns.resolve;
dns.promises.lookup = deny as typeof dns.promises.lookup;
dns.promises.resolve = deny as typeof dns.promises.resolve;
const dnsOperations = ['lookupService', 'resolve4', 'resolve6', 'resolveAny', 'resolveCaa', 'resolveCname', 'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt', 'reverse'] as const;
for (const operation of dnsOperations) {
  (dns as unknown as Record<string, unknown>)[operation] = deny;
  (dns.promises as unknown as Record<string, unknown>)[operation] = deny;
}
