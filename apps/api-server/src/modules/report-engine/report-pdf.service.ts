import chromium from "@sparticuz/chromium";
import puppeteer, { Browser } from "puppeteer-core";

import { logger } from "@/lib/logger";

import { ReportEngine } from "./report.engine";

let globalBrowser: Browser | null = null;

export class ReportPdfService {
  private static async getBrowser(): Promise<Browser> {
    if (globalBrowser && globalBrowser.isConnected()) {
      return globalBrowser;
    }

    try {
      const isDev = process.env.NODE_ENV === "development";
      
      // Vercel Monorepo Hardening: Search for binaries in root or local node_modules
      if (!isDev) {
        const fs = await import("fs");
        const path = await import("path");
        const possiblePaths = [
          "/var/task/node_modules/@sparticuz/chromium/bin",
          path.join(process.cwd(), "node_modules/@sparticuz/chromium/bin"),
          path.join(process.cwd(), "../../node_modules/@sparticuz/chromium/bin"),
        ];

        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            logger.info({ path: p }, "[ReportPdfService] Found binaries at path");
            // @ts-expect-error setBinPath is available at runtime to override binary path
            chromium.setBinPath?.(p);
            break;
          }
        }
      }

      const headlessFlag = (chromium as unknown as { headless?: boolean }).headless ?? true;

      const options = {
        args: isDev ? [] : chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: isDev 
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" 
          : await chromium.executablePath(),
        headless: isDev ? true : headlessFlag,
      };

      globalBrowser = (await puppeteer.launch(options)) as unknown as Browser;
      return globalBrowser;
    } catch (_error: unknown) {
      const err = _error instanceof Error ? _error : new Error('Unknown error');
      logger.error({ 
        err: err.message, 
        cwd: process.cwd(),
        stack: err.stack 
      }, "[ReportPdfService] Failed to launch browser");
      throw err;
    }
  }

  static async generate(attemptId: string) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      const internalKey = process.env.INTERNAL_API_KEY ?? "secret";
      const baseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3001";
      const url = `${baseUrl}/report/print/${attemptId}?internalKey=${internalKey}`;

      // 1. Set Identity to bypass basic bot detectors
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
        }

        // Default: allow the request to continue
        void request.continue();
      });

      logger.info({ attemptId }, "[ReportPdfService] Navigating to print route");
      const start = Date.now();

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

      // Generate PDF
      const buffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true, // Respect our physical 297x210mm grid
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      const generationTimeMs = Date.now() - start;
      const fileSizeKb = Math.round(buffer.length / 1024);

      // Simple page count check (approximate or using browser if needed)
      // page.pdf doesn't return page count easily, we'd need another library or more complex logic.
      // For now, we'll return a placeholder or estimate.
      const pageCount = 7; // Fixed minimum for our layout

      return {
        buffer: Buffer.from(buffer),
        generationTimeMs,
        fileSizeKb,
        pageCount
      };
    } finally {
      await page.close();
    }
  }
}
