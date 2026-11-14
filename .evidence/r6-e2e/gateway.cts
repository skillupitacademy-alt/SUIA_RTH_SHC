const fs = require('node:fs');
const { serve } = require('@hono/node-server');
const { createApp } = require('../../services/api-gateway/src/index');
// Existing gateway debug statements include credential header fragments.
// Suppress gateway stdout in this test process. HTTP statuses are captured by
// the separate allowlisted browser evidence collector.
console.log = () => undefined;
// The production gateway runs on Workers, where response middleware receives
// mutable response headers. Node fetch responses have immutable headers.
// Clone the transport response in this local adapter to preserve that runtime
// behavior without replacing gateway authentication or routing.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  const response = await nativeFetch(...args);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: new Headers(response.headers) });
};
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json', 'utf8'));
const app = createApp();
const server = serve({ port: state.ports.gateway, hostname: '127.0.0.1', fetch: request => app.fetch(request, state.gatewayBindings) });
process.on('SIGTERM', () => server.close());
console.log('Isolated existing gateway started');
