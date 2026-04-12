'use client';

import { useBrand } from '../context/BrandContext';
import { educationLevels } from '../models/onboardingSession';

interface ProfileStepProps {
  fullName: string;
  educationLevel: string;
  status: 'student' | 'professional';
  onChange: (field: string, value: string) => void;
}

export function ProfileStep({
  fullName,
  educationLevel,
  status,
  onChange
}: ProfileStepProps) {
  const brand = useBrand();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">
          Tell us a bit about yourself
        </h1>
        <p className="text-slate-600">
          This helps us personalize your learning experience
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-current transition-colors"
            style={{
              borderColor: fullName ? brand.primaryColor : undefined
            }}
          />
        </div>

        {/* Education Level */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Education Level
          </label>
          <select
            value={educationLevel}
            onChange={(e) => onChange('educationLevel', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-current transition-colors appearance-none bg-white cursor-pointer"
            style={{
              borderColor: educationLevel ? brand.primaryColor : undefined
            }}
          >
            <option value="">Select your education level</option>
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Status Toggle */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Current Status
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => onChange('status', 'student')}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold border-2 transition-all ${
                status === 'student'
                  ? 'text-white shadow-lg'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={{
                backgroundColor: status === 'student' ? brand.primaryColor : undefined,
                borderColor: status === 'student' ? brand.primaryColor : undefined
              }}
            >
              Student
            </button>
            <button
              onClick={() => onChange('status', 'professional')}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold border-2 transition-all ${
                status === 'professional'
                  ? 'text-white shadow-lg'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={{
                backgroundColor: status === 'professional' ? brand.primaryColor : undefined,
                borderColor: status === 'professional' ? brand.primaryColor : undefined
              }}
            >
              Working Professional
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
