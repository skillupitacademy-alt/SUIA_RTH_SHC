"use client";

import React, { useState, useCallback } from "react";
import { filterCoursesByCategory, isSingleCardLayout } from "@/lib/CoursesCardData";
import { CATEGORIES, SECTION_CONFIG } from "@/lib/CoursesCardData";
import MobileFilterPanel from "./MobileFilterPanel";
import VerticalCoursesButton from "./VericalCoursesButton";
import CourseGrid from "./CourseGrid";
import { useSectionVisibility } from "./useSectionaVisibility";
import { SectionHeader } from "../CommonHeader/SectionHeader";



const CourseCards = () => {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  
  const showVerticalCourses = useSectionVisibility("courses");

  const filteredCourses = filterCoursesByCategory(activeCategory);
  const isSingleCard = isSingleCardLayout(filteredCourses);

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
  <section
    id="courses"
    className="py-20 font-montserrat relative scroll-mt-24 lg:scroll-mt-28"
  >
    {/* Floating Button */}
    <VerticalCoursesButton
      showVerticalCourses={showVerticalCourses}
      onClick={scrollToCourses}
    />

    <div className="mt-10 w-full max-w-screen-xl mx-auto px-6 lg:px-8 xl:px-12">
      <SectionHeader
        title={SECTION_CONFIG.title}
        description={SECTION_CONFIG.description}
      />

      {filteredCourses.length > 0 ? (
        <CourseGrid courses={filteredCourses} isSingleCard={isSingleCard} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No courses found for this category.
          </p>
        </div>
      )}
    </div>

    <MobileFilterPanel
      showMobileFilter={showMobileFilter}
      setShowMobileFilter={setShowMobileFilter}
      activeCategory={activeCategory}
      setActiveCategory={handleCategoryChange}
    />
  </section>
);

};

export default CourseCards;
