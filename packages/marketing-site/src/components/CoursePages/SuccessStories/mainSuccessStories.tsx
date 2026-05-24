'use client';

import React from 'react';
import { SectionHeader } from '@quiz/marketing-site/components/CommonHeader/SectionHeader';
import TestimonialGrid from '@quiz/marketing-site/components/testimonials/TestimonialGrid';
import { TESTIMONIALS_DATA, TESTIMONIAL_CONFIG } from '@quiz/marketing-site/lib/Testimonial';

interface SuccessStoriesProps {
  id: string;
}

export default function SuccessStories({ id }: SuccessStoriesProps) {
  return (
    <section id={id} className="py-16 px-4 md:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="Student Success Stories"
          description={TESTIMONIAL_CONFIG.description}
        />
        <TestimonialGrid testimonials={TESTIMONIALS_DATA} />
      </div>
    </section>
  );
}