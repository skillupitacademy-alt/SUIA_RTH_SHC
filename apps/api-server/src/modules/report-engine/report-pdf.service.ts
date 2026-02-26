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
  private static readonly log = logger.child({ module: "report-pdf-service" });

  /**
   * Core PDF Generation Logic
   * Supports optional nodeId/nodeType for hierarchical segment rendering.
   */
  static async generate(
    attemptId: string,
    nodeId?: string,
    nodeType?: string,
    pageOffset?: number,
    totalPages?: number
  ): Promise<PdfGenerationResult> {
    const internalEnv = process.env.INTERNAL_API_KEY;
    const internalKey = internalEnv !== undefined && internalEnv !== "" ? internalEnv : "secret";

    const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL;
    const apiBase = apiBaseEnv !== undefined && apiBaseEnv !== "" ? apiBaseEnv : "http://localhost:3000/api";

    // Direct to the Web App for printing, not the API subdomain
    const webAppUrlEnv = process.env.NEXT_PUBLIC_WEB_APP_URL;
    const webAppUrl =
      webAppUrlEnv !== undefined && webAppUrlEnv !== "" ? webAppUrlEnv : apiBase.replace("/api", "").replace("api.", "quiz.");

    const start = Date.now();

    // 1. Resolve browser binary path or remote connection
    const isWindows = process.platform === "win32";
    const browserlessApiEnv = process.env.BROWSERLESS_API_KEY;
    const browserlessUrlEnv = process.env.BROWSERLESS_URL;

    // Construct URL from API Key if provided, otherwise use explicit URL
    const browserlessUrl =
      browserlessApiEnv !== undefined && browserlessApiEnv !== ""
        ? `wss://chrome.browserless.io?token=${browserlessApiEnv}`
        : browserlessUrlEnv;

    const hasBrowserlessUrl = typeof browserlessUrl === "string" && browserlessUrl.length > 0;

    let browser;

    if (hasBrowserlessUrl) {
      logger.info({ attemptId }, "[ReportPdfService] Connecting to remote browserless instance");
      browser = await puppeteer.connect({
        browserWSEndpoint: browserlessUrl as string,
        defaultViewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 2,
          isMobile: false,
          hasTouch: false,
          isLandscape: true,
        },
      });
    } else {
      let executablePath: string;
      if (isWindows) {
        executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      } else {
        executablePath = await chromium.executablePath();
      }

      browser = await puppeteer.launch({
        args: isWindows ? [] : chromium.args,
        defaultViewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 2,
          isMobile: false,
          hasTouch: false,
          isLandscape: true,
        },
        executablePath,
        headless: isWindows ? true : ((chromium as unknown as { headless?: boolean }).headless ?? true),
      });
    }

    try {
      const page = await browser.newPage();

      // Ensure specific landscape dimensions for pixel perfection
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      });

      let url = `${webAppUrl}/report/print/${attemptId}?internalKey=${internalKey}&cache_bust=${Date.now()}`;
      if (nodeId !== undefined && nodeType !== undefined) {
        url += `&nodeId=${nodeId}&nodeType=${nodeType}`;
      }
      if (pageOffset !== undefined) {
        url += `&pageOffset=${pageOffset}`;
      }
      if (totalPages !== undefined) {
        url += `&totalPages=${totalPages}`;
      }

      // 1. Emulate High-Quality Agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );

      // 2. Set Extra Headers so the INITIAL page load bypasses the WAF Rule
      await page.setExtraHTTPHeaders({
        "x-internal-key": internalKey,
      });

      // 3. Fetch data locally for injection
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { reportMaterialized: true },
      });

      type ReportData = Awaited<ReturnType<typeof ReportEngine.getPremiumExamReport>> & { reportMaterialized?: unknown };
      const reportData: ReportData = await ReportEngine.getPremiumExamReport(attemptId);

      if (exam?.reportMaterialized !== undefined) {
        reportData.reportMaterialized = exam.reportMaterialized;
      }

      // 4. Data Injection: Push data into browser memory BEFORE navigation
      logger.info({ attemptId }, "[ReportPdfService] Injecting report data into browser memory");
      await page.evaluateOnNewDocument((data: ReportData) => {
        (globalThis as { __REPORT_DATA__?: ReportData }).__REPORT_DATA__ = data;
      }, reportData);

      // 5. Navigate and Wait
      logger.info({ attemptId, url }, "[ReportPdfService] Navigating to print view");
      await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });

      logger.info({ attemptId }, "[ReportPdfService] Waiting for Neural Signal [data-pdf-ready=\"true\"]");
      await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 0 });

      await page.emulateMediaType("screen");
      await page.evaluateHandle("document.fonts.ready");

      const pdfBuffer = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        landscape: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      return {
        buffer: pdfBuffer as Buffer,
        generationTimeMs: Date.now() - start,
        fileSizeKb: Math.round(pdfBuffer.length / 1024),
        pageCount: totalPages ?? 1,
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Helper specifically for rendering a hierarchical segment
   */
  static async renderSegment(
    attemptId: string,
    nodeId: string,
    nodeType: string,
    pageOffset?: number,
    totalPages?: number
  ): Promise<Buffer> {
    const { buffer } = await this.generate(attemptId, nodeId, nodeType, pageOffset, totalPages);
    return buffer;
  }

  /**
   * Complete generation + upload + DB sync flow
   */
  static async generateAndUpload(attemptId: string): Promise<string> {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true },
    });

    if (!exam) throw new Error(`Exam not found: ${attemptId}`);

    const { buffer, fileSizeKb, generationTimeMs, pageCount } = await this.generate(attemptId);

    const { uploadReport } = await import("@/lib/storage/upload-report");
    const storageUrl = await uploadReport(buffer, exam.userId, attemptId);

    const { ReportRepository } = await import("./report-repository");
    await ReportRepository.updateReportSuccess(attemptId, {
      fileRef: storageUrl,
      generationTimeMs,
      fileSizeKb,
      pageCount,
    });

    return storageUrl;
  }
}
