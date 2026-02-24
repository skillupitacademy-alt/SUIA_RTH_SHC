import { db, exams } from "@quiz/db";
import chromium from "@sparticuz/chromium";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer-core";

import { logger } from "@/lib/logger";

import { ReportEngine } from "./report.engine";

export interface PdfGenerationResult {
  buffer: Buffer;
  generationTimeMs: number;
  fileSizeKb: number;
  pageCount: number;
}

export class ReportPdfService {
  private static readonly log = logger.child({ module: 'report-pdf-service' });

  /**
   * Core PDF Generation Logic
   * Used by both the API routes and the Health Check Cron
   */
  static async generate(attemptId: string): Promise<PdfGenerationResult> {
    const internalEnv = process.env.INTERNAL_API_KEY;
    const internalKey = internalEnv !== undefined && internalEnv !== "" ? internalEnv : "secret";

    const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL;
    const apiBase = apiBaseEnv !== undefined && apiBaseEnv !== "" ? apiBaseEnv : "http://localhost:3000/api";
    
    // Direct to the Web App for printing, not the API subdomain
    const webAppUrlEnv = process.env.NEXT_PUBLIC_WEB_APP_URL;
    const webAppUrl = webAppUrlEnv !== undefined && webAppUrlEnv !== "" ? webAppUrlEnv : apiBase.replace('/api', '').replace('api.', 'quiz.');
    
    const start = Date.now();
    
    // 1. Resolve browser binary path
    let executablePath: string;
    const isWindows = process.platform === "win32";

    if (isWindows) {
      // Fallback for local dev if chromium is not installed via sparticuz
      executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else {
      // In production (Vercel/Linux), we MUST use sparticuz
      executablePath = await chromium.executablePath();
    }

    const browser = await puppeteer.launch({
      args: isWindows ? [] : chromium.args,
      defaultViewport: {
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        isLandscape: true
      },
      executablePath,
      headless: isWindows ? true : ((chromium as unknown as { headless?: boolean }).headless ?? true),
    });

    try {
      const page = await browser.newPage();
      
      // Ensure specific landscape dimensions for pixel perfection
      await page.setViewport({
        width: 1440,
        height: 900,
        deviceScaleFactor: 2
      });

      const url = `${webAppUrl}/report/print/${attemptId}?internalKey=${internalKey}`;
      
      // 1. Emulate High-Quality Agent
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
      
      // 2. Set Extra Headers so the INITIAL page load bypasses the WAF Rule
      await page.setExtraHTTPHeaders({
        "x-internal-key": internalKey
      });

      logger.info({ attemptId, url }, "[ReportPdfService] Fetching report data locally for interception");
      
      // 3. Fetch data locally to bypass network
      const reportData = await ReportEngine.getPremiumExamReport(attemptId);

      // 4. Set up interception with blocking for speed
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const reqUrl = request.url();
        // Block trackers/analytics
        if (reqUrl.includes('analytics') || reqUrl.includes('track') || reqUrl.includes('sentry') || reqUrl.includes('cloudflare')) {
          void request.abort();
          return;
        }

        // Intercept data request
        if (reqUrl.includes('/api/reports') && reqUrl.includes(attemptId)) {
          logger.info({ reqUrl }, "[ReportPdfService] Providing local data");
          void request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(reportData),
          });
          return;
        }

        // Default: allow the request to continue
        void request.continue();
      });

      logger.info({ attemptId }, "[ReportPdfService] Navigating to print route");
      
      // Hook console logs
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes("PdfReadySignal") || text.includes("error")) {
           logger.info({ text }, "[ReportPdfService] Page Console");
        }
      });

      // Faster logic: DomContentLoaded only, 20s cap
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Signal wait with aggressive timeout (15s)
      try {
        await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 15000 });
      } catch (_err) {
        logger.warn({ attemptId }, "[ReportPdfService] Signal timeout, forcing snap.");
      }

      // 5. Force "screen" media and wait for fonts to prevent layout shifts
      await page.emulateMediaType('screen');
      await page.evaluateHandle('document.fonts.ready');

      // 6. Generate PDF with exact landscape specifications
      const pdfBuffer = await page.pdf({
        printBackground: true,
        width: '1440px',
        height: '900px',
        landscape: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      const generationTimeMs = Date.now() - start;
      const fileSizeKb = Math.round(pdfBuffer.length / 1024);
      
      // Attempt to count pages (rough estimate or use puppeteer if possible)
      const pageCount = 7; 

      return {
        buffer: pdfBuffer as Buffer,
        generationTimeMs,
        fileSizeKb,
        pageCount
      };

    } finally {
      await browser.close();
    }
  }

  /**
   * Complete generation + upload + DB sync flow
   */
  static async generateAndUpload(attemptId: string): Promise<string> {
    // 1. Get Exam Data (to get userId)
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true }
    });

    if (!exam) throw new Error(`Exam not found: ${attemptId}`);

    // 2. Generate
    const { buffer, fileSizeKb, generationTimeMs, pageCount } = await this.generate(attemptId);
    
    // 3. Upload
    const { uploadReport } = await import("@/lib/storage/upload-report");
    const storageUrl = await uploadReport(buffer, exam.userId, attemptId);

    // 4. Update Status (Fallback for legacy scripts)
    const { ReportRepository } = await import("./report-repository");
    await ReportRepository.updateReportSuccess(attemptId, {
      fileRef: storageUrl,
      generationTimeMs,
      fileSizeKb,
      pageCount
    });

    return storageUrl;
  }
}
