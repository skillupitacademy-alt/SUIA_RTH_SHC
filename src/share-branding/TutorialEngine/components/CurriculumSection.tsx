import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Users, Lightbulb, Code, Terminal, Bot, CheckCircle } from 'lucide-react';
import { useTutorialData } from './TutorialDataContext';

interface CurriculumSectionProps {
  onViewChange: (id: string, viewed: boolean) => void;
}

const toneStyles = {
  notes: { bgColor: 'bg-amber-50', icon: BookOpen },
  layman: { bgColor: 'bg-blue-50', icon: Users },
  example: { bgColor: 'bg-green-50', icon: Lightbulb },
  technical: { bgColor: 'bg-purple-50', icon: Terminal },
  code: { bgColor: 'bg-slate-50', icon: Code },
  tutor: { bgColor: 'bg-cyan-50', icon: Bot },
} as const;

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({ onViewChange }) => {
  const data = useTutorialData();
  const [viewedBlocks, setViewedBlocks] = useState<Record<string, boolean>>({});
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const viewTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const blockId = entry.target.getAttribute('data-block-id');
          if (!blockId) {
            return;
          }

          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            viewTimers.current[blockId] = setTimeout(() => {
              setViewedBlocks((prev) => ({ ...prev, [blockId]: true }));
              onViewChange(blockId, true);
            }, 3000);
          } else if (viewTimers.current[blockId]) {
            clearTimeout(viewTimers.current[blockId]);
            delete viewTimers.current[blockId];
          }
        });
      },
      { threshold: 0.8 }
    );

    Object.values(blockRefs.current).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      observer.disconnect();
      Object.values(viewTimers.current).forEach(clearTimeout);
    };
  }, [onViewChange]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <h2 className="mb-6 break-words text-2xl font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}>
        {data.curriculum.title}
      </h2>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4">
        {data.curriculum.blocks.map((block) => {
          const style = toneStyles[block.tone];
          const Icon = style.icon;
          const viewed = Boolean(viewedBlocks[block.id]);

          return (
            <div
              key={block.id}
              ref={(el) => { blockRefs.current[block.id] = el; }}
              data-block-id={block.id}
              className={`relative w-full min-w-0 overflow-hidden rounded-lg p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] sm:p-6 ${style.bgColor}`}
            >
              <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <h3 className="min-w-0 break-words font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {block.title}
                  </h3>
                </div>
                {viewed && (
                  <div className="flex max-w-full shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Viewed
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 break-words text-sm leading-relaxed text-gray-700" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.7' }}>
                {block.tone === 'code' ? (
                  <pre tabIndex={0} aria-label="Code example" className="max-w-full overflow-x-auto rounded-lg bg-gray-800 p-4 text-xs text-green-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">
                    <code>{block.content}</code>
                  </pre>
                ) : (
                  block.content
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
