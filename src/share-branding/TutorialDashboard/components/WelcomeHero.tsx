import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { Play, MessageCircle, BookOpen, CheckCircle, Target, TrendingUp } from 'lucide-react';

export function WelcomeHero() {
  const brand = useBrand();
  const { hero } = useTutorialDashboardData();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-10 pt-4">

      {/* Card 1: Welcome & Continue Learning */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 transition-all duration-500 -translate-y-2 scale-[1.01] shadow-2xl hover:-translate-y-3 hover:scale-[1.02]"
        style={{
          backgroundColor: brand.primaryColorDark,
          boxShadow: `0 20px 50px rgba(${brand.primaryRgb}, 0.25)`
        }}
      >
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

        <div className="relative z-10">
          <h2 className="text-xl font-black text-white mb-1 leading-tight truncate">{hero.greeting}</h2>
          <p className="text-xs font-semibold text-white mb-5 line-clamp-1">{hero.subGreeting}</p>

          <div className="rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur-sm">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-white mb-3">Continue Learning</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-base font-black shadow-lg" style={{ color: brand.primaryColorDark }}>
                JS
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{hero.continueTitle}</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-700 ease-out"
                      style={{ width: `${hero.continuePercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white">{hero.continuePercent}%</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-[11px] font-black shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ color: brand.primaryColorDark }}
              >
                <Play size={12} className="fill-current" />
                Resume
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Today's Progress */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 transition-all duration-500 -translate-y-2 scale-[1.01] shadow-2xl hover:-translate-y-3 hover:scale-[1.02] text-white"
        style={{
          backgroundColor: '#166534', // Deep Green for WCAG
          boxShadow: '0 20px 50px rgba(22, 101, 52, 0.25)'
        }}
      >
        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-1/4 top-0 h-16 w-16 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black">Today's Progress</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">Live</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"><BookOpen size={16} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black truncate">{hero.progressTimeSpent}</span>
                <span className="text-[9px] font-bold text-white uppercase">Time</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"><CheckCircle size={16} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black truncate">{hero.progressLessons}</span>
                <span className="text-[9px] font-bold text-white uppercase">Lessons</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"><Target size={16} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black truncate">{hero.progressDailyGoal}%</span>
                <span className="text-[9px] font-bold text-white uppercase">Goal</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"><TrendingUp size={16} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black truncate">{hero.progressXpEarned}</span>
                <span className="text-[9px] font-bold text-white uppercase">XP</span>
              </div>
            </div>
          </div>

          <p className="mt-auto text-center text-[10px] font-bold text-white italic uppercase tracking-widest">
            Consistency is key ⚡
          </p>
        </div>
      </div>

      {/* Card 3: AI Tutor */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 transition-all duration-500 -translate-y-2 scale-[1.01] shadow-2xl hover:-translate-y-3 hover:scale-[1.02] text-white"
        style={{
          backgroundColor: '#6b21a8', // Deep Purple for high contrast
          boxShadow: '0 20px 50px rgba(107, 33, 168, 0.25)'
        }}
      >
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-20 w-20 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-inner backdrop-blur-md">
            <span className="text-2xl animate-bounce">🤖</span>
          </div>
          <h3 className="text-lg font-black mb-1">Your {brand.tutorLabel} is ready</h3>
          <p className="text-[11px] font-semibold text-white mb-6 px-2 line-clamp-2">
            Instant help, expert explanations, and coding guidance available 24/7.
          </p>
          <button
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-2.5 text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95"
            style={{ color: '#6b21a8' }}
          >
            <MessageCircle size={18} />
            Chat Now
          </button>
        </div>
      </div>
    </div>
  );
}
