const net = require('node:net');
const tls = require('node:tls');
const deny = () => { throw new Error('QUALITY_OFFLINE_GUARD: network transport denied'); };
net.Socket.prototype.connect = deny;
tls.connect = deny;
globalThis.fetch = async () => deny();
