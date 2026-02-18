import fs from 'fs';
import path from 'path';
import { type Page } from '@playwright/test';

/**
 * CSP Audit Collector
 * Intercepts browser console logs during E2E testing and extracts CSP violations
 * into a structured JSON file for policy drafting.
 */

const AUDIT_DIR = path.join(process.cwd(), 'docs', 'security', 'audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'csp-violations.json');

export function setupCSPAudit(page: Page) {
  page.on('console', (msg) => {
    const text = msg.text();

    if (text.includes('violates the following Content Security Policy') || text.includes('Content Security Policy directive')) {
      const violation = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        message: text,
        type: msg.type(),
      };

      saveViolation(violation);
    }
  });
}

function saveViolation(violation: Record<string, unknown>) {
  try {
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }

    let existing: any[] = [];
    if (fs.existsSync(AUDIT_FILE)) {
      const content = fs.readFileSync(AUDIT_FILE, 'utf-8');
      if (content.trim()) {
        existing = JSON.parse(content) as any[];
      }
    }

    const isDuplicate = existing.some((v) => v.message === (violation as any).message && v.url === (violation as any).url);

    if (!isDuplicate) {
      existing.push(violation);
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(existing, null, 2));
    }
  } catch (err) {
    console.error('[Audit-Collector] Failed to save violation:', err);
  }
}
