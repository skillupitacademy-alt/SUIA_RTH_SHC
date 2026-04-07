'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Github, 
  Chrome,
  Brain,
  Users,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { BrandConfig } from './brandConfig';

interface AuthPageProps {
  config: BrandConfig;
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ config, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.3 }
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* ── Brand Side (Desktop Left) ── */}
      <section className="hidden md:flex w-full md:w-1/2 relative flex-col items-center justify-center p-12 bg-slate-50">
        {/* Subtle Background Glow */}
        <div 
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: config.primaryColor }}
        ></div>
        <div 
          className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: config.secondaryColor }}
        ></div>

        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300"
              style={{ backgroundColor: config.secondaryColor }}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">{config.name}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p 
              className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8"
              style={{ color: '#0f172a' }}
              aria-hidden="true"
            >
              {config.authWelcomeHeading.split('.').map((part, i) => (
                <span key={i} className="block">
                  {part}{i < config.authWelcomeHeading.split('.').length - 1 ? '.' : ''}
                </span>
              ))}
            </p>
            <p className="text-xl text-slate-950 leading-relaxed mb-12 font-bold">
              {config.authWelcomeSubtext}
            </p>

            {/* Feature Showcase Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] flex items-center gap-6 group hover:translate-y-1 transition-all duration-500">
              <div 
                className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: config.primaryColor }}
              >
                {config.authShowcaseIcon === 'tutor' ? (
                  <Brain className="w-8 h-8 text-white relative z-10" />
                ) : (
                  <Users className="w-8 h-8 text-white relative z-10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              </div>
              <div>
                <h2 className="font-black text-slate-950 text-lg">
                  {config.tutorLabel} is ready
                </h2>
                <p className="text-slate-950 text-sm font-bold">
                  Interactive guidance powered by your context.
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-700 ml-auto group-hover:text-slate-950 transition-colors" />
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex items-center gap-4">
              <div className="flex -space-x-3" aria-hidden="true">
                {[
                  'photo-1534528741775-53994a69daeb',
                  'photo-1507003211169-0a1dd7228f2d',
                  'photo-1544005313-94ddf0286df2',
                  'photo-1506794778202-cad84cf45f1d'
                ].map((id, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-50 bg-slate-200 overflow-hidden shadow-sm">
                    <img 
                      src={`https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=100&h=100`} 
                      alt="" 
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm font-bold text-slate-950">
                <span className="text-slate-900 font-black block">10k+ Learners</span>
                Joined this week
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Form Side ── */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-white relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={mode}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md"
          >
            {/* Mobile Header */}
            <div className="md:hidden flex items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">{config.name}</span>
            </div>

            <div className="mb-10">
              <h1 className="text-4xl font-black text-slate-950 mb-3 tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Get started'}
              </h1>
              <p className="text-slate-900 font-bold">
                {mode === 'login' 
                  ? 'Enter your credentials to access your account' 
                  : 'Start your journey towards mastery today'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-950 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-slate-950 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      autoComplete="name"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-bold text-slate-950 placeholder-gray-700"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-950 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-slate-950 transition-colors" />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-bold text-slate-950 placeholder-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-black text-slate-950">Password</label>
                  {mode === 'login' && (
                    <button type="button" className="text-sm font-bold hover:underline transition-all" style={{ color: config.primaryColorDark }}>
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-slate-950 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-bold text-slate-950 placeholder-gray-700"
                  />
                </div>
              </div>

              <button 
                className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:translate-y-[-2px] hover:shadow-2xl active:translate-y-0 transition-all duration-300 mt-4 flex items-center justify-center gap-2 overflow-hidden relative group"
                style={{ backgroundColor: config.primaryColor }}
              >
                <span className="relative z-10">{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-[1px] bg-gray-200 flex-1"></div>
              <span className="text-slate-950 text-sm font-black uppercase tracking-widest">Or continue with</span>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button className="flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors group">
                <Chrome className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-gray-700">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors group">
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-gray-700">GitHub</span>
              </button>
            </div>

            <p className="mt-12 text-center text-slate-950 font-black">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={toggleMode}
                className="font-black hover:underline underline-offset-4"
                style={{ color: config.primaryColorDark }}
              >
                {mode === 'login' ? 'Sign up for free' : 'Sign in here'}
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}
