"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketingContent } from "@quiz/marketing-site";
import NavLogo from "./NavLogo";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import ContactButtons from "./ContactButtons";
import { useScrollSpy } from "./useScrollSpy";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { navigation } = useMarketingContent();
  const navItems = navigation.navItems;

  const { activeSection, isScrolled, scrollToSection } =
    useScrollSpy(navItems);

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const router = useRouter();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 bg-white ${
        isScrolled
          ? "shadow-lg border-b border-gray-100"
          : "shadow-sm border-b border-gray-100"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 xl:px-10">
        <div className="flex items-center justify-between h-20 relative">
          <NavLogo onLogoClick={() => router.push("/")} />

          {/* CENTERED DESKTOP NAV */}
          <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 px-6">
            <DesktopNav
              navItems={navItems}
              activeSection={activeSection}
              onNavItemClick={handleNavClick}
            />
          </div>

          {/* CONTACT BUTTONS */}
          <div className="hidden xl:flex items-center gap-5">
            <ContactButtons variant="desktop" />
          </div>

          {/* MOBILE TOGGLE */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="p-3 rounded-xl text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        navItems={navItems}
        activeSection={activeSection}
        onNavItemClick={handleNavClick}
      />
    </nav>
  );
};

export default Navbar;
