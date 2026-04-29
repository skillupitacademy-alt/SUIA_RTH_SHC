import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { FileText, Target, Briefcase, Award, ArrowRight } from 'lucide-react';

export function CareerReadinessWidget() {
  const brand = useBrand();
  const { career } = useTutorialDashboardData();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">Career Readiness</h3>
        <button className="text-xs font-bold hover:underline" style={{ color: brand.primaryColor }}>
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 flex-1">
        
        {/* Resume Score */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-md">
          <FileText className="mb-2 text-green-500" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Resume Score</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.resumeScore}%</span>
          <span className="text-xs font-bold text-green-500">{career.resumeStatus}</span>
        </div>

        {/* Skills Match */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-md">
          <Target className="mb-2 text-blue-500" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Skills Match</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.skillsMatch}%</span>
          <span className="text-xs font-bold text-blue-500">{career.skillsStatus}</span>
        </div>

        {/* Job Applications */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-md">
          <Briefcase className="mb-2 text-orange-500" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Job Applications</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.jobApplications}</span>
          <span className="text-xs font-bold text-gray-400">This Month</span>
        </div>

        {/* Certification */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-md">
          <Award className="mb-2 text-purple-500" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Certification</span>
          <span className="text-xl font-black text-gray-900 mb-1">{career.certCompleted}/{career.certTotal}</span>
          <span className="text-xs font-bold text-purple-500">Completed</span>
        </div>

      </div>

      <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
        <button className="flex items-center gap-2 text-sm font-bold hover:underline" style={{ color: brand.primaryColor }}>
          View Career Dashboard <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
