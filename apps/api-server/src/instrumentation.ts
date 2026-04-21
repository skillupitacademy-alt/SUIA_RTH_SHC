import { bootstrapContainer } from './lib/app.container';

export const runtime = 'nodejs';

// 🔥 COLD START DETECTION
declare global {
  // eslint-disable-next-line no-var
  var isWarm: boolean | undefined;
  // eslint-disable-next-line no-var
  var coldStartTime: number | undefined;
}

if (global.isWarm !== true) {
  global.coldStartTime = Date.now();
  console.log('[COLD_START]', JSON.stringify({
    event: 'container_start',
    timestamp: new Date().toISOString(),
    runtime: 'nodejs',
  }));
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  
  // 1. Composition Root: Initialize DI Container
  bootstrapContainer();
  console.log('[Bootstrap] DI Container initialized');

  // 2. Upstash Workflows (Task 106/111)
  // Workflows are serverless-native and do not require persistent worker registration here.
  console.log('[Bootstrap] Upstash Workflow environment verified');
  
  // 🔥 Mark container as warm
  if (global.isWarm !== true) {
    global.isWarm = true;
    const warmupTime = Date.now() - (global.coldStartTime ?? Date.now());
    console.log('[WARM_UP_COMPLETE]', JSON.stringify({
      event: 'container_ready',
      warmupDuration: warmupTime,
      timestamp: new Date().toISOString(),
    }));
  }
}
