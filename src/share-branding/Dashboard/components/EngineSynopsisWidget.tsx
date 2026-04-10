import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { CheckCircle2, Circle } from 'lucide-react';
import { useDashboardData } from './DashboardDataContext';

export function EngineSynopsisWidget() {
  const brand = useBrand();
  const { engineProgress } = useDashboardData();
  const engineSteps = engineProgress.steps;

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gray-900">{engineProgress.title}</h3>

      <div className="grid grid-cols-2 gap-4 sm:hidden">
        {engineSteps.map((step, index) => (
          <div key={index} className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                step.completed ? 'shadow-md' : 'border-2 border-gray-200 bg-white'
              }`}
              style={step.completed ? { backgroundColor: brand.primaryColor } : undefined}
            >
              {step.completed ? <CheckCircle2 className="text-white" size={20} /> : <Circle className="text-gray-500" size={20} />}
            </div>
            <span className={`min-w-0 break-words text-sm font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-600'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden items-start justify-between gap-1 md:gap-2 sm:flex">
        {engineSteps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  step.completed ? 'shadow-md' : 'border-2 border-gray-200 bg-gray-100'
                }`}
                style={step.completed ? { backgroundColor: brand.primaryColor } : undefined}
              >
                {step.completed ? <CheckCircle2 className="text-white" size={20} /> : <Circle className="text-gray-500" size={20} />}
              </div>
              <span className={`max-w-[64px] break-words text-center text-[10px] leading-tight md:max-w-[72px] md:text-[11px] lg:max-w-none lg:text-xs ${step.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
            {index < engineSteps.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${step.completed ? '' : 'bg-gray-200'}`}
                style={step.completed ? { backgroundColor: brand.primaryColor, opacity: 0.3 } : undefined}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
