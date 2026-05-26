import {
  allCourses,
  CATEGORIES,
  COURSE_METADATA,
  heroCommonData,
  SECTION_CONFIG,
  type Course,
} from "../lib/CoursesCardData";
import { defaultAssessmentCertification, defaultCurriculum } from "../lib/DefaultCourseData";

export type CourseIconName =
  | "shield"
  | "bolt"
  | "code"
  | "database"
  | "cloud"
  | "chart-line"
  | "chart-bar"
  | "microchip"
  | "terminal"
  | "brain";

export interface MarketingCourseSnapshot extends Omit<Course, "icon"> {
  iconName: CourseIconName;
}

export interface MarketingCourseCatalogSnapshot {
  categories: readonly string[];
  section: {
    title: string;
    description: string;
  };
  metadata: {
    hours: string;
    students: string;
  };
  courses: MarketingCourseSnapshot[];
}

export interface MarketingCoursePageSnapshot {
  course: MarketingCourseSnapshot;
  heroCommonData: typeof heroCommonData;
}

const iconNameBySlug: Record<string, CourseIconName> = {
  "data-analyst": "chart-line",
  "data-science-ai-bootcamp": "chart-bar",
  "machine-learning-specialist": "brain",
  "data-engineering": "database",
  "python-programming": "code",
  "full-stack-java": "code",
  "full-stack-mern": "code",
  "full-stack-php": "code",
  "devops-engineering": "cloud",
  "cybersecurity-professional": "shield",
  "ethical-hacking-expert": "shield",
  "algorithmic-trading": "bolt",
};

function toCourseSnapshot(course: Course): MarketingCourseSnapshot {
  const { icon: _icon, ...serializableCourse } = course;

  return {
    ...serializableCourse,
    iconName: iconNameBySlug[course.slug] ?? "code",
    curriculum: course.curriculum ?? defaultCurriculum,
    assessmentCertification: course.assessmentCertification ?? defaultAssessmentCertification,
  };
}

export function getMarketingCourseCatalogSnapshot(): MarketingCourseCatalogSnapshot {
  return {
    categories: CATEGORIES,
    section: {
      title: SECTION_CONFIG.title,
      description: SECTION_CONFIG.description,
    },
    metadata: COURSE_METADATA,
    courses: allCourses.map(toCourseSnapshot),
  };
}

export function getMarketingCoursePageSnapshot(slug: string): MarketingCoursePageSnapshot | null {
  const course = allCourses.find((item) => item.slug === slug);
  if (!course) {
    return null;
  }

  return {
    course: toCourseSnapshot(course),
    heroCommonData,
  };
}

function resolveCoursesBaseUrl() {
  return (
    process.env.MARKETING_CONTENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SHC_CONTENT_BASE_URL ??
    process.env.SHARED_CONTENT_API_BASE_URL ??
    null
  );
}

type NextFetchRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export async function loadMarketingCourseCatalogSnapshot(): Promise<MarketingCourseCatalogSnapshot> {
  const baseUrl = resolveCoursesBaseUrl();
  if (baseUrl) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/public/marketing/courses`, {
        headers: {
          accept: "application/json",
        },
        next: {
          revalidate: 1800,
          tags: ["marketing-courses"],
        },
      } as NextFetchRequestInit);

      if (response.ok) {
        return (await response.json()) as MarketingCourseCatalogSnapshot;
      }
    } catch {}
  }

  return getMarketingCourseCatalogSnapshot();
}

export async function loadMarketingCoursePageSnapshot(
  slug: string,
): Promise<MarketingCoursePageSnapshot | null> {
  const baseUrl = resolveCoursesBaseUrl();
  if (baseUrl) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/public/marketing/courses/${slug}`, {
        headers: {
          accept: "application/json",
        },
        next: {
          revalidate: 3600,
          tags: [`marketing-course:${slug}`],
        },
      } as NextFetchRequestInit);

      if (response.ok) {
        return (await response.json()) as MarketingCoursePageSnapshot;
      }
    } catch {}
  }

  return getMarketingCoursePageSnapshot(slug);
}
