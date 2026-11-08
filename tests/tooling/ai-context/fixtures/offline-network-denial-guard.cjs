// Offline network denial preload for context-cli validation
const net = require('node:net');
const tls = require('node:tls');
const dgram = require('node:dgram');

const deny = (method) => {
  throw new Error(`OFFLINE_NETWORK_VIOLATION: Attempted outbound network access via ${method}`);
};

net.connect = () => deny('net.connect');
net.createConnection = () => deny('net.createConnection');
if (net.Socket && net.Socket.prototype) {
  net.Socket.prototype.connect = () => deny('net.Socket.prototype.connect');
}
tls.connect = () => deny('tls.connect');
if (dgram.Socket && dgram.Socket.prototype) {
  dgram.Socket.prototype.send = () => deny('dgram.Socket.prototype.send');
}
if (typeof globalThis.fetch === 'function') {
  globalThis.fetch = () => Promise.reject(new Error('OFFLINE_NETWORK_VIOLATION: fetch'));
}

