"use client";

import React, { useCallback, useState } from "react";
import type { MarketingCourseCatalogSnapshot } from "@quiz/marketing-site/content/courses";

import MobileFilterPanel from "./MobileFilterPanel";
import VerticalCoursesButton from "./VericalCoursesButton";
import CourseGrid from "./CourseGrid";
import { useSectionVisibility } from "./useSectionaVisibility";
import { SectionHeader } from "../CommonHeader/SectionHeader";

interface CourseCardsProps {
  catalog: MarketingCourseCatalogSnapshot;
}

const CourseCards = ({ catalog }: CourseCardsProps) => {
  const [activeCategory, setActiveCategory] = useState<string>(catalog.categories[0] ?? "All Courses");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const showVerticalCourses = useSectionVisibility("courses");

  const filteredCourses =
    activeCategory === "All Courses"
      ? catalog.courses
      : catalog.courses.filter((course) => course.category === activeCategory);
  const isSingleCard = filteredCourses.length === 1;

  const scrollToCourses = useCallback(() => {
    const section = document.getElementById("courses");
    if (!section) return;

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setShowMobileFilter(true);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setShowMobileFilter(false);
  }, []);

  return (
    <section id="courses" className="py-20 font-montserrat relative scroll-mt-24 lg:scroll-mt-28">
      <VerticalCoursesButton showVerticalCourses={showVerticalCourses} onClick={scrollToCourses} />

      <div className="mt-10 w-full max-w-screen-xl mx-auto px-6 lg:px-8 xl:px-12">
        <SectionHeader title={catalog.section.title} description={catalog.section.description} />

        {filteredCourses.length > 0 ? (
          <CourseGrid courses={filteredCourses} isSingleCard={isSingleCard} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No courses found for this category.</p>
          </div>
        )}
      </div>

      <MobileFilterPanel
        categories={catalog.categories}
        showMobileFilter={showMobileFilter}
        setShowMobileFilter={setShowMobileFilter}
        activeCategory={activeCategory}
        setActiveCategory={handleCategoryChange}
      />
    </section>
  );
};

export default CourseCards;
