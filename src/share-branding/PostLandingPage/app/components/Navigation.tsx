"use client";

import { useState } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import Link from 'next/link';

export function Navigation() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${brand.gradientFrom} ${brand.gradientTo} rounded-lg flex items-center justify-center`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-2xl font-bold bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} bg-clip-text text-transparent`}>
              {brand.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#paths" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors font-medium`}>
              Paths
            </a>
            <a href="#mentorship" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors font-medium`}>
              Mentorship
            </a>
            <a href="#projects" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors font-medium`}>
              Projects
            </a>
            <a href="#pricing" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors font-medium`}>
              Pricing
            </a>
            <button className={`px-6 py-2.5 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} text-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300`}>
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-2 border-t border-gray-200 mt-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <a href="#paths" onClick={() => setIsMobileMenuOpen(false)} className={`text-gray-600 hover:text-${accentClass}-600 font-medium px-2 py-1`}>
              Paths
            </a>
            <a href="#mentorship" onClick={() => setIsMobileMenuOpen(false)} className={`text-gray-600 hover:text-${accentClass}-600 font-medium px-2 py-1`}>
              Mentorship
            </a>
            <a href="#projects" onClick={() => setIsMobileMenuOpen(false)} className={`text-gray-600 hover:text-${accentClass}-600 font-medium px-2 py-1`}>
              Projects
            </a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className={`text-gray-600 hover:text-${accentClass}-600 font-medium px-2 py-1`}>
              Pricing
            </a>
            <button className={`w-full mt-2 px-6 py-3 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} text-white rounded-lg shadow-md active:scale-95 transition-all duration-200 font-semibold`}>
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}