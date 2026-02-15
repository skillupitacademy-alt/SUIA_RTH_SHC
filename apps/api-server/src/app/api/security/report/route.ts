import fs from 'fs';
import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';

/**
 * SECURITY SINK: CSP Reporting Endpoint
 * Handles standard JSON reports from browsers regarding Content Security Policy violations.
 * Currently in AUDIT MODE: Logs to local file system for review.
 */

export const dynamic = 'force-dynamic';

interface CSPReport {
    'csp-report': {
        'document-uri': string;
        'referrer'?: string;
        'violated-directive': string;
        'effective-directive'?: string;
        'original-policy': string;
        'disposition'?: string;
        'blocked-uri': string;
        'status-code'?: number;
        'script-sample'?: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        // 1. Parse the report
        // Browsers send application/csp-report content-type, which contains valid JSON.
        const body = await req.json() as CSPReport;
        const report = body['csp-report'];

        if (report === undefined || report === null) {
            return new NextResponse(null, { status: 400 });
        }

    // 2. Format the log entry
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: req.headers.get('user-agent') ?? 'unknown',
      ...report,
    });

    // 3. Persistent Logging (Server-Side)
    // We write to a dedicated security audit log for Phase B
    const logDir = path.join(process.cwd(), 'logs', 'security');
    const logFile = path.join(logDir, 'csp-audit.log');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, logEntry + '\n');

    // 4. Trace to console for real-time monitoring in dev/prod logs
    console.warn(`[CSP-AUDIT] Violation at ${report['document-uri']} | Blocked: ${report['blocked-uri']}`);

    return new NextResponse(null, { status: 204 }); // Standard success for reporting endpoints
  } catch (err) {
    console.error('[CSP-AUDIT] Error processing report:', err);
    return new NextResponse(null, { status: 500 });
  }
}
