'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { getLucideIcon } from './lucideIconsMapper';
import { PhaseCard } from './PhaseCard';
import { ProjectCard } from './ProjectCard';
import { TechStackSection } from './TechStackSection';
import { CareerOutcomes } from './CareerOutcomes';
import { CurriculumData } from '@/lib/CoursesCardData';

interface CurriculumAccordionProps {
  data: CurriculumData;
  openSections: number[];
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  toggleSection: (index: number) => void;
}

export const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({
  data,
  openSections,
  sectionRefs,
  toggleSection
}) => {
  const [contentHeights, setContentHeights] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Function to update all content heights
  const updateContentHeights = useCallback(() => {
    const newHeights = contentRefs.current.map((ref, index) => {
      if (!ref) return 0;

      if (openSections.includes(index)) {
        return ref.scrollHeight + 50;
      }
      return 0;
    });
    setContentHeights(newHeights);
  }, [openSections]);

  // Update heights when sections open/close
  useEffect(() => {
    const timer = setTimeout(updateContentHeights, 50);
    return () => clearTimeout(timer);
  }, [openSections, updateContentHeights]);

  // Listen for window resize
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;

    const handleResize = () => {
      setIsResizing(true);
      clearTimeout(resizeTimer);
      updateContentHeights();

      resizeTimer = setTimeout(() => {
        setIsResizing(false);
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    const initTimer = setTimeout(updateContentHeights, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      clearTimeout(initTimer);
    };
  }, [updateContentHeights]);

  // Listen for content size changes
  useEffect(() => {
    const observers: ResizeObserver[] = [];

    contentRefs.current.forEach((ref, index) => {
      if (!ref || !openSections.includes(index)) return;

      const observer = new ResizeObserver(() => {
        setContentHeights(prev => {
          const newHeights = [...prev];
          if (ref && openSections.includes(index)) {
            newHeights[index] = ref.scrollHeight + 50;
          }
          return newHeights;
        });
      });

      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach(observer => observer.disconnect());
  }, [openSections]);

  const sections = [
    {
      id: 0,
      title: 'Learning Phases',
      subtitle: '6 structured phases • From Java fundamentals to AI & DevOps',
      icon: 'Layers',
      bgColor: 'bg-gradient-to-br from-blue-200 to-indigo-200',
      borderColor: 'border-blue-300',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {data.phases.map(phase => (
            <PhaseCard key={phase.id} phase={phase} />
          ))}
        </div>
      )
    },
    {
      id: 1,
      title: 'Portfolio Projects',
      subtitle: '15+ production-grade projects • AI-powered apps • Deployed live',
      icon: 'Briefcase',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderColor: 'border-green-300',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )
    },
    {
      id: 2,
      title: 'Tools & Technologies',
      subtitle: 'Java • Spring Boot • React • Docker • AWS • OpenAI • RAG',
      icon: 'Wrench',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
      borderColor: 'border-orange-300',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      content: (
        <div className="space-y-6 md:space-y-8">
          {data.techStack.map((stack, idx) => (
            <TechStackSection key={idx} {...stack} />
          ))}
        </div>
      )
    },
    {
      id: 3,
      title: 'Career Outcomes',
      subtitle: 'Job-ready skills • Portfolio • Industry connections',
      icon: 'Target',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50',
      borderColor: 'border-red-300',
      iconBg: 'bg-gradient-to-br from-red-500 to-orange-600',
      content: (
        <CareerOutcomes
          outcomes={data.careerOutcomes}
          capstoneData={data.capstoneData}
          interviewPrep={data.interviewPrep}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const IconComponent = getLucideIcon(section.icon);
        const isOpen = openSections.includes(index);

        return (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}

            className={`rounded-3xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${isOpen ? section.borderColor : 'border-gray-200'
              }`}
          >
            <button
              onClick={() => toggleSection(index)}
              className={`w-full p-4 md:p-8 flex justify-between items-center text-left ${section.bgColor}`}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`p-4 rounded-2xl ${section.iconBg} text-white`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-bold">{section.title}</h2>
                  <p className="text-gray-600">{section.subtitle}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            <div
              ref={(el) => {
                contentRefs.current[index] = el;
              }}

              className="overflow-hidden transition-all duration-500"
              style={{
                maxHeight: isOpen
                  ? isResizing
                    ? 'none'
                    : `${contentHeights[index] || 0}px`
                  : '0px',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="p-4 md:p-8">{section.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
