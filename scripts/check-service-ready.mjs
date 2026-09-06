#!/usr/bin/env node
/**
 * Service Readiness Checker
 * Polls a service until it's ready or timeout
 */

async function checkServiceReady(url, maxAttempts = 10, delayMs = 2000) {
  console.log(`Checking service readiness: ${url}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'manual',
      });
      
      clearTimeout(timeoutId);
      
      console.log(`  Attempt ${attempt}/${maxAttempts}: ${response.status}`);
      
      if (response.ok || response.status === 404) {
        console.log(`✓ Service ready at ${url}\n`);
        return true;
      }
      
    } catch (error) {
      console.log(`  Attempt ${attempt}/${maxAttempts}: ${error.message}`);
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`✗ Service not ready after ${maxAttempts} attempts\n`);
  return false;
}

// Test all services
const services = [
  { name: 'RTH Web', url: 'http://realtutorialhub.localhost:3003' },
  { name: 'SkillUp Web', url: 'http://skillup.localhost:3009' },
  { name: 'API Server', url: 'http://localhost:3000/api/auth/login' },
];

let allReady = true;

for (const service of services) {
  const ready = await checkServiceReady(service.url);
  if (!ready) allReady = false;
}

console.log(allReady ? '✅ All services ready' : '❌ Some services not ready');
process.exit(allReady ? 0 : 1);
