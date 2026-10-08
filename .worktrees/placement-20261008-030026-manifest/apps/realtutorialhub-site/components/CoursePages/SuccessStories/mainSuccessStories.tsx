'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { SuccessStoriesHeader } from './SuccessStoriesHeader';
import { SuccessStoryCard } from './SuccessStoryCard';
import { SuccessStoriesData } from '@/lib/CoursesCardData';

interface SuccessStoriesProps {
  id: string;
  data: SuccessStoriesData;
}

export default function SuccessStories({ id, data }: SuccessStoriesProps) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  return (
    <section id={id} className="py-16 px-4 md:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <SuccessStoriesHeader 
          title={data.title} 
          description={data.description} 
        />

        {/* Success Stories Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {data.stories.map((story) => (
            <SuccessStoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}