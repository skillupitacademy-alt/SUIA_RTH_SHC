import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { FileText, Target, Briefcase, Award, ArrowRight } from 'lucide-react';

export function CareerReadinessWidget() {
  const brand = useBrand();
  const { career } = useTutorialDashboardData();

  return (
    <div 
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-500 -translate-y-2 scale-[1.01] shadow-2xl hover:-translate-y-3"
      style={{ boxShadow: `0 20px 40px rgba(${brand.primaryRgb}, 0.08)` }}
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

      <div className="grid grid-cols-2 gap-4">
        
        {/* Resume Score */}
        <div 
          className="flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 text-center transition-transform duration-300 hover:-translate-y-1"
          style={{ 
            backgroundColor: '#15803d', // Green-700
            boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` 
          }}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white shadow-sm">
            <FileText size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Resume Score</span>
          <span className="text-xl font-black text-white mb-1">{career.resumeScore}%</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
            {career.resumeStatus}
          </span>
        </div>

        {/* Skills Match */}
        <div 
          className="flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 text-center transition-transform duration-300 hover:-translate-y-1"
          style={{ 
            backgroundColor: '#1d4ed8', // Blue-700
            boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` 
          }}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white shadow-sm">
            <Target size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Skills Match</span>
          <span className="text-xl font-black text-white mb-1">{career.skillsMatch}%</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
            {career.skillsStatus}
          </span>
        </div>

        {/* Job Applications */}
        <div 
          className="flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 text-center transition-transform duration-300 hover:-translate-y-1"
          style={{ 
            backgroundColor: '#c2410c', // Orange-700
            boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` 
          }}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white shadow-sm">
            <Briefcase size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Applications</span>
          <span className="text-xl font-black text-white mb-1">{career.jobApplications}</span>
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">Submitted</span>
        </div>

        {/* Certification */}
        <div 
          className="flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 text-center transition-transform duration-300 hover:-translate-y-1"
          style={{ 
            backgroundColor: '#7e22ce', // Purple-700
            boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` 
          }}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white shadow-sm">
            <Award size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Certification</span>
          <span className="text-xl font-black text-white mb-1">{career.certCompleted}/{career.certTotal}</span>
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">Completed</span>
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
