import {
  CourseMarketingPage,
  generateCourseStaticParams,
} from "@quiz/marketing-site/course-page";

export const revalidate = 3600;
export const dynamicParams = true;

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return generateCourseStaticParams();
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  return <CourseMarketingPage slug={slug} />;
}
