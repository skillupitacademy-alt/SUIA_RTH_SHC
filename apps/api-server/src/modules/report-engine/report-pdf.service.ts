import chromium from "@sparticuz/chromium";
import puppeteer, { Browser } from "puppeteer-core";

import { logger } from "@/lib/logger";

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
            // @ts-ignore
            chromium.setBinPath?.(p);
            break;
          }
        }
      }

      const options = {
        args: isDev ? [] : chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: isDev 
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" 
          : await chromium.executablePath(),
        headless: isDev ? true : (chromium as any).headless,
      };

      globalBrowser = (await puppeteer.launch(options)) as unknown as Browser;
      return globalBrowser;
    } catch (error: any) {
      logger.error({ 
        err: error.message, 
        cwd: process.cwd(),
        stack: error.stack 
      }, "[ReportPdfService] Failed to launch browser");
      throw error;
    }
  }

  static async generate(attemptId: string) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      const internalKey = process.env.INTERNAL_API_KEY ?? "secret";
      const baseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3001";
      const url = `${baseUrl}/report/print/${attemptId}?internalKey=${internalKey}`;

      logger.info({ attemptId, url }, "[ReportPdfService] Navigating to print route");

      // Set cookie if needed, but for now we might rely on the route being public with an internal token
      // or we can set the cookie from the current request if we are calling from the user session.
      
      const start = Date.now();

      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

      // Wait for our custom signal
      await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 15000 });

      // Generate PDF
      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
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
