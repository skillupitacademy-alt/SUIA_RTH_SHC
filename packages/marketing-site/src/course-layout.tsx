"use client";

import { ReactNode } from "react";

import CourseNavbar from "@quiz/marketing-site/components/CourseNavBar/CourseNavBar";
import LenisProvider from "@quiz/marketing-site/components/Providers/LenisProvider";

export default function CourseMarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CourseNavbar />
      <main className="pt-20">
        <LenisProvider>{children}</LenisProvider>
      </main>
    </>
  );
}
