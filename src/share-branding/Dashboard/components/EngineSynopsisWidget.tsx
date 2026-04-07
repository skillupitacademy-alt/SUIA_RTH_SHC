import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { CheckCircle2, Circle } from 'lucide-react';

const engineSteps = [
  { label: 'Diagnostic', completed: true },
  { label: 'Analysis', completed: true },
  { label: 'Tutor', completed: true },
  { label: 'Code', completed: false },
  { label: 'Master', completed: false },
  { label: 'Certify', completed: false },
];

export function EngineSynopsisWidget() {
  const brand = useBrand();

  return (
    <div className="rounded-[2rem] p-6 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Engine Progress</h3>
      
      <div className="flex items-center justify-between gap-2">
        {engineSteps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step.completed
                    ? 'shadow-md'
                    : 'bg-gray-100 border-2 border-gray-200'
                }`}
                style={
                  step.completed
                    ? { backgroundColor: brand.primaryColor }
                    : undefined
                }
              >
                {step.completed ? (
                  <CheckCircle2 className="text-white" size={20} />
                ) : (
                  <Circle className="text-gray-400" size={20} />
                )}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step.completed ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < engineSteps.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${
                  step.completed ? '' : 'bg-gray-200'
                }`}
                style={
                  step.completed
                    ? { backgroundColor: brand.primaryColor, opacity: 0.3 }
                    : undefined
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}