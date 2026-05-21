'use client';

import { useState, useEffect, useRef } from 'react';

type FilterKey = 'all' | 'learning' | 'projects' | 'tools' | 'career';

export const useCurriculumState = () => {
  const [openSections, setOpenSections] = useState<number[]>([0]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileButton, setShowMobileButton] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleSection = (index: number) => {
    setOpenSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Filter to section mapping
  const filterToSectionMap: Record<FilterKey, number> = {
    all: 0,
    learning: 0,
    projects: 1,
    tools: 2,
    career: 3,
  };

  const filterOptions = [
    { key: 'all', label: 'All Learning Path' },
    { key: 'learning', label: 'Learning Phases' },
    { key: 'projects', label: 'Portfolio Projects' },
    { key: 'tools', label: 'Tools & Technologies' },
    { key: 'career', label: 'Career Outcomes' },
  ];

  // Close mobile filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const mobileFilterPanel = document.getElementById('mobile-filter-panel');
      const mobileFilterButton = document.getElementById('mobile-filter-button');

      if (showMobileFilter &&
        mobileFilterPanel &&
        !mobileFilterPanel.contains(e.target as Node) &&
        mobileFilterButton &&
        !mobileFilterButton.contains(e.target as Node)) {
        setShowMobileFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileFilter]);

  // Handle filter click - scroll to the section
  const handleFilterClick = (filterKey: FilterKey) => {
    setActiveFilter(filterKey);
    setShowMobileFilter(false);
    
    const sectionIndex = filterToSectionMap[filterKey];
    
    // Open the section if it's not already open
    if (!openSections.includes(sectionIndex)) {
      setOpenSections(prev => [...prev, sectionIndex]);
    }
    
    // Scroll to that section
    setTimeout(() => {
      sectionRefs.current[sectionIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return {
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
  };
};