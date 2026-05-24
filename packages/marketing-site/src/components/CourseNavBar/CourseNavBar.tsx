"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useScrollSpy } from "../NavBar/useScrollSpy";
import { NavItem } from "@quiz/marketing-site/lib/NavBarData";
import NavLogo from "../NavBar/NavLogo";
import ContactButtons from "../NavBar/ContactButtons";
import { ChevronDown } from "lucide-react";

const courseNavItems: NavItem[] = [
  { name: "Overview", id: "CourseHero" },
  { name: "Curriculum", id: "CourseCurriculum" },
  { name: "Assessment", id: "CourseAssessments" },
  { name: "Grading", id: "CourseGradingCard" },
  { name: "Placement", id: "CoursePlacement" },
  { name: "Placement Stats", id: "CoursePlacementStatistics" },
  { name: "Instructors", id: "CourseInstructorsMentors" },
  { name: "Community", id: "CourseCommunityNetwork" },
  { name: "Experience", id: "LearningExperienceTimeline" },
  { name: "Support", id: "CourseTechnicalSupport" },
  { name: "Prerequisites", id: "CoursePrerequisites" },
  { name: "Success", id: "CourseSuccessStories" },
  { name: "Companies", id: "CourseCompanies" },
];

interface CourseNavbarProps {
  onLogoClick?: () => void;
}

const CourseNavbar: React.FC<CourseNavbarProps> = ({ onLogoClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { activeSection, isScrolled, scrollToSection } = useScrollSpy(courseNavItems);

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    closeTimer.current = setTimeout(() => setIsDropdownOpen(false), 150);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 bg-white ${
        isScrolled
          ? "shadow-lg border-b border-gray-100"
          : "shadow-sm border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <NavLogo onLogoClick={handleLogoClick} />

          {/* Desktop Navigation - Centered */}
          <div className="hidden xl:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">

              {/* First 5 nav items */}
              {courseNavItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
                    activeSection === item.id
                      ? "text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={
                    activeSection === item.id
                      ? { backgroundColor: "var(--brand-primary)" }
                      : undefined
                  }
                  aria-label={`Scroll to ${item.name}`}
                >
                  {item.name}
                </button>
              ))}

              {/* More dropdown — single hover zone fixes the disappearing bug */}
              <div
                className="relative"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-1 ${
                    courseNavItems.slice(5).some((item) => activeSection === item.id)
                      ? "bg-gray-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={
                    courseNavItems.slice(5).some((item) => activeSection === item.id)
                      ? { color: "var(--brand-primary)" }
                      : undefined
                  }
                >
                  More{" "}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown panel — flush with button (top-full, no mt gap) */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {courseNavItems.slice(5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`block w-full text-left px-5 py-3.5 text-sm font-medium transition-all duration-200 hover:bg-gray-50 ${
                          activeSection === item.id
                            ? "bg-gray-50 border-l-4"
                            : "text-gray-700"
                        }`}
                        style={
                          activeSection === item.id
                            ? {
                                color: "var(--brand-primary)",
                                borderLeftColor: "var(--brand-primary)",
                              }
                            : undefined
                        }
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="hidden xl:flex items-center space-x-4">
            <ContactButtons variant="desktop" />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300"
              style={isMobileMenuOpen ? { color: "var(--brand-primary)" } : undefined}
              aria-label="Toggle menu"
            >
              <div className="space-y-1.5">
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white shadow-xl border-t border-gray-100">
          <div className="px-4 pt-4 pb-6 space-y-1 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-1">
              {courseNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-3.5 rounded-xl text-left transition-all duration-300 flex items-center justify-between ${
                    activeSection === item.id
                      ? "text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={
                    activeSection === item.id
                      ? { backgroundColor: "var(--brand-primary)" }
                      : undefined
                  }
                >
                  <span className="font-medium">{item.name}</span>
                  {activeSection === item.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile Contact Buttons */}
            <div className="pt-6 border-t border-gray-100 mt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <ContactButtons variant="mobile" />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default CourseNavbar;
