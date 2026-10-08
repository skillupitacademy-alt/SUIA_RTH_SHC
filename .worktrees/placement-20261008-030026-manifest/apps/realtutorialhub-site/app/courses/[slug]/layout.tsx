"use client";

import { ReactNode } from "react";
import CourseMarketingLayout from "@quiz/marketing-site/course-layout";

export default function CourseLayoutClient({ children }: { children: ReactNode }) {
  return <CourseMarketingLayout>{children}</CourseMarketingLayout>;
}
