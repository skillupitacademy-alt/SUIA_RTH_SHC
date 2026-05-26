'use client';

import React from 'react';
import { Sparkles, ArrowRight, Download } from 'lucide-react';
import { useBrand, useMarketingContent } from '@quiz/marketing-site';
import { trackLead } from '@quiz/marketing-site/lib/tracking';
import { HeroStat } from './types';
import { CTAButtons } from './types';

interface HeroContentProps {
  title: string;
  subtitle?: string;
  description: string;
  subDescription?: string;
  badgeText: string;
  courseTitle?: string;
  stats: HeroStat[];
  ctaButtons?: CTAButtons;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  title,
  subtitle,
  description,
  subDescription,
  badgeText,
  courseTitle,
  stats,
  ctaButtons,
}) => {
  const brand = useBrand();
  const { contact } = useMarketingContent();

  const handleEnrollClick = () => {
    const name = courseTitle || title;
    trackLead(name, 'Hero Section - Enroll Now');
    const message =
      `Hi ${brand.name}! 👋\n\n` +
      `I'm interested in enrolling in the *${name}* course.\n\n` +
      `📌 *Enroll Now – Limited Seats*\n\n` +
      `Could you please share the next batch details, fee structure, and enrollment process?\n\n` +
      `Thank you!`;
    const whatsappUrl = `https://wa.me/${contact.config.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCurriculumClick = () => {
    const name = courseTitle || title;
    trackLead(name, 'Hero Section - Explore Curriculum');
    const message =
      `Hi ${brand.name}! 👋\n\n` +
      `I'd like to explore the full curriculum for the *${name}* course.\n\n` +
      `📚 *Explore Full Curriculum*\n\n` +
      `Could you please share the detailed syllabus, topics covered, and course duration?\n\n` +
      `Thank you!`;
    const whatsappUrl = `https://wa.me/${contact.config.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-start gap-8 lg:text-left text-center">

      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-bold shadow-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 5%, transparent)',
          borderColor: 'color-mix(in srgb, var(--brand-secondary) 30%, transparent)',
          color: 'var(--brand-secondary)',
        }}
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>{badgeText}</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
          <span style={{ color: 'var(--brand-secondary)' }}>{title}</span>
          {subtitle && (
            <>
              {' '}
              <span className="text-[var(--brand-primary)]">{subtitle}</span>
            </>
          )}
        </h1>
      </div>

      {/* Description */}
      <div className="max-w-3xl">
        <p className="text-lg md:text-xl text-[#5f6368] leading-relaxed">
          {description}
        </p>
        {subDescription && (
          <p className="mt-2 text-base md:text-lg text-[#5f6368] opacity-80 leading-relaxed">
            {subDescription}
          </p>
        )}
      </div>

      {/* Inline Stats Row */}
      <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:flex sm:flex-row w-full py-4 sm:divide-x divide-gray-200 sm:gap-0">
        {stats.map((stat, idx) => (
          <div key={idx} className={`flex flex-col items-center lg:items-start flex-1 ${idx === 0 ? 'sm:pr-6 lg:pr-8' : idx === stats.length - 1 ? 'sm:pl-6 lg:pl-8' : 'sm:px-6 lg:px-8'}`}>
            <span className="text-2xl lg:text-3xl font-bold" style={{ color: idx % 2 === 0 ? 'var(--brand-primary)' : 'var(--brand-secondary)' }}>
              {stat.value}
            </span>
            <span className="text-sm font-medium text-[#5f6368] mt-2 whitespace-nowrap">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 w-full">
        <button
          onClick={handleEnrollClick}
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-md hover:shadow-xl w-full sm:w-auto"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {ctaButtons?.primary || 'Enroll Now'}
          <ArrowRight className="w-5 h-5" />
        </button>

        {ctaButtons?.secondary && (
          <button
            onClick={handleCurriculumClick}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold border transition-all duration-300 hover:bg-gray-50 bg-white w-full sm:w-auto"
            style={{
              color: 'var(--brand-secondary)',
              borderColor: 'var(--brand-secondary)',
            }}
          >
            {ctaButtons.secondary}
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>


    </div>
  );
};
