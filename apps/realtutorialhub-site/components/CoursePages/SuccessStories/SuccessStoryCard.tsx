'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';
import { getLucideIcon } from './lucideIconsMapper';
import { SuccessStory } from '@/lib/CoursesCardData';

interface SuccessStoryCardProps {
  story: SuccessStory;
}

export const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({ story }) => {
  const IconComponent = getLucideIcon(story.icon);

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={story.id * 120}
      data-aos-duration="700"
      data-aos-once="false"
      className={`${story.colorClass} rounded-2xl p-6 border-2 transition-all duration-300 shadow-xl hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{story.name}</h3>
          <p className="text-gray-700 font-medium">{story.role}</p>
        </div>
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <IconComponent className="w-6 h-6" />
        </div>
      </div>

      <blockquote className="text-gray-600 italic mb-6 border-l-4 border-gray-300 pl-4 py-1">
        "{story.quote}"
      </blockquote>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">{story.achievement}</span>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
          {story.salary && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-bold text-gray-900">{story.salary}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-600">{story.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};