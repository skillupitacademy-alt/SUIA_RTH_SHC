/**
 * SecurityMuzzle: Enforces production log hygiene by suppressing non-structured console output.
 * In production, overrides console.log, info, and debug to prevent noise, 
 * while allowing warn/error to fall back to the system logger or be suppressed if desired.
 */

export function initSecurityMuzzle() {
  if (process.env.NODE_ENV !== 'production') return;

  const noop = () => {};
  
  // Suppress common noise
  (console as any).log = noop;
  (console as any).info = noop;
  (console as any).debug = noop;
  
  // Warm trace for muzzle activation
  (console as any).warn('[OBSERVABILITY] SecurityMuzzle activated: Console log/info/debug suppressed for PII safety.');
}
