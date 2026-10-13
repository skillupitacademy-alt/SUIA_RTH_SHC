/**
 * Verification Module
 * 
 * Runtime verification functions for block registry and renderer compliance.
 * These complement the validators (V1-V9) with runtime checks.
 */

export {
  verifyRegistryRendererRuntime,
  type RegistryRendererVerificationResult,
} from './registry-renderer-verification.js';
