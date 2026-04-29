import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { Code2, BarChart3, Cloud, Brain, ShieldCheck, Database } from 'lucide-react';

export function MyDomainsGrid() {
  const brand = useBrand();
  const { myDomains } = useTutorialDashboardData();

  const getDomainIcon = (title: string) => {
    if (title.includes('Full Stack')) return { Icon: Code2, color: '#f97316', bg: '#fff7ed' }; // orange
    if (title.includes('Data Science')) return { Icon: BarChart3, color: '#3b82f6', bg: '#eff6ff' }; // blue
    if (title.includes('Engineering')) return { Icon: Database, color: '#22c55e', bg: '#f0fdf4' }; // green
    if (title.includes('DevOps')) return { Icon: Cloud, color: '#8b5cf6', bg: '#f5f3ff' }; // purple
    if (title.includes('AI')) return { Icon: Brain, color: '#eab308', bg: '#fefce8' }; // yellow
    if (title.includes('Cyber')) return { Icon: ShieldCheck, color: '#ef4444', bg: '#fef2f2' }; // red
    return { Icon: Code2, color: brand.primaryColor, bg: `${brand.primaryColor}1A` };
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'Beginner': return { text: '#ec4899', bg: '#fdf2f8' }; // pink
      case 'Intermediate': return { text: '#3b82f6', bg: '#eff6ff' }; // blue
      case 'Advanced': return { text: '#f97316', bg: '#fff7ed' }; // orange
      default: return { text: brand.primaryColor, bg: `${brand.primaryColor}1A` };
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">My Domains</h3>
        <button className="text-xs font-bold hover:underline" style={{ color: brand.primaryColor }}>
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 flex-1">
        {myDomains.items.map((domain) => {
          const { Icon, color, bg } = getDomainIcon(domain.title);
          const badge = getBadgeColor(domain.skillLevel);

          return (
            <div key={domain.id} className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-5 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-md">
              <div 
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" 
                style={{ backgroundColor: bg, color: color }}
              >
                <Icon size={24} />
              </div>
              
              <h4 className="mb-1 text-sm font-bold text-gray-900 leading-tight">{domain.title}</h4>
              <p className="mb-4 text-[11px] font-semibold text-gray-500">{domain.percent}% Complete</p>
              
              <span 
                className="mb-3 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {domain.skillLevel}
              </span>
              
              <p className="text-xs font-bold text-gray-400">
                {domain.completedSubjects}/{domain.totalSubjects} Subjects
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
