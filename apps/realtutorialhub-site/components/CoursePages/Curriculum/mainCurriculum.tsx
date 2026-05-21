'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { CurriculumHeader } from './CurriculumHeader';
import { CurriculumAccordion } from './CurriculumAccorrdion';
import { MobileFilter } from './MobileFilter';
import { useCurriculumState } from './usseCurriculumState';
import { useScrollDetection } from './useScrollDetection';
import { CurriculumData } from '@/lib/CoursesCardData';

interface CurriculumProps {
  id: string,
  data: CurriculumData;
}

export default function Curriculum({ id, data }: CurriculumProps) {
  const {
    openSections,
    activeFilter,
    showMobileFilter,
    showMobileButton,
    setShowMobileButton,
    sectionRefs,
    toggleSection,
    handleFilterClick,
    filterOptions,
    setShowMobileFilter
  } = useCurriculumState();

  useScrollDetection(setShowMobileButton);

  useEffect(() => {
    AOS.refresh();
  }, [activeFilter, openSections]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 overflow-hidden pt-10" id="learning-path">
      <div id={id} className="max-w-7xl mx-auto">
        <CurriculumHeader 
          title={data.title} 
          description={data.description} 
        />

        {/* MOBILE CURRICULUM BUTTON - FIXED ON RIGHT SIDE */}
        {showMobileButton && (
          <button
            id="mobile-filter-button"
            onClick={() => setShowMobileFilter(true)}
            className="md:hidden fixed -right-6 top-1/2 transform rotate-[-90deg] -translate-y-1/2 z-40 bg-orange-500 text-white font-bold px-3 py-6 rounded-xl shadow-2xl flex items-center justify-center hover:bg-orange-600 transition-all duration-300"
          >
            <span style={{ letterSpacing: "0.1em", fontSize: "12px" }}>
              CURRICULUM
            </span>
          </button>
        )}

        {/* MOBILE FILTER SLIDER PANEL */}
        <MobileFilter
          showMobileFilter={showMobileFilter}
          activeFilter={activeFilter}
          filterOptions={filterOptions}
          onFilterClick={handleFilterClick}
          onClose={() => setShowMobileFilter(false)}
        />

        {/* Accordion Content - ALL FOUR SECTIONS ALWAYS VISIBLE */}
        <CurriculumAccordion
          data={data}
          openSections={openSections}
          sectionRefs={sectionRefs}
          toggleSection={toggleSection}
        />
      </div>
    </div>
  );
}