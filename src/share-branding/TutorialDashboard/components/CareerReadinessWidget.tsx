import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { FileText, Target, Briefcase, Award, ArrowRight } from 'lucide-react';

export function CareerReadinessWidget() {
  const brand = useBrand();
  const { career } = useTutorialDashboardData();

  return (
    <div 
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">Career Readiness</h3>
        <button 
          aria-label="View all career readiness details"
          className="text-xs font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 flex-1">
        
        {/* Resume Score */}
        <div                             className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center transition-transform duration-300 hover:-translate-y-1"
              style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}>
          <FileText className="mb-2 text-green-700" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Resume Score</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.resumeScore}%</span>
          <span className="text-xs font-bold text-green-700">{career.resumeStatus}</span>
        </div>

        {/* Skills Match */}
        <div                             className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center transition-transform duration-300 hover:-translate-y-1"
              style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}>
          <Target className="mb-2 text-blue-700" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Skills Match</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.skillsMatch}%</span>
          <span className="text-xs font-bold text-blue-700">{career.skillsStatus}</span>
        </div>

        {/* Job Applications */}
        <div                             className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center transition-transform duration-300 hover:-translate-y-1"
              style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}>
          <Briefcase className="mb-2 text-orange-700" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Job Applications</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.jobApplications}</span>
          <span className="text-xs font-bold text-gray-600">This Month</span>
        </div>

        {/* Certification */}
        <div               className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center transition-all hover:-translate-y-1"
              style={{ boxShadow: `0 4px 12px rgba(${brand.primaryRgb}, 0.06)` }}>
          <Award className="mb-2 text-purple-700" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Certification</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.certCompleted}/{career.certTotal}</span>
          <span className="text-xs font-bold text-purple-700">Completed</span>
        </div>

      </div>

      <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
        <button 
          aria-label="View full career dashboard"
          className="flex items-center gap-2 text-sm font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View Career Dashboard <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
