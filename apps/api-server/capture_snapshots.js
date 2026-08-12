import path from "path";
import puppeteer from "puppeteer-core";

async function capture() {
    const attemptId = "1771810577"; // Recent attemptId
    const artifactDir = "C:\\Users\\RealTutorialHub\\.gemini\\antigravity\\brain\\db098ece-f8b5-48d3-bab3-df368067be9a";
    const internalKey = "secret";
    const url = `https://api.skillhubcore.in/report/print/${attemptId}?internalKey=${internalKey}`;

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });

        console.log(`Navigating to ${url}...`);
        // Note: We expect the local server to be running on 3001
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log('Waiting for PDF Ready signal...');
        try {
            await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 20000 });
        } catch (_e) {
            console.warn('Timed out waiting for data-pdf-ready, snapping anyway.');
        }

        // Capture Page 01 (Executive Summary)
        const summaryPath = path.join(artifactDir, 'FIXED_EXECUTIVE_SUMMARY.png');
        await page.screenshot({ path: summaryPath, clip: { x: 0, y: 0, width: 1123, height: 794 } });
        console.log(`Saved Summary to ${summaryPath}`);

        // Scroll to Page 07 (Appendix) - approx position
        const appendixPath = path.join(artifactDir, 'FIXED_APPENDIX_LANDSCAPE.png');
        await page.screenshot({ path: appendixPath, clip: { x: 0, y: 794 * 6, width: 1123, height: 794 } });
        console.log(`Saved Appendix to ${appendixPath}`);

    } catch (err) {
        console.error('Capture failed:', err);
    } finally {
        await browser.close();
    }
}

capture();
