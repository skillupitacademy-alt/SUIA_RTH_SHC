import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium, type Browser, type ConsoleMessage, type Page } from "playwright";

import { allCourses } from "../packages/marketing-site/src/lib/CoursesCardData";

type Breakpoint = {
  name: string;
  width: number;
  height: number;
};

type AuditRoute = {
  brand: "rth" | "skillup";
  label: string;
  path: string;
  pageType: "home" | "course" | "certificate";
};

type SectionMetric = {
  id: string;
  top: number;
  height: number;
  scrollWidth: number;
  clientWidth: number;
  overflowX: number;
};

type AuditResult = {
  route: AuditRoute;
  breakpoint: Breakpoint;
  status: number;
  pageErrors: string[];
  consoleErrors: string[];
  brokenImages: string[];
  documentOverflowX: number;
  documentScrollHeight: number;
  oversizedVisibleElements: Array<{
    selector: string;
    rightOverflow: number;
    leftOverflow: number;
    width: number;
    text: string;
  }>;
  sections: SectionMetric[];
  screenshotPath: string;
};

const breakpoints: Breakpoint[] = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "wide", width: 1536, height: 864 },
];

const baseUrls = {
  rth: "http://localhost:3004",
  skillup: "http://localhost:3005",
} as const;

const homeSectionIds = [
  "hero",
  "why-us",
  "courses",
  "learning-path",
  "skills",
  "testimonials",
  "contact",
  "footer",
];

const courseSectionIds = [
  "CourseHero",
  "CourseCurriculum",
  "CourseAssessments",
  "CourseGradingCard",
  "CoursePlacement",
  "CoursePlacementStatistics",
  "CourseInstructorsMentors",
  "CourseCommunityNetwork",
  "LearningExperienceTimeline",
  "CourseTechnicalSupport",
  "CoursePrerequisites",
  "CourseSuccessStories",
  "CourseCompanies",
];

const routes: AuditRoute[] = [
  { brand: "rth", label: "home", path: "/", pageType: "home" },
  { brand: "rth", label: "certificate-generator", path: "/certificate-generator", pageType: "certificate" },
  { brand: "rth", label: "certificate-preview", path: "/certificate-preview", pageType: "certificate" },
  { brand: "skillup", label: "home", path: "/", pageType: "home" },
  ...allCourses.flatMap((course) => [
    {
      brand: "rth" as const,
      label: `course-${course.slug}`,
      path: `/courses/${course.slug}`,
      pageType: "course" as const,
    },
    {
      brand: "skillup" as const,
      label: `course-${course.slug}`,
      path: `/courses/${course.slug}`,
      pageType: "course" as const,
    },
  ]),
];

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-");
}

function selectorForElement(element: Element): string {
  const htmlElement = element as HTMLElement;
  if (htmlElement.id) {
    return `#${htmlElement.id}`;
  }

  const className = typeof htmlElement.className === "string"
    ? htmlElement.className.trim().split(/\s+/).slice(0, 2).join(".")
    : "";

  return `${htmlElement.tagName.toLowerCase()}${className ? `.${className}` : ""}`;
}

async function collectAudit(page: Page, route: AuditRoute, breakpoint: Breakpoint, screenshotDir: string): Promise<AuditResult> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  const response = await page.goto(`${baseUrls[route.brand]}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(route.pageType === "course" ? 2500 : 2000);

  const metrics = await page.evaluate(({ homeIds, courseIds, pageType }) => {
    const ids = pageType === "home" ? homeIds : pageType === "course" ? courseIds : [];
    const brokenImages = Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src || img.alt || "(unknown image)");

    const oversizedVisibleElements = Array.from(document.querySelectorAll("*"))
      .map((element) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        if (style.display === "none" || style.visibility === "hidden") {
          return null;
        }

        const rect = htmlElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return null;
        }

        const rightOverflow = Math.round((rect.right - window.innerWidth) * 100) / 100;
        const leftOverflow = Math.round((0 - rect.left) * 100) / 100;

        if (rightOverflow <= 4 && leftOverflow <= 4) {
          return null;
        }

        return {
          selector: (() => {
            if (htmlElement.id) return `#${htmlElement.id}`;
            const cls = typeof htmlElement.className === "string"
              ? htmlElement.className.trim().split(/\s+/).slice(0, 2).join(".")
              : "";
            return `${htmlElement.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
          })(),
          rightOverflow: rightOverflow > 0 ? rightOverflow : 0,
          leftOverflow: leftOverflow > 0 ? leftOverflow : 0,
          width: Math.round(rect.width * 100) / 100,
          text: (htmlElement.innerText || "").trim().slice(0, 80),
        };
      })
      .filter(Boolean)
      .slice(0, 25);

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))
      .map((section) => ({
        id: section.id,
        top: Math.round(section.getBoundingClientRect().top + window.scrollY),
        height: Math.round(section.getBoundingClientRect().height),
        scrollWidth: Math.round(section.scrollWidth),
        clientWidth: Math.round(section.clientWidth),
        overflowX: Math.max(0, Math.round(section.scrollWidth - section.clientWidth)),
      }));

    return {
      brokenImages,
      documentOverflowX: Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth)),
      documentScrollHeight: Math.round(document.documentElement.scrollHeight),
      oversizedVisibleElements,
      sections,
    };
  }, { homeIds: homeSectionIds, courseIds: courseSectionIds, pageType: route.pageType });

  const screenshotPath = join(
    screenshotDir,
    `${sanitizeFileName(route.brand)}-${sanitizeFileName(route.label)}-${breakpoint.name}.png`,
  );

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  return {
    route,
    breakpoint,
    status: response?.status() ?? 0,
    pageErrors,
    consoleErrors,
    brokenImages: metrics.brokenImages,
    documentOverflowX: metrics.documentOverflowX,
    documentScrollHeight: metrics.documentScrollHeight,
    oversizedVisibleElements: metrics.oversizedVisibleElements,
    sections: metrics.sections,
    screenshotPath,
  };
}

async function run() {
  const outDir = join(process.cwd(), "audit-reports", "responsive-audit");
  const screenshotDir = join(outDir, "screenshots");
  mkdirSync(screenshotDir, { recursive: true });

  const browser: Browser = await chromium.launch({ headless: true });
  const results: AuditResult[] = [];

  try {
    for (const breakpoint of breakpoints) {
      const context = await browser.newContext({
        viewport: {
          width: breakpoint.width,
          height: breakpoint.height,
        },
        deviceScaleFactor: 1,
      });

      for (const route of routes) {
        const page = await context.newPage();
        try {
          const result = await collectAudit(page, route, breakpoint, screenshotDir);
          results.push(result);
          console.log(`${route.brand} ${route.path} ${breakpoint.name}: ${result.status}`);
        } catch (error) {
          results.push({
            route,
            breakpoint,
            status: 0,
            pageErrors: [error instanceof Error ? error.message : String(error)],
            consoleErrors: [],
            brokenImages: [],
            documentOverflowX: 0,
            documentScrollHeight: 0,
            oversizedVisibleElements: [],
            sections: [],
            screenshotPath: "",
          });
          console.log(`${route.brand} ${route.path} ${breakpoint.name}: FAILED`);
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  writeFileSync(
    join(outDir, "results.json"),
    JSON.stringify(results, null, 2),
    "utf8",
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
