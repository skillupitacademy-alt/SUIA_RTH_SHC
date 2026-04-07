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
  ChevronRight,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { BrandConfig } from './brandConfig';

interface AuthPageProps {
  config: BrandConfig;
  initialMode?: 'login' | 'signup' | 'forgot_password';
}

export default function AuthPage({ config, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setLoginMode = () => setMode('login');
  const setSignupMode = () => setMode('signup');
  const setForgotPasswordMode = () => setMode('forgot_password');

  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans relative overflow-y-auto overflow-x-hidden">
      
      {/* ── Ambient Background Mesh ── */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none opacity-20 transition-colors duration-1000"
        style={{ backgroundColor: config.primaryColor }}
      />
      <div 
        className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none opacity-20 transition-colors duration-1000"
        style={{ backgroundColor: config.secondaryColor }}
      />

      {/* ── Main Unified Card (Fixed min-height to prevent form toggle jumping) ── */}
      <div className="w-full max-w-[85rem] min-h-[700px] h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] max-h-[900px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] flex flex-col md:flex-row overflow-hidden border border-gray-100 transition-all duration-500">

        {/* ── Brand Side (Desktop Left) ── */}
        <section 
          className="hidden md:flex w-full md:w-1/2 relative flex-col justify-center p-10 lg:p-12 border-r border-black/10 overflow-hidden bg-white"
        >
          {/* ── Dynamic Sober Brand Lighting Composites ── */}
          {/* Base color reduced slightly in raw density to remove heavy flat-monitor feel */}
          <div 
            className="absolute inset-0 z-0" 
            style={{ backgroundColor: config.primaryColor, opacity: 0.88 }} 
          />
          {/* Directional lighting sheen to make the panel feel like physical soft-touch material */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/20 via-white/5 to-black/10 mix-blend-overlay"></div>
          {/* Soft internal vignette to diffuse the edges */}
          <div className="absolute inset-0 z-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.1)]"></div>

          <div className="relative z-10 max-w-lg w-full h-full flex flex-col justify-between">
            {/* Logo inside card */}
            <div className="flex items-center gap-3 mb-10">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                style={{ backgroundColor: config.secondaryColor }}
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white drop-shadow-sm">{config.name}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <p 
                className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6 text-white drop-shadow-md"
                aria-hidden="true"
              >
                {config.authWelcomeHeading.split('.').map((part, i) => (
                  <span key={i} className="block">
                    {part}{i < config.authWelcomeHeading.split('.').length - 1 ? '.' : ''}
                  </span>
                ))}
              </p>
              <p className="text-xl text-white leading-relaxed mb-8 font-bold drop-shadow-sm">
                {config.authWelcomeSubtext}
              </p>

              {/* Feature Showcase Card */}
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 p-6 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex items-center gap-6 group hover:-translate-y-1 transition-all duration-500">
                <div 
                  className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg relative overflow-hidden group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  {config.authShowcaseIcon === 'tutor' ? (
                    <Brain className="w-8 h-8 text-white relative z-10" />
                  ) : (
                    <Users className="w-8 h-8 text-white relative z-10" />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-white text-lg drop-shadow-md">
                    {config.tutorLabel} is ready
                  </h2>
                  <p className="text-white text-sm font-bold">
                    Interactive guidance powered by your context.
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/70 ml-auto group-hover:text-white transition-colors" />
              </div>
            </div>


          </div>
        </section>

        {/* ── Form Side ── */}
        <section className="w-full md:w-1/2 flex justify-center p-8 sm:p-10 lg:p-12 relative bg-white overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md mt-4 md:mt-0 flex flex-col h-full"
            >
              {/* Mobile Header */}
              <div className="md:hidden flex items-center gap-2 mb-10 flex-none">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-950">{config.name}</span>
              </div>

              <div className="mb-8 flex-none">
                <h1 className="text-4xl font-black text-slate-950 mb-3 tracking-tight">
                  {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Get started' : 'Reset password'}
                </h1>
                <p className="text-slate-800 font-bold">
                  {mode === 'login' 
                    ? 'Enter your credentials to access your account' 
                    : mode === 'signup'
                    ? 'Start your journey towards mastery today'
                    : 'Enter your email to receive a reset link.'}
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsLoading(true); setTimeout(() => setIsLoading(false), 2000); }}>
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-950 ml-1">Full Name</label>
                      <div className="relative group" style={{ '--brand-sec': config.secondaryColor } as React.CSSProperties}>
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[color:var(--brand-sec)] transition-colors" />
                        <input 
                          type="text" 
                          placeholder="John Doe"
                          autoComplete="name"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[color:var(--brand-sec)] focus:ring-4 focus:ring-[color:var(--brand-sec)]/20 outline-none transition-all font-bold text-slate-950 placeholder-slate-500 group-focus-within:shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-950 ml-1">Email Address</label>
                    <div className="relative group" style={{ '--brand-sec': config.secondaryColor } as React.CSSProperties}>
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[color:var(--brand-sec)] transition-colors" />
                      <input 
                        type="email" 
                        placeholder="name@example.com"
                        autoComplete="email"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[color:var(--brand-sec)] focus:ring-4 focus:ring-[color:var(--brand-sec)]/20 outline-none transition-all font-bold text-slate-950 placeholder-slate-500 group-focus-within:shadow-sm"
                      />
                    </div>
                  </div>

                  {mode !== 'forgot_password' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-black text-slate-950">Password</label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            onClick={setForgotPasswordMode}
                            className="text-sm font-bold hover:opacity-80 transition-opacity"
                            style={{ color: config.secondaryColor }}
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative group" style={{ '--brand-sec': config.secondaryColor } as React.CSSProperties}>
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[color:var(--brand-sec)] transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[color:var(--brand-sec)] focus:ring-4 focus:ring-[color:var(--brand-sec)]/20 outline-none transition-all font-bold text-slate-950 placeholder-slate-500 group-focus-within:shadow-sm"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={isLoading}
                    type="submit"
                    className="w-full py-3.5 rounded-2xl font-bold text-lg shadow-xl hover:translate-y-[-2px] hover:shadow-2xl active:translate-y-0 transition-all duration-300 !mt-8 flex items-center justify-center gap-2 overflow-hidden relative group text-white border border-black/10 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-wait"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <div className="absolute inset-0 bg-black/20 pointer-events-none mix-blend-multiply"></div>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin relative z-10" />
                    ) : (
                      <>
                        <span className="relative z-10 text-white drop-shadow-sm">{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform text-white" />
                      </>
                    )}
                  </button>
                </form>

                {mode !== 'forgot_password' && (
                  <div className="pt-8">
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                      <span className="text-slate-950 text-sm font-black uppercase tracking-widest">Or continue with</span>
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button className="flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors group">
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        <span className="font-bold text-slate-800">Google</span>
                      </button>
                      <button className="flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors group">
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-slate-800">GitHub</span>
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'forgot_password' ? (
                  <p className="mt-8 text-center text-slate-950 font-black">
                    Remember your password?{' '}
                    <button 
                      onClick={setLoginMode}
                      className="font-black hover:opacity-80 transition-opacity"
                      style={{ color: config.secondaryColor }}
                    >
                      Back to login
                   </button>
                  </p>
                ) : (
                  <p className="mt-8 text-center text-slate-950 font-black">
                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                      onClick={mode === 'login' ? setSignupMode : setLoginMode}
                      className="font-black hover:opacity-80 transition-opacity"
                      style={{ color: config.secondaryColor }}
                    >
                      {mode === 'login' ? 'Sign up for free' : 'Sign in here'}
                   </button>
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
