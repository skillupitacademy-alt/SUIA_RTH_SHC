import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { Code2, BarChart3, Cloud, Brain, ShieldCheck, Database } from 'lucide-react';

export function MyDomainsGrid() {
  const brand = useBrand();
  const { myDomains } = useTutorialDashboardData();

  const getDomainIcon = (title: string) => {
    if (title.includes('Full Stack')) return { Icon: Code2, color: '#9a3412', bg: '#fff7ed' }; // darker orange
    if (title.includes('Data Science')) return { Icon: BarChart3, color: '#1e40af', bg: '#eff6ff' }; // darker blue
    if (title.includes('Engineering')) return { Icon: Database, color: '#166534', bg: '#f0fdf4' }; // darker green
    if (title.includes('DevOps')) return { Icon: Cloud, color: '#5b21b6', bg: '#f5f3ff' }; // darker purple
    if (title.includes('AI')) return { Icon: Brain, color: '#854d0e', bg: '#fefce8' }; // darker yellow
    if (title.includes('Cyber')) return { Icon: ShieldCheck, color: '#991b1b', bg: '#fef2f2' }; // darker red
    return { Icon: Code2, color: brand.primaryColor, bg: `${brand.primaryColor}1A` };
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'Beginner': return { text: '#9d174d', bg: '#fdf2f8' }; // darker pink
      case 'Intermediate': return { text: '#1e40af', bg: '#eff6ff' }; // darker blue
      case 'Advanced': return { text: '#9a3412', bg: '#fff7ed' }; // darker orange
      default: return { text: brand.accentColor === 'orange' ? '#b43a00' : '#be185d', bg: 'rgba(0,0,0,0.05)' };
    }
  };

  return (
    <div 
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">My Domains</h3>
        <button 
          aria-label="View all learning domains"
          className="text-xs font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 flex-1">
        {myDomains.items.map((domain) => {
          const { Icon, color, bg } = getDomainIcon(domain.title);
          const badge = getBadgeColor(domain.skillLevel);

          return (
            <div 
              key={domain.id} 
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-5 text-center transition-transform duration-300 hover:-translate-y-1"
              style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
            >
              <div 
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" 
                style={{ backgroundColor: bg, color: color }}
              >
                <Icon size={24} />
              </div>
              
              <h4 className="mb-1 text-sm font-bold text-gray-900 leading-tight">{domain.title}</h4>
              <p className="mb-4 text-[11px] font-semibold text-gray-700">{domain.percent}% Complete</p>
              
              <span 
                className="mb-3 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {domain.skillLevel}
              </span>
              
              <p className="text-xs font-bold text-gray-600">
                {domain.completedSubjects}/{domain.totalSubjects} Subjects
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
