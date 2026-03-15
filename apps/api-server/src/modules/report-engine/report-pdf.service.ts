import { db, exams } from "@quiz/db";
import chromium from "@sparticuz/chromium";
import { eq } from "drizzle-orm";
import puppeteer, { type Browser, type PDFOptions } from "puppeteer-core";

import { logger } from "@/lib/logger";
import { PremiumReport, ReportEngine } from "@/modules/report-engine/report.engine";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export interface GeneratePdfOptions {
  customPath?: string;
  customData?: unknown;
}

export class ReportPdfService {
  private static instance: ReportPdfService;
  private log = logger.child({ module: "report-pdf-service" });

  constructor(
    private readonly dbInstance: typeof db = db,
    private readonly reportEngine?: ReportEngine,
    private readonly reportRepository?: ReportRepository
  ) {}

  static getInstance(): ReportPdfService {
    if (ReportPdfService.instance === null || ReportPdfService.instance === undefined) {
      ReportPdfService.instance = new ReportPdfService();
    }
    return ReportPdfService.instance;
  }

  /**
   * Generates a PDF via Browserless or local Chromium
   */
  async generate(
    attemptId: string,
    nodeId?: string,
    nodeType?: string,
    pageOffset?: number,
    totalPages?: number,
    options?: GeneratePdfOptions
  ): Promise<{ buffer: Buffer; generationTimeMs: number; fileSizeKb: number; pageCount: number }> {
    const start = Date.now();
    const isWindows = process.platform === "win32";
    const webAppUrl = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";
    const internalKey = process.env.INTERNAL_API_KEY ?? "dev-internal-key";
    
    // Remote browserless (Production) vs Local Chromium (Dev)
    const browserlessUrl = process.env.BROWSERLESS_URL;
    const hasBrowserlessUrl = typeof browserlessUrl === 'string' && browserlessUrl.trim() !== '';

    let browser: Browser;

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
        ].filter((p): p is string => p !== undefined && p !== null && p !== "") as string[];
        
        const fs = await import("fs");
        const executableCandidate = paths.find((p) => fs.existsSync(p)) ?? paths[0];

        if (executableCandidate !== undefined && fs.existsSync(executableCandidate)) {
          executablePath = executableCandidate;
        } else {
          this.log.warn({ executableCandidate, attemptId }, "[ReportPdfService] Target Chrome binary not found at primary path");
          executablePath = await (await import("@sparticuz/chromium")).default.executablePath();
        }
      } else {
        executablePath = await (await import("@sparticuz/chromium")).default.executablePath();
      }

      this.log.info({ attemptId, isWindows, executablePath }, "[ReportPdfService] Launching local browser instance");
      browser = await puppeteer.launch({
        args: isWindows ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] : ((chromium as unknown as { args: string[] }).args),
        defaultViewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 2,
          isMobile: false,
          hasTouch: false,
          isLandscape: true,
        },
        executablePath,
        headless: (isWindows ? true : (chromium as unknown as { headless: boolean | 'shell' }).headless) as boolean | 'shell',
      });
    }

    try {
      const page = await browser.newPage();

      const isInsightReport = options?.customPath?.includes('student-insight') ?? false;
      
      // Ensure specific dimensions for pixel perfection
      await page.setViewport({
        width: isInsightReport ? 1200 : 1920,
        height: isInsightReport ? 1600 : 1080,
        deviceScaleFactor: 2,
        isLandscape: !isInsightReport
      });

      let url = options?.customPath !== undefined && options?.customPath !== null && options?.customPath !== ""
        ? `${webAppUrl}${options.customPath}`
        : `${webAppUrl}/report/${attemptId}/print?internalId=${nodeId ?? ""}&type=${nodeType ?? ""}`;
      
      if (!url.includes('?')) url += '?';
      else url += '&';
      url += `key=${internalKey}`;

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

      const engine = this.reportEngine ?? (await import('../core/container')).container.get(ReportEngine);
      const reportData: PremiumReport & { reportMaterialized?: unknown } = await engine.getPremiumExamReport(attemptId);

      if (exam?.reportMaterialized !== undefined && exam?.reportMaterialized !== null) {
        reportData.reportMaterialized = exam.reportMaterialized;
      }

      // 4. Data Injection: Push data into browser memory BEFORE navigation
      this.log.info({ attemptId }, "[ReportPdfService] Injecting report data into browser memory");
      const dataToInject = options?.customData ?? reportData;
      await page.evaluateOnNewDocument((data: unknown) => {
        (globalThis as { __REPORT_DATA__?: unknown }).__REPORT_DATA__ = data;
      }, dataToInject);

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

      const pdfOptions: PDFOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      };

      if (isInsightReport) {
        pdfOptions.width = 1200;
        pdfOptions.height = 1600;
      } else {
        pdfOptions.format = 'A4';
        pdfOptions.landscape = true;
      }

      const pdfBuffer = await page.pdf(pdfOptions);

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
  ): Promise<{ buffer: Buffer }> {
    const { buffer } = await this.generate(attemptId, nodeId, nodeType, pageOffset, totalPages);
    return { buffer };
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

    const repository = this.reportRepository ?? (await import('../core/container')).container.get(ReportRepository);
    await repository.updateReportSuccess(attemptId, {
      fileRef: storageUrl,
      generationTimeMs,
      fileSizeKb,
      pageCount,
    });

    return storageUrl;
  }

  // Static wrappers for backward compatibility
  private static readonly defaultService = new ReportPdfService();

  static generate(
    attemptId: string,
    nodeId?: string,
    nodeType?: string,
    pageOffset?: number,
    totalPages?: number,
    options?: GeneratePdfOptions
  ) {
    return this.defaultService.generate(attemptId, nodeId, nodeType, pageOffset, totalPages, options);
  }

  static renderSegment(
    attemptId: string,
    nodeId: string,
    nodeType: string,
    pageOffset?: number,
    totalPages?: number
  ) {
    return this.defaultService.renderSegment(attemptId, nodeId, nodeType, pageOffset, totalPages);
  }

  static generateAndUpload(attemptId: string) {
    return this.defaultService.generateAndUpload(attemptId);
  }
}
