'use client';

import React, { useEffect, useState } from 'react';
import { BackgroundEffects } from './BackgroundEffects';
import { FloatingIcons } from './FloatingIcons';
import { HeroContent } from './HeroContent';
import { HeroFeatures } from './HeroFeature';
import { HeroCTA } from './HeroCTA';
import { HeroStats } from './HeroStats';
import { HeroSectionProps } from '@/lib/CoursesCardData';
import { getIcon } from '@/lib/CoursesCardData';

// Import Lucide icons for display
import { 
  Brain, TrendingUp, Award, DollarSign, 
  Users, Code, Target, Zap,
  Database, BarChart3, Sparkles 
} from 'lucide-react';

interface CourseHeroSectionProps extends HeroSectionProps {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroSubDescription?: string;
}

export const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({
  id,
  title,
  heroTitle,
  heroSubtitle,
  description,
  heroDescription,
  heroSubDescription,
  features = [],
  companies = [],
  ctaButtons,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Map features from strings to objects with icons
  const featureItems = [
    { icon: Users, text: 'Live Interactive Classes' },
    { icon: Code, text: 'Hands-on Coding Sessions' },
    { icon: Target, text: 'Industry-Ready Curriculum' },
    { icon: Zap, text: 'Lifetime Access & Support' },
  ];

  // Stats data
  const stats = [
    { value: '600-700', label: 'Learning Hours', icon: Brain },
    { value: '15+', label: 'Real Projects', icon: Code },
    { value: '90%', label: 'Placement Rate', icon: TrendingUp },
    { value: '12-25 LPA', label: 'Average Salary', icon: DollarSign },
  ];

  // Floating icons
  const floatingIcons = [
    { Icon: Database, top: '15%', left: '10%', delay: 0 },
    { Icon: BarChart3, top: '25%', right: '15%', delay: 0.5 },
    { Icon: Brain, top: '65%', left: '8%', delay: 1 },
    { Icon: Sparkles, top: '70%', right: '12%', delay: 1.5 },
  ];

  return (
    <div id='CourseHero' className="relative min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 overflow-hidden">
      <BackgroundEffects mousePosition={mousePosition} />
      <FloatingIcons icons={floatingIcons} />
      
      <div className="relative z-10 container mx-auto px-6 py-30">
        <HeroContent
          title={heroTitle || title}
          subtitle={heroSubtitle}
          description={heroDescription || description}
          subDescription={heroSubDescription}
          badgeText="6-8 Month Intensive Bootcamp • 100% Job-Ready"
        />

        <HeroFeatures features={featureItems} />
        
        {ctaButtons && (
          <HeroCTA buttons={ctaButtons} />
        )}
        
        <HeroStats stats={stats} />

        {/* Trust Indicators */}
        {companies.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-white/60 text-sm mb-4">Trusted by students from</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {companies.map((company, idx) => (
                <div
                  key={idx}
                  className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <span className="text-white/70 font-semibold text-lg">{company}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};