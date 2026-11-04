// Offline test setup: prohibit outbound network before test modules are imported.
// Tests may replace fetch with an in-memory stub; socket access remains blocked.
import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';

const deny = () => { throw new Error('Unexpected network access in offline test'); };
globalThis.fetch = deny as typeof fetch;
net.connect = deny as typeof net.connect;
net.createConnection = deny as typeof net.createConnection;
net.Socket.prototype.connect = deny as typeof net.Socket.prototype.connect;
tls.connect = deny as typeof tls.connect;
dgram.Socket.prototype.send = deny as typeof dgram.Socket.prototype.send;
