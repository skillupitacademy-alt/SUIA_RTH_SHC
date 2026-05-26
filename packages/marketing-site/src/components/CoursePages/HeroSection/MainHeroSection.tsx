'use client';

import React, { useEffect, useState } from 'react';
import { BackgroundEffects } from './BackgroundEffects';
import { FloatingIcons } from './FloatingIcons';
import { HeroContent } from './HeroContent';
import { HeroFeatures } from './HeroFeature';
import { HeroCTA } from './HeroCTA';
import { HeroStats } from './HeroStats';
import { HeroSectionProps } from '@quiz/marketing-site/lib/CoursesCardData';
import { getIcon } from '@quiz/marketing-site/lib/CoursesCardData';

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
    { value: '1:1', label: 'Expert Mentorship', icon: Users },
    { value: '3,000+', label: 'Learners Trained', icon: Target },
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
    <div
      id='CourseHero'
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      <BackgroundEffects mousePosition={mousePosition} />

      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 xl:px-20 pt-16 lg:pt-20 pb-20 lg:pb-32">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-8 mb-16">

          {/* 70% Left Column - Content */}
          <div className="w-full lg:w-[70%]">
            <HeroContent
              title={heroTitle || title}
              subtitle={heroSubtitle}
              description={heroDescription || description}
              subDescription={heroSubDescription}
              badgeText="12 Months Intensive Bootcamp • 100% Job-Ready"
              courseTitle={heroTitle || title}
              stats={stats.slice(0, 4)}
              ctaButtons={ctaButtons}
            />
          </div>

          {/* 30% Right Column - Square Feature Cards Grid */}
          <div className="w-full lg:w-[30%] flex justify-center lg:justify-end">
            <HeroFeatures features={featureItems} stats={stats.slice(4)} />
          </div>

        </div>
      </div>
    </div>
  );
};
