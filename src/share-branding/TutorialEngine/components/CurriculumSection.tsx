import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Users, Lightbulb, Code, Terminal, Bot, CheckCircle } from 'lucide-react';

interface CurriculumBlock {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  bgColor: string;
  borderColor: string;
  content: string;
  viewed: boolean;
}

interface CurriculumSectionProps {
  onViewChange: (id: string, viewed: boolean) => void;
  
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({ onViewChange }) => {
  const brandConfig = useBrand();

  const [blocks, setBlocks] = useState<CurriculumBlock[]>([
    {
      id: 'notes',
      title: 'Notes',
      icon: BookOpen,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      content:
        'Component architecture is the foundation of React development. It involves breaking down your UI into reusable, self-contained pieces called components. Each component manages its own state and can be composed together to build complex interfaces.',
      viewed: false,
    },
    {
      id: 'layman',
      title: 'Layman Explanation',
      icon: Users,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      content:
        'Think of React components like LEGO blocks. Each block is a separate piece that does one thing well. You can snap them together in different ways to build whatever you want. Just like LEGO, you can reuse the same blocks in different parts of your creation!',
      viewed: false,
    },
    {
      id: 'reallife',
      title: 'Real Life Example',
      icon: Lightbulb,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      content:
        "Imagine you're building a social media feed. Instead of writing all the code in one giant file, you create separate components: a Post component (shows one post), a CommentList component (shows comments), and a LikeButton component. Now you can use these components anywhere in your app!",
      viewed: false,
    },
    {
      id: 'technical',
      title: 'Technical Deep Dive',
      icon: Terminal,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      content:
        'Components are JavaScript functions or classes that return JSX. They encapsulate state, props, and lifecycle logic. The component tree forms a unidirectional data flow where parent components pass props down to children. State updates trigger re-renders through the reconciliation algorithm.',
      viewed: false,
    },
    {
      id: 'code',
      title: 'Code Example',
      icon: Code,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      content: `function UserCard({ name, email }) {
  const [isFollowing, setIsFollowing] = useState(false);
  
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
      <button onClick={() => setIsFollowing(!isFollowing)}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  );
}`,
      viewed: false,
    },
    {
      id: 'ai-tutor',
      title: brandConfig.tutorLabel + ' Brief',
      icon: Bot,
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      content:
        'Key concepts to master: 1) Component composition - building complex UIs from simple parts, 2) Props for data flow, 3) State for interactivity, 4) Reusability patterns. Practice by identifying reusable parts in existing websites and imagining how you would componentize them.',
      viewed: false,
    },
  ]);

  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const viewTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const blockId = entry.target.getAttribute('data-block-id');
          if (!blockId) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            // Start timer for 3 seconds
            viewTimers.current[blockId] = setTimeout(() => {
              setBlocks((prev) =>
                prev.map((block) =>
                  block.id === blockId ? { ...block, viewed: true } : block
                )
              );
              onViewChange(blockId, true);
            }, 3000);
          } else {
            // Clear timer if user scrolls away
            if (viewTimers.current[blockId]) {
              clearTimeout(viewTimers.current[blockId]);
              delete viewTimers.current[blockId];
            }
          }
        });
      },
      { threshold: 0.8 }
    );

    Object.values(blockRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
      Object.values(viewTimers.current).forEach(clearTimeout);
    };
  }, [onViewChange]);

  return (
    <div className="space-y-4">
      <h2
        className="text-2xl font-bold text-gray-800 mb-6"
        style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}
      >
        Curriculum Sections
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.id}
              ref={(el) => { blockRefs.current[block.id] = el; }}
              data-block-id={block.id}
              className={`rounded-lg p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.10)] ${block.bgColor} border ${block.borderColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200"
                  >
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {block.title}
                  </h3>
                </div>
                {block.viewed && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-gray-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Viewed
                    </span>
                  </div>
                )}
              </div>

              <div
                className="text-sm text-gray-700 leading-relaxed"
                style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.7' }}
              >
                {block.id === 'code' ? (
                  <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
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