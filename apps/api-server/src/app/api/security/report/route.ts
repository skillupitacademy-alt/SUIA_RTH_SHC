import fs from 'fs';
import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';

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

import { withLogging } from '@/lib/withLogging';

async function handler(req: NextRequest) {
    const start = Date.now();
    try {
        const body = await req.json() as CSPReport;
        const report = body['csp-report'];

        if (report === undefined || report === null) {
            return new NextResponse(null, { status: 400 });
        }

    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: req.headers.get('user-agent') ?? 'unknown',
      ...report,
    });

    const logDir = path.join(process.cwd(), 'logs', 'security');
    const logFile = path.join(logDir, 'csp-audit.log');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, logEntry + '\n');

    logger.warn({
      route: '/api/security/report',
      method: req.method,
      documentUri: report['document-uri'],
      blockedUri: report['blocked-uri'],
    }, '[CSP-AUDIT] Violation');

    recordCounter('security.csp_report.count', 1, { outcome: 'success' });
    recordTimer('security.csp_report.duration', Date.now() - start, { outcome: 'success' });
    return new NextResponse(null, { status: 204 }); 
  } catch (err) {
    recordCounter('security.csp_report.count', 1, { outcome: 'failure' });
    logger.error({ err, route: '/api/security/report', method: 'POST' }, '[CSP-AUDIT] Error processing report');
    return new NextResponse(null, { status: 500 });
  }
}

export const POST = withLogging(handler, { component: 'security', operation: 'csp_report' });
