import { expect, it } from 'vitest';
import net from 'node:net';
import dgram from 'node:dgram';
import dns from 'node:dns';
it('fails closed for unmocked fetch and socket connections', () => {
  expect(fetch.name).toBe('deny');
  expect(() => fetch('https://isolated.invalid/')).toThrow('Unexpected network access in offline test');
  expect(() => net.connect(1, '127.0.0.1')).toThrow('Unexpected network access in offline test');
  const socket = dgram.createSocket('udp4');
  expect(() => socket.send(Buffer.from('x'), 1, '127.0.0.1')).toThrow('Unexpected network access in offline test');
  socket.close();
  expect(() => dns.lookup('example.invalid', () => {})).toThrow('Unexpected network access in offline test');
});
