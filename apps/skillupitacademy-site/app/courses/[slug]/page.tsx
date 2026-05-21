import { CourseMarketingPage, generateCourseStaticParams } from "@quiz/marketing-site";

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
