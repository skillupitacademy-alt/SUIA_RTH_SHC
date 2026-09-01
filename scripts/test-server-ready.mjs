#!/usr/bin/env node
import fetch from 'node-fetch';

console.log('Testing if server is ready...');

try {
  const res = await fetch('http://skillup.localhost:3009/', { 
    timeout: 5000,
    redirect: 'manual'
  });
  console.log(`Server status: ${res.status}`);
  console.log('Server is ready!\n');
} catch (e) {
  console.log(`Server not ready: ${e.message}`);
  process.exit(1);
}
