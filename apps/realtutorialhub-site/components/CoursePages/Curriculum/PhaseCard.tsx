'use client';

import React from 'react';
import { getLucideIcon } from './lucideIconsMapper';
import { getColorClasses, getDotColor } from './curriculumUtils';
import { CurriculumPhase } from '@/lib/CoursesCardData';

interface PhaseCardProps {
  phase: CurriculumPhase;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  const IconComponent = getLucideIcon(phase.icon);

  return (
    <div className="rounded-2xl border-2 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white" style={{ borderColor: `var(--color-${phase.borderColor.replace('border-', '')})` }}>
      <div className="relative">
        <div className={` p-6 ${phase.bgColor}`}>
          <div className='absolute right-5 top-2'>
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full text-[8px] sm:text-[10px] md:text-sm font-bold shadow-md">
              {phase.duration}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${phase.gradient}`}>
              <IconComponent className="w-4 h-4 md:w-7 md:h-7 text-white" />
            </div>
            <div className='border border-transparent'>
              <h3 className="text-[13px] md:text-2xl font-bold text-gray-900">{phase.title}</h3>
              <h4 className="text-[17px] md:text-xl font-semibold" style={{ color: `var(--color-${phase.borderColor.replace('border-', '').replace('-200', '-700')})` }}>
                {phase.subtitle}
              </h4>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {phase.topics.map((topic, idx) => (
          <div key={idx}>
            <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getDotColor(topic.color)}`}></div>
              {topic.title}
            </h5>
            <ul className="space-y-2 pl-6 text-gray-700 text-[14px] md:text-[18px]">
              {topic.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2">
                  <span className={`mt-1 ${getDotColor(topic.color)}`}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="border-t pt-4">
          <h5 className="font-bold text-gray-800 mb-3 text-[14px] md:text-[18px]">Projects:</h5>
          <div className="space-y-3">
            {phase.projects.map((project, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${getColorClasses(project.color)}`}>
                <div className="font-semibold text-[14px] md:text-[18px]" style={{ color: `var(--color-${project.color}-700)` }}>
                  {project.title}
                </div>
                <div className="text-gray-700 text-[14px] md:text-[18px]">{project.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};