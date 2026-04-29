import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { Play, MessageCircle, BookOpen, CheckCircle, Target, TrendingUp } from 'lucide-react';

export function WelcomeHero() {
  const brand = useBrand();
  const { hero } = useTutorialDashboardData();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
      
      {/* Welcome & Continue Learning Card */}
      <div 
        className="rounded-2xl border border-gray-100 bg-white p-6 transition-transform duration-300 hover:-translate-y-1 lg:col-span-2"
        style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
      >
        <h2 className="text-2xl font-black text-gray-900 mb-1">{hero.greeting}</h2>
        <p className="text-sm font-semibold text-gray-700 mb-6">{hero.subGreeting}</p>
        
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-3">Continue Learning</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-lg font-black text-yellow-800">
            JS
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-bold text-gray-900">{hero.continueTitle}</span>
            <span className="text-[11px] font-semibold text-gray-600">{hero.continueContext}</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: `${hero.continuePercent}%`, backgroundColor: brand.primaryColor }}
                />
              </div>
              <span className="text-xs font-bold text-gray-900">{hero.continuePercent}%</span>
            </div>
          </div>
          <button 
            aria-label={`Resume learning ${hero.continueTitle}`}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }} 
          >
            <Play size={16} className="fill-current" aria-hidden="true" />
            Resume Now
          </button>
        </div>
      </div>

      {/* AI Tutor / Mentor Card */}
      <div 
        className="relative overflow-hidden rounded-2xl border border-gray-100 bg-slate-50 p-6 lg:col-span-1 flex flex-col items-center justify-center text-center transition-transform duration-300 hover:-translate-y-1"
        style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
      >
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-100 opacity-50 blur-2xl" />
        
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-gray-100">
          <span className="text-2xl">🤖</span>
        </div>
        <h3 className="text-base font-black text-gray-900 mb-1">Your {brand.tutorLabel} is ready</h3>
        <p className="text-[11px] font-semibold text-gray-600 mb-4 px-2">
          Get instant help, explanations, and personalized guidance.
        </p>
        <button 
          aria-label={`Chat with ${brand.tutorLabel}`}
          className="flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors hover:bg-white shadow-sm" 
          style={{ borderColor: brand.accentColor === 'orange' ? '#b43a00' : '#be185d', color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          <MessageCircle size={16} />
          Chat with {brand.tutorLabel}
        </button>
      </div>

      {/* Today's Progress Card */}
      <div 
        className="rounded-2xl border border-gray-100 bg-white p-6 lg:col-span-1 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
        style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-900">Today's Progress</h3>
          <button 
            aria-label="View all progress details"
            className="text-xs font-bold hover:underline" 
            style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
          >View All</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><BookOpen size={16} /></div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-900">{hero.progressTimeSpent}</span>
              <span className="text-[10px] font-bold text-gray-600">Time Spent</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700"><CheckCircle size={16} /></div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-900">{hero.progressLessons}</span>
              <span className="text-[10px] font-bold text-gray-600">Lessons Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700"><Target size={16} /></div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-900">{hero.progressDailyGoal}%</span>
              <span className="text-[10px] font-bold text-gray-600">Daily Goal</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700"><TrendingUp size={16} /></div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-900">{hero.progressXpEarned}</span>
              <span className="text-[10px] font-bold text-gray-600">XP Earned</span>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs font-bold text-gray-500 border-t border-gray-100 pt-3">
          Great progress! Keep it up! 🎯
        </div>
      </div>

    </div>
  );
}
