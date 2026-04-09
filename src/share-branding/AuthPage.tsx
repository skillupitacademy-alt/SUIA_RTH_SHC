'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
      <AuthContent config={config} initialMode={initialMode} />
    </React.Suspense>
  );
}

function AuthContent({ config, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto bg-slate-50 p-0 font-sans sm:p-4 md:p-6 lg:p-8">
      
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
      <div className="flex min-h-[100dvh] w-full max-w-[85rem] flex-col overflow-hidden rounded-none border-0 border-gray-100 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 sm:min-h-[700px] sm:rounded-[2.5rem] sm:border sm:hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] md:min-h-0 md:flex-row md:[height:min(900px,calc(100dvh-3rem))]">

        {/* ── Brand Side (Desktop Left) ── */}
        <section 
          className="relative hidden w-full overflow-hidden border-r border-black/10 bg-white p-10 md:flex md:w-1/2 md:min-w-0 md:flex-col md:justify-center lg:p-12"
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
                className="mb-6 text-4xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-md lg:text-5xl xl:text-6xl"
                aria-hidden="true"
              >
                {config.authWelcomeHeading.split('.').map((part, i) => (
                  <span key={i} className="block">
                    {part}{i < config.authWelcomeHeading.split('.').length - 1 ? '.' : ''}
                  </span>
                ))}
              </p>
              <p className="mb-8 max-w-[26rem] text-lg font-bold leading-relaxed text-white drop-shadow-sm lg:text-xl">
                {config.authWelcomeSubtext}
              </p>

              {/* Feature Showcase Card */}
              <div className="group flex items-center gap-4 rounded-[2rem] border border-white/30 bg-white/15 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 lg:gap-6 lg:rounded-[2.5rem] lg:p-6">
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
        <section className="relative flex w-full justify-center overflow-x-hidden overflow-y-auto bg-white p-4 sm:p-6 md:w-1/2 md:min-w-0 md:p-10 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-2 flex h-full w-full max-w-md min-w-0 flex-col sm:mt-4 md:mt-0"
            >
              {/* Mobile Header */}
              <div className="mb-8 flex flex-none items-center gap-2 md:hidden">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-950">{config.name}</span>
              </div>

              <div className="mb-6 flex-none sm:mb-8">
                <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Get started' : 'Reset password'}
                </h1>
                <p className="max-w-[32rem] text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                  {mode === 'login' 
                    ? 'Enter your credentials to access your account' 
                    : mode === 'signup'
                    ? 'Start your journey towards mastery today'
                    : 'Enter your email to receive a reset link.'}
                </p>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-8">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsLoading(true); setTimeout(() => { setIsLoading(false); if (mode === 'login' || mode === 'signup') { const dest = searchParams.get('redirect') || '/dashboard'; router.push(dest); } }, 1500); }}>
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label htmlFor="full-name" className="text-sm font-black text-slate-950 ml-1">Full Name</label>
                      <div className="relative group" style={{ '--brand-sec': config.secondaryColor } as React.CSSProperties}>
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[color:var(--brand-sec)] transition-colors" />
                        <input 
                          id="full-name"
                          type="text" 
                          placeholder="John Doe"
                          autoComplete="name"
                          className="w-full rounded-2xl border border-slate-200 bg-gray-50 py-3 pl-12 pr-4 font-semibold text-slate-950 placeholder-slate-500 outline-none transition-all group-focus-within:shadow-sm focus:bg-white focus:border-[color:var(--brand-sec)] focus:ring-4 focus:ring-[color:var(--brand-sec)]/20"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-black text-slate-950 ml-1">Email Address</label>
                    <div className="relative group" style={{ '--brand-sec': config.secondaryColor } as React.CSSProperties}>
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[color:var(--brand-sec)] transition-colors" />
                        <input 
                          id="email"
                          type="email" 
                          placeholder="name@example.com"
                          autoComplete="email"
                          className="w-full rounded-2xl border border-slate-200 bg-gray-50 py-3 pl-12 pr-4 font-semibold text-slate-950 placeholder-slate-500 outline-none transition-all group-focus-within:shadow-sm focus:bg-white focus:border-[color:var(--brand-sec)] focus:ring-4 focus:ring-[color:var(--brand-sec)]/20"
                        />
                    </div>
                  </div>

                  {mode !== 'forgot_password' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <label htmlFor="password" className="text-sm font-black text-slate-950">Password</label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            onClick={setForgotPasswordMode}
                            className="text-sm font-bold transition-opacity hover:opacity-80"
                            style={{ color: config.secondaryColor }}
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative group" style={{ '--brand-sec': config.secondaryColor } as React.CSSProperties}>
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[color:var(--brand-sec)] transition-colors" />
                        <input 
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          className="w-full rounded-2xl border border-slate-200 bg-gray-50 py-3 pl-12 pr-12 font-semibold text-slate-950 placeholder-slate-500 outline-none transition-all group-focus-within:shadow-sm focus:bg-white focus:border-[color:var(--brand-sec)] focus:ring-4 focus:ring-[color:var(--brand-sec)]/20"
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
                    className="relative !mt-8 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-black/10 bg-slate-950 py-3.5 text-base font-bold text-white shadow-xl transition-all duration-300 active:translate-y-0 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 sm:text-lg"
                    style={{ backgroundColor: config.primaryColorDark }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-black/10"></div>
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
                  <div className="pt-2 sm:pt-4 md:pt-8">
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                      <span className="text-center text-xs font-black uppercase tracking-[0.24em] text-slate-950 sm:text-sm">Or continue with</span>
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <button className="group flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-gray-200 py-3 transition-colors hover:bg-gray-50">
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        <span className="truncate font-bold text-slate-800">Google</span>
                      </button>
                      <button className="group flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-gray-200 py-3 transition-colors hover:bg-gray-50">
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate font-bold text-slate-800">GitHub</span>
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'forgot_password' ? (
                  <p className="mt-2 text-center text-sm font-black text-slate-950 sm:mt-4 sm:text-base md:mt-8">
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
                  <p className="mt-2 text-center text-sm font-black text-slate-950 sm:mt-4 sm:text-base md:mt-8">
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
