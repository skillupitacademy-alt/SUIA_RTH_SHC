import { db, exams } from "@quiz/db";
import chromium from "@sparticuz/chromium";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer-core";

import { logger } from "@/lib/logger";

import { ReportEngine } from "./report.engine";
import { ReportRepository } from "./report-repository";

export interface PdfGenerationResult {
  buffer: Buffer;
  generationTimeMs: number;
  fileSizeKb: number;
  pageCount: number;
}

export class ReportPdfService {
  private static singleton: ReportPdfService | null = null;

  static getInstance() {
    if (this.singleton === null) this.singleton = new ReportPdfService();
    return this.singleton;
  }

  static async generate(attemptId: string) {
    return this.getInstance().generate(attemptId);
  }

  // Minimal renderSegment shim for compatibility with HierarchicalReportService
  static async renderSegment(
    attemptId: string,
    nodeId?: string,
    nodeType?: string,
    pageOffset?: number,
    totalPages?: number
  ) {
    const { buffer, pageCount, fileSizeKb, generationTimeMs } = await this.getInstance().generate(
      attemptId,
      nodeId,
      nodeType,
      pageOffset,
      totalPages
    );
    return { buffer, pageCount, fileSizeKb, generationTimeMs };
  }

  constructor(
    private readonly dbInstance = db,
    private readonly reportEngine?: ReportEngine,
    private readonly reportRepository?: ReportRepository
  ) {}

  private log = logger.child({ module: "report-pdf-service" });

  /**
   * Core PDF Generation Logic
   * Supports optional nodeId/nodeType for hierarchical segment rendering.
   */
  async generate(
    attemptId: string,
    nodeId?: string,
    nodeType?: string,
    pageOffset?: number,
    totalPages?: number
  ): Promise<PdfGenerationResult> {
    const internalEnv = process.env.INTERNAL_API_KEY;
    const internalKey = internalEnv !== undefined && internalEnv !== "" ? internalEnv : "secret";

    const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL;
    if (apiBaseEnv === undefined || apiBaseEnv === "") {
      throw new Error("NEXT_PUBLIC_API_URL is required for PDF generation");
    }
    const apiBase = apiBaseEnv;

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
      this.log.info({ attemptId }, "[ReportPdfService] Connecting to remote browserless instance");
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
        const paths = [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          process.env.CHROME_PATH
        ].filter(Boolean) as string[];
        
        const fs = await import("fs");
        const executableCandidate = paths.find((p) => fs.existsSync(p)) ?? paths[0];

        if (executableCandidate && fs.existsSync(executableCandidate)) {
          executablePath = executableCandidate;
        } else {
          this.log.warn({ executableCandidate, attemptId }, "[ReportPdfService] Target Chrome binary not found at primary path");
          executablePath = await chromium.executablePath();
        }
      } else {
        executablePath = await chromium.executablePath();
      }

      this.log.info({ attemptId, isWindows, executablePath }, "[ReportPdfService] Launching local browser instance");
      browser = await puppeteer.launch({
        args: isWindows ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] : chromium.args,
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
      const examRows = await this.dbInstance.select({
        reportMaterialized: exams.reportMaterialized
      })
      .from(exams)
      .where(eq(exams.id, attemptId))
      .limit(1);
      const exam = examRows[0];

      const engine = this.reportEngine || (await import('../core/container')).container.get(ReportEngine);
      type ReportData = Awaited<ReturnType<typeof engine.getPremiumExamReport>> & { reportMaterialized?: unknown };
      const reportData: ReportData = await engine.getPremiumExamReport(attemptId);

      if (exam?.reportMaterialized !== undefined) {
        reportData.reportMaterialized = exam.reportMaterialized;
      }

      // 4. Data Injection: Push data into browser memory BEFORE navigation
      this.log.info({ attemptId }, "[ReportPdfService] Injecting report data into browser memory");
      await page.evaluateOnNewDocument((data: ReportData) => {
        (globalThis as { __REPORT_DATA__?: ReportData }).__REPORT_DATA__ = data;
      }, reportData);

      // 5. Navigate and Wait
      this.log.info({ attemptId, url }, "[ReportPdfService] Navigating to print view");
      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
      } catch (gotoErr) {
        this.log.error({ attemptId, url, err: gotoErr }, "[ReportPdfService] Navigation failed or timed out");
        throw new Error(`Navigation Fault: Check if ${webAppUrl} is accessible.`);
      }

      this.log.info({ attemptId }, "[ReportPdfService] Waiting for Neural Signal [data-pdf-ready=\"true\"]");
      try {
        await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 30000 });
      } catch (selectorErr) {
        this.log.error({ attemptId, err: selectorErr }, "[ReportPdfService] Signal timeout - possible hydration delay");
        throw new Error("Synthesis Timeout: The report engine failed to emit a ready signal within 30s.");
      }

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
  async renderSegment(
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
  async generateAndUpload(attemptId: string): Promise<string> {
    const examRows = await this.dbInstance.select({
      userId: exams.userId
    })
    .from(exams)
    .where(eq(exams.id, attemptId))
    .limit(1);
    const exam = examRows[0];

    if (exam === null || exam === undefined) throw new Error(`Exam not found: ${attemptId}`);

    const { buffer, fileSizeKb, generationTimeMs, pageCount } = await this.generate(attemptId);

    const { uploadReport } = await import("@/lib/storage/upload-report");
    const storageUrl = await uploadReport(buffer, exam.userId, attemptId);

    const repository = this.reportRepository || (await import('../core/container')).container.get(ReportRepository);
    await repository.updateReportSuccess(attemptId, {
      fileRef: storageUrl,
      generationTimeMs,
      fileSizeKb,
      pageCount,
    });

    return storageUrl;
  }
}
