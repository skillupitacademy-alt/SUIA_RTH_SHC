import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface CareerPathItem {
  id: string;
  role: string;
  description: string;
  skillLevel: 'entry' | 'mid' | 'senior';
  salaryRange?: string;
  icon: string;
}

interface RealLifeCareerPathProps {
  title: string;
  careerPaths: CareerPathItem[];
  industryDemand: string;
  futureGrowth: string;
}

/**
 * Real Life Career Path Component
 * Renderer: career_path_card
 * Layout Template: career_journey_panel
 * Purpose: Career relevance and professional growth paths
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeCareerPath({
  title,
  careerPaths,
  industryDemand,
  futureGrowth
}: RealLifeCareerPathProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Briefcase;
    return IconComponent;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'entry':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100' };
      case 'mid':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100' };
      case 'senior':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', badge: 'bg-gray-100' };
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Career Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {careerPaths.map((path) => {
          const IconComponent = getIcon(path.icon);
          const colors = getLevelColor(path.skillLevel);

          return (
            <div
              key={path.id}
              className={`${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer`}
            >
              {/* Icon */}
              <div className="mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm">
                  <IconComponent
                    size={24}
                    style={{ color: brand.primaryColor }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Role */}
              <h3 className={`text-lg font-bold ${colors.text} mb-3`}>
                {path.role}
              </h3>

              {/* Description */}
              <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
                {path.description}
              </p>

              {/* Level Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.badge} ${colors.text}`}>
                  {path.skillLevel}
                </span>
                {path.salaryRange && (
                  <span className="text-xs font-bold text-slate-600">
                    {path.salaryRange}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Industry Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry Demand */}
        <div
          className="p-6 rounded-xl border-l-4"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <div className="flex items-start gap-3">
            <Icons.TrendingUp
              size={20}
              className="shrink-0 mt-0.5"
              style={{ color: brand.primaryColorDark }}
              aria-hidden="true"
            />
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
                Industry Demand
              </h4>
              <p className="text-base font-medium text-slate-800 leading-relaxed">
                {industryDemand}
              </p>
            </div>
          </div>
        </div>

        {/* Future Growth */}
        <div
          className="p-6 rounded-xl border-l-4"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <div className="flex items-start gap-3">
            <Icons.Rocket
              size={20}
              className="shrink-0 mt-0.5"
              style={{ color: brand.primaryColorDark }}
              aria-hidden="true"
            />
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
                Future Growth
              </h4>
              <p className="text-base font-medium text-slate-800 leading-relaxed">
                {futureGrowth}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
