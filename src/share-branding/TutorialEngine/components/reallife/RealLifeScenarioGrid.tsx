import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface ScenarioCard {
  id: string;
  domain: string;
  title: string;
  description: string;
  application: string;
  icon: string;
}

interface RealLifeScenarioGridProps {
  title: string;
  scenarios: ScenarioCard[];
}

/**
 * Real Life Scenario Grid Component
 * Renderer: scenario_grid
 * Layout Template: multi_case_dashboard
 * Purpose: Domain-specific scenario examples grid
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeScenarioGrid({
  title,
  scenarios
}: RealLifeScenarioGridProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Box;
    return IconComponent;
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, { bg: string; border: string; icon: string }> = {
      'e-commerce': { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
      'healthcare': { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
      'finance': { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
      'education': { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
      'entertainment': { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600' },
      'social-media': { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600' },
      'default': { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600' }
    };
    return colors[domain.toLowerCase()] || colors['default'];
  };

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const IconComponent = getIcon(scenario.icon);
          const colors = getDomainColor(scenario.domain);

          return (
            <div
              key={scenario.id}
              className={`${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer`}
            >
              {/* Icon & Domain */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <IconComponent
                    size={24}
                    className={colors.icon}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {scenario.domain}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-950 mb-3">
                {scenario.title}
              </h3>

              {/* Description */}
              <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
                {scenario.description}
              </p>

              {/* Application */}
              <div
                className="p-3 rounded-lg border-l-4"
                style={{
                  backgroundColor: `${brand.primaryColor}08`,
                  borderLeftColor: brand.primaryColor
                }}
              >
                <h4 className="text-xs font-bold mb-1" style={{ color: brand.primaryColorDark }}>
                  Application
                </h4>
                <p className="text-sm font-medium text-slate-800">
                  {scenario.application}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
