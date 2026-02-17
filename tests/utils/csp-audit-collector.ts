// No-op shim to satisfy Playwright imports during smoke runs.
// Add real CSP auditing later if needed.
export async function setupCSPAudit(_page: unknown): Promise<void> {
  return;
}
