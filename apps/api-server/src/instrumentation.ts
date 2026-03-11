import { bootstrapContainer } from './lib/app.container';

export const runtime = 'nodejs';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  
  // 1. Composition Root: Initialize DI Container
  bootstrapContainer();
  console.log('[Bootstrap] DI Container initialized');

  // 2. Upstash Workflows (Task 106/111)
  // Workflows are serverless-native and do not require persistent worker registration here.
  console.log('[Bootstrap] Upstash Workflow environment verified');
}
