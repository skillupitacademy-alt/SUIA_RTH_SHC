'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Briefcase, FileCheck, Check, X, BookOpen, Code, Brain, FileEdit, Lightbulb, GraduationCap, AlertCircle, Target, TrendingUp, Rocket, Award, MessageSquare, Zap, FolderKanban, Users, Star, Menu } from 'lucide-react';
import { BrandConfig } from './brandConfig';
import Link from 'next/link';

export default function LandingPage({ config }: { config: BrandConfig }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.secondaryColor }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">{config.brandName}</span>
          </div>

          <div className="hidden min-[801px]:flex items-center gap-6">
            <a href="#home" className="text-gray-700 hover:text-gray-900 transition text-sm font-bold">Home</a>
            <a href="#solutions" className="text-gray-700 hover:text-gray-900 transition text-sm font-bold">Solutions</a>
            <a href="#experience" className="text-gray-700 hover:text-gray-900 transition text-sm font-bold">Experience Letter</a>
            <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition text-sm font-bold">Pricing</a>
            <a href="#contact" className="text-gray-700 hover:text-gray-900 transition text-sm font-bold">Contact</a>
          </div>

          <div className="hidden min-[801px]:flex items-center gap-4">
            <Link href="/login" className="text-gray-700 hover:text-gray-900 transition font-bold duration-300 hover:-translate-y-1">Log In</Link>
            <Link href="/start-learning" className="text-white px-6 py-2 rounded-full font-bold shadow-xl hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: config.primaryColor }}>Start Learning</Link>
          </div>

          <button aria-label="Toggle Navigation Menu" className="min-[801px]:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="min-[801px]:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl py-4 px-4 flex flex-col gap-4 z-50">
            <a href="#home" className="font-bold text-gray-800 p-3 hover:bg-gray-50 rounded-lg">Home</a>
            <a href="#solutions" className="font-bold text-gray-800 p-3 hover:bg-gray-50 rounded-lg">Solutions</a>
            <a href="#experience" className="font-bold text-gray-800 p-3 hover:bg-gray-50 rounded-lg">Experience Letter</a>
            <a href="#pricing" className="font-bold text-gray-800 p-3 hover:bg-gray-50 rounded-lg">Pricing</a>
            <a href="#contact" className="font-bold text-gray-800 p-3 hover:bg-gray-50 rounded-lg">Contact</a>
            <div className="h-px bg-gray-100 my-1"></div>
            <Link href="/login" className="text-left font-bold text-gray-800 p-3 hover:bg-gray-50 rounded-lg duration-300 hover:-translate-y-1">Log In</Link>
            <Link href="/start-learning" className="text-white px-6 py-3 rounded-xl font-bold shadow-md w-full mt-2 shadow-xl hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: config.primaryColor }}>Start Learning</Link>
          </div>
        )}
      </nav>

      <main className="overflow-hidden max-w-[100vw]">

        {/* Hero Section */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-0 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center relative z-10 overflow-hidden">

          {/* Floating Role Badges - Left Cluster */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[2%] top-[12%] w-28 h-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] flex items-center justify-center border-t border-white/60 z-0 hidden lg:flex"
          >
            <div className="text-center px-2">
              <Code className="w-8 h-8 mx-auto text-purple-700 mb-1" />
              <span className="font-bold text-[11px] leading-tight block text-gray-900">Full Stack<br />+ AI</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ scale: [1, 1.05, 1], y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute left-[8%] top-[38%] w-28 h-28 rounded-2xl shadow-[0_20px_40px_rgba(18,79,214,0.3)] flex items-center justify-center z-10 hidden xl:flex text-white"
            style={{ backgroundColor: config.secondaryColor }}
          >
            <div className="text-center px-2">
              <Zap className="w-8 h-8 mx-auto mb-1 animate-pulse" />
              <span className="font-bold text-[11px] leading-tight block uppercase tracking-tighter">Vibe<br />Coding</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute left-[4%] bottom-[20%] w-28 h-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] flex items-center justify-center border-t border-white/60 z-0 hidden lg:flex"
          >
            <div className="text-center px-2">
              <TrendingUp className="w-8 h-8 mx-auto text-blue-700 mb-1" />
              <span className="font-bold text-[11px] leading-tight block text-gray-900">Data<br />Analyst</span>
            </div>
          </motion.div>

          {/* Floating Role Badges - Right Cluster */}
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute right-[2%] top-[12%] w-28 h-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_0_40_rgba(0,0,0,0.1)] flex items-center justify-center border-t border-white/60 z-0 hidden lg:flex"
          >
            <div className="text-center px-2">
              <Brain className="w-8 h-8 mx-auto text-orange-800 mb-1" />
              <span className="font-bold text-[11px] leading-tight block text-gray-900">Data<br />Scientist</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ scale: [1, 1.05, 1], y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute right-[10%] top-[38%] w-28 h-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] flex items-center justify-center border-t border-white/60 z-0 hidden xl:flex"
          >
            <div className="text-center px-2">
              <Target className="w-8 h-8 mx-auto text-indigo-800 mb-1" />
              <span className="font-bold text-[11px] leading-tight block text-gray-900">System<br />Architect</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute right-[4%] bottom-[20%] w-28 h-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] flex items-center justify-center border-t border-white/60 z-0 hidden lg:flex"
          >
            <div className="text-center px-2">
              <FolderKanban className="w-8 h-8 mx-auto text-green-800 mb-1" />
              <span className="font-bold text-[11px] leading-tight block text-gray-900">Data<br />Engineer</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 w-full flex flex-col items-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:leading-tight font-bold mb-16 font-poppins">
              <span style={{ color: config.primaryColor }}>
                {config.heroHeadingLine1}
              </span>
              <br />
              <span style={{ color: config.secondaryColor }}>
                {config.heroHeadingLine2}
              </span>
            </h1>


            <div className="flex flex-wrap justify-center gap-2 mb-16 max-w-2xl">
              <span className="text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg" style={{ backgroundColor: config.primaryColor }}>Vibe Coding</span>
              <span className="bg-purple-50 text-purple-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-purple-100">Full Stack + AI</span>
              <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-blue-100">Data Analyst</span>
              <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-orange-100">Data Scientist</span>
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-green-100">Data Engineer</span>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-100">System Architect</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16 w-full px-4 sm:px-0">
              <Link href="/start-learning" className="text-white px-6 py-4 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg w-full sm:w-auto transition-all font-bold duration-300 hover:-translate-y-1" style={{ backgroundColor: config.primaryColor, boxShadow: `0 15px 30px rgba(${config.primaryRgb},0.4)` }}>Start Learning</Link>
              <Link href="/programs" className="bg-white text-gray-800 px-6 py-4 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg w-full sm:w-auto shadow-xl -translate-y-1 hover:-translate-y-2 duration-300 border-2 border-gray-200 font-bold shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all">Explore Courses</Link>
            </div>

            {/* Internship, Experience Letter, Placement 3D Block */}
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 bg-white/80 backdrop-blur-xl border-t border-white px-5 py-4 sm:px-8 sm:py-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] w-full md:w-auto"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-inner"
                >
                  <Briefcase className="w-5 h-5 text-blue-800" />
                </motion.div>
                <span className="font-bold text-gray-800">Internship</span>
              </div>
              <div className="w-full md:w-px h-px md:h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.3 }}
                  className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shadow-inner"
                >
                  <FileCheck className="w-5 h-5 text-green-800" />
                </motion.div>
                <span className="font-bold text-gray-800">Experience Letter</span>
              </div>
              <div className="w-full md:w-px h-px md:h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2.6 }}
                  className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shadow-inner"
                >
                  <Rocket className="w-5 h-5 text-purple-800" />
                </motion.div>
                <span className="font-bold text-gray-800">Placement</span>
              </div>
            </motion.div>
          </motion.div>

        </section>

        {/* Problem Statement Section */}
        <section id="solutions" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <motion.div initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-poppins">Learning Online Feels Confusing and Directionless</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional online learning platforms leave you overwhelmed and unsure of your progress
            </p>
          </motion.div>

          <motion.div initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
              <AlertCircle className="w-12 h-12 text-red-800 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Too Many Random Tutorials</h3>
              <p className="text-gray-600 text-sm">Scattered content without clear path forward</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
              <Target className="w-12 h-12 text-orange-800 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No Structured Learning</h3>
              <p className="text-gray-600 text-sm">Jump between topics with no progression</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
              <MessageSquare className="w-12 h-12 text-yellow-800 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No Guidance</h3>
              <p className="text-gray-600 text-sm">Learn alone without expert support</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
              <TrendingUp className="w-12 h-12 text-blue-700 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No Feedback</h3>
              <p className="text-gray-600 text-sm">Can't measure progress or identify gaps</p>
            </div>
          </motion.div>
        </section>

        {/* Solution Flow Section */}
        <section id="journey" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="bg-white rounded-3xl p-6 lg:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 font-poppins">Your Complete Learning Journey</h2>
            <p className="text-center text-xl text-gray-600 mb-12">
              A structured system that guides you from beginner to job-ready professional
            </p>

            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-6 mb-8">
              <FlowCard icon={<BookOpen className="w-8 h-8" />} title="Learn" colorStyle={{ backgroundColor: config.primaryColor }} direction="left" />
              <Arrow />
              <FlowCard icon={<FileEdit className="w-8 h-8" />} title="Practice" colorStyle={{ backgroundColor: config.secondaryColor }} direction="down" />
              <Arrow />
              <FlowCard icon={<Brain className="w-8 h-8" />} title="AI Help" color="bg-gradient-to-br from-blue-500 to-blue-600" direction="up" />
              <Arrow />
              <FlowCard icon={<Rocket className="w-8 h-8" />} title="Project" color="bg-gradient-to-br from-indigo-500 to-indigo-600" direction="down" />
              <Arrow />
              <FlowCard icon={<TrendingUp className="w-8 h-8" />} title="Improve" color="bg-gradient-to-br from-cyan-500 to-cyan-600" direction="right" />
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-6">Backed by our Adaptive Learning Engine:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
                <span className="bg-pink-50 text-pink-700 px-4 py-2 rounded-full">6-Block Content System</span>
                <span className="bg-purple-50 text-purple-800 px-4 py-2 rounded-full">Difficulty Progression</span>
                <span className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full">{config.tutorLabel} Integration</span>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full">Smart Remediation</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How Learning Works */}
        <section id="process" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-poppins">How Learning Works</h2>
          <p className="text-center text-xl text-gray-600 mb-16">Our 6-Block Learning System â€” Your Core Differentiation</p>

          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-6">
            {/* Layman Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300 relative group cursor-pointer">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-pink-800" />
              </div>
              <div className="absolute top-8 right-8 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: config.primaryColor }}>1</div>
              <h3 className="text-xl font-bold mb-3">Concept Explanation</h3>
              <p className="text-gray-600">
                Start with simple, everyday language that makes complex concepts crystal clear and relatable.
              </p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" style={{ color: config.primaryColor }}>
                â†’
              </div>
            </div>

            {/* Example Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300 relative group cursor-pointer">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-purple-800" />
              </div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <h3 className="text-xl font-bold mb-3">Real-life Example</h3>
              <p className="text-gray-600">
                See concepts in action through practical examples from real-world scenarios you can relate to.
              </p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" style={{ color: config.primaryColor }}>
                â†’
              </div>
            </div>

            {/* Concept Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300 relative group cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-800" />
              </div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <h3 className="text-xl font-bold mb-3">Technical Concept</h3>
              <p className="text-gray-600">
                Deep dive into the theory, formulas, and technical details with structured explanations.
              </p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" style={{ color: config.primaryColor }}>
                â†’
              </div>
            </div>

            {/* Code Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300 relative group cursor-pointer">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-indigo-800" />
              </div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <h3 className="text-xl font-bold mb-3">Code Implementation</h3>
              <p className="text-gray-600">
                Apply what you learned with hands-on coding exercises and real implementation examples.
              </p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" style={{ color: config.primaryColor }}>
                â†’
              </div>
            </div>

            {/* AI Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300 relative group cursor-pointer">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-cyan-800" />
              </div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">5</div>
              <h3 className="text-xl font-bold mb-3">{config.tutorLabel}</h3>
              <p className="text-gray-600">
                Get instant, context-aware help from our {config.tutorLabel.toLowerCase()} that understands exactly what you're learning.
              </p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" style={{ color: config.primaryColor }}>
                â†’
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300 relative group cursor-pointer">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <FileEdit className="w-6 h-6 text-pink-800" />
              </div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-[#d03f00] rounded-full flex items-center justify-center text-white font-bold">6</div>
              <h3 className="text-xl font-bold mb-3">Assignments & Projects</h3>
              <p className="text-gray-600">
                Test your knowledge with difficulty-based assignments and real-world projects that solidify your understanding.
              </p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" style={{ color: config.primaryColor }}>
                â†’
              </div>
            </div>
          </motion.div>
        </section>

        {/* AI Tutor Highlight Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 font-poppins">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-6 lg:p-12 text-white shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-12 items-center">
              <motion.div initial={{ x: -50 }} whileInView={{ x: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }}>
                <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur px-4 py-2 rounded-full mb-6">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">{config.tutorBadgeText}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">{config.tutorHeading}</h2>
                <p className="text-xl mb-8 text-blue-100 font-medium">
                  {config.tutorDescription}
                </p>

                <div className="space-y-4">
                  <FeatureItem icon={<Target />} text="Context-aware answers tailored to your current lesson" />
                  <FeatureItem icon={<MessageSquare />} text="Guided learning that helps you think critically" />
                  <FeatureItem icon={<Zap />} text="Real-time help whenever you need it" />
                </div>

                <button className="bg-white text-purple-800 px-8 py-3 rounded-full mt-8 font-bold shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1">
                  {config.tutorButtonText}
                </button>
              </motion.div>

              <motion.div initial={{ x: 50 }} whileInView={{ x: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="bg-white/10 backdrop-blur rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 mb-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-purple-900">
                      ðŸ‘¤
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm font-bold">Can you explain how recursion works in this context?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.secondaryColor }}>
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm leading-relaxed">{config.tutorChatResponse}</p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-blue-100 text-sm font-bold">
                  {config.tutorContextLabel}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Assignment System & Other Sections */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-12">
            {/* Assignment System */}
            <motion.div initial={{ x: -50 }} whileInView={{ x: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-poppins">Assignment System</h2>
              <p className="text-xl text-gray-600 mb-4 font-bold">Practice Like Real Exams</p>
              <p className="text-gray-600 mb-8 font-medium">
                Progress from Simple to Expert levels with auto and AI evaluation. Unlock new challenges as you improve.
              </p>
              <button className="text-white px-8 py-3 rounded-full mb-8 font-bold shadow-xl hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: config.primaryColor }}>
                Learn more
              </button>

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Assignment Difficulty Levels</span>
                </div>
                <div className="grid grid-cols-2 md:flex md:justify-between items-end gap-6 md:gap-0">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl -translate-y-1 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
                      <span className="text-2xl sm:text-3xl">ðŸŽ¯</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold">Expert</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl -translate-y-1 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
                      <span className="text-2xl sm:text-3xl">âš¡</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold">Intermediate</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl -translate-y-1 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
                      <span className="text-2xl sm:text-3xl">â­</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold">Mixed</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl -translate-y-1 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
                      <span className="text-2xl sm:text-3xl">ðŸŽ–ï¸</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold">Simple</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column with Smart Remediation and Why We Are Different */}
            <motion.div initial={{ x: 50 }} whileInView={{ x: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="space-y-12">
              {/* Smart Remediation */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300">
                <h2 className="text-3xl font-bold mb-4 font-poppins">Smart Remediation</h2>
                <p className="text-gray-600 mb-6 font-medium">
                  Weak in something? We fix it automatically. Detect weak topics, generate personalized study plans, and get direct links to focused learning.
                </p>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm text-gray-700 mb-4 font-bold uppercase tracking-wider">Dashboard Preview</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm font-bold">Recommended recovery plan</span>
                      <div className="w-8 h-8 bg-pink-100 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm font-bold">Progress tracking</span>
                      <div className="w-16 h-8 bg-blue-100 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why We Are Different */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-gray-100 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-300">
                <h2 className="text-3xl font-bold mb-4 font-poppins">Why We Are Different</h2>
                <p className="text-gray-600 mb-6 font-medium">
                  We guide you step-by-step like a real teacher â€” not random videos or passive courses.
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b border-gray-100 items-end sm:items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: config.secondaryColor }}>
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-sm sm:text-base">Us</span>
                    </div>
                    <div className="flex gap-3 sm:gap-8 shrink-0">
                      <div className="w-10 sm:w-16 h-8 bg-red-50 rounded flex items-center justify-center shrink-0">
                        <span className="text-lg">ðŸ“º</span>
                      </div>
                      <div className="w-10 sm:w-16 h-8 bg-orange-50 rounded flex items-center justify-center shrink-0">
                        <span className="text-lg">ðŸŽ“</span>
                      </div>
                    </div>
                  </div>

                  <ComparisonRow label="Structured Learning Path" us={true} competitor1={false} competitor2={true} />
                  <ComparisonRow label={config.tutorComparisonLabel} us={true} competitor1={false} competitor2={false} />
                  <ComparisonRow label="Real-world Projects" us={true} competitor1={true} competitor2={false} />
                  <ComparisonRow label="Smart Remediation" us={true} competitor1={false} competitor2={false} />
                  <ComparisonRow label="Adaptive Practice System" us={true} competitor1={false} competitor2={true} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Real Projects Section */}
        <section id="projects" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 font-poppins">
          <motion.div initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Build Real-World Projects â€” Not Just Theory</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Apply your knowledge to actual projects that employers value
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8">
            <ProjectCard direction="left" icon={<FolderKanban className="w-8 h-8" />} title="Topic-Level Projects"
              description="Small, focused projects for each topic you learn"
              colorStyle={{ backgroundColor: config.primaryColor }}
              linkColor={config.secondaryColor}
            />
            <ProjectCard direction="up" icon={<Rocket className="w-8 h-8" />} title="Subject-Level Projects"
              description="Comprehensive projects combining multiple topics"
              colorStyle={{ backgroundColor: config.secondaryColor }}
              linkColor={config.secondaryColor}
            />
            <ProjectCard direction="right" icon={<Award className="w-8 h-8" />} title="Domain Capstone"
              description="Industry-standard projects for your portfolio"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              linkColor={config.secondaryColor}
            />
          </div>
        </section>

        {/* 4.1 Experience Pro Journey */}
        <section id="experience" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="bg-white rounded-3xl p-6 lg:p-12 shadow-2xl mb-12 border-t border-gray-100">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 font-poppins text-gray-900">The Experience Pro Journey</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
                You don't just study concepts â€” you work like a developer
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-2 mb-8 mt-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center max-w-sm flex-1">
                <FlowCard direction="up" icon={<Brain className="w-8 h-8" />} title="Analytical Design" color="bg-gradient-to-br from-indigo-500 to-indigo-700" />
                <div className="mt-6 lg:mt-8 text-center px-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">1. Analytical Design</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Design for both scale and insight.<br />Learn to structure systems and data architectures.</p>
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="hidden lg:flex items-center justify-center pt-12 opacity-80">
                <Arrow />
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center max-w-sm flex-1">
                <FlowCard direction="up" icon={<Code className="w-8 h-8" />} title="Production Engineering" colorStyle={{ background: `linear-gradient(to bottom right, ${config.secondaryColor}, #1d4ed8)` }} />
                <div className="mt-6 lg:mt-8 text-center px-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">2. Production Engineering</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Build robust, industry-standard solutions.<br />Develop Scalable APIs to high-performance data pipelines.</p>
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="hidden lg:flex items-center justify-center pt-12 opacity-80">
                <Arrow />
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center max-w-sm flex-1">
                <FlowCard direction="up" icon={<FolderKanban className="w-8 h-8" />} title="Strategic Delivery" colorStyle={{ background: `linear-gradient(to bottom right, ${config.primaryColor}, #c2410c)` }} />
                <div className="mt-6 lg:mt-8 text-center px-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">3. Strategic Delivery</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Ship high-impact results.<br />Deliver production-ready features or AI-driven insights.</p>
                </div>
              </div>
            </div>

          </motion.div>
        </section>



        {/* 4.2 & 4.5 Works on real systems + Why this matters (Re-architected) */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-0 mb-12 md:mb-20 font-poppins">

          {/* Phase A: Real Work Experience UI Grid */}
          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-12">
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 leading-snug">Work on Real Systems â€” Not Just Practice</h3>
              <p className="text-gray-600 text-xl font-medium">Learning is based on real-world simulation, not passive content.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-2xl border-t border-gray-100 transition-all duration-300">
              <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-2 border-l-4" style={{ borderLeftColor: config.secondaryColor }}>Real World Simulation Pillars</span>
              </div>

              <div className="grid grid-cols-2 md:flex md:justify-between items-start gap-8 md:gap-4">
                <div className="text-center group flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center mb-5 mx-auto shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
                    <FolderKanban className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-gray-800">Build Real<br />Modules</p>
                </div>

                <div className="text-center group flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-5 mx-auto shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(to bottom right, ${config.secondaryColor}, #1d4ed8)` }}>
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-gray-800">Solve Real<br />Problems</p>
                </div>

                <div className="text-center group flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-5 mx-auto shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(to bottom right, ${config.primaryColor}, #c2410c)` }}>
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-gray-800">Structured<br />Workflows</p>
                </div>

                <div className="text-center group flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl flex items-center justify-center mb-5 mx-auto shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-gray-800">Data-Driven<br />Insights</p>
                </div>
              </div>
            </div>
          </motion.div>


        </section>

        {/* 4.3 & 4.4 Experience Letter & Outcome */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-0 md:py-0 mb-12 md:mb-20 font-poppins">
          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="rounded-3xl p-8 lg:p-16 shadow-2xl shadow-orange-950/20 border border-white/20 relative overflow-hidden" style={{ backgroundColor: config.primaryColor }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-black/20 border border-white/20 px-4 py-2 rounded-full mb-6 text-white">
                  <Award className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-widest uppercase">Verified Experience</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-white">Graduate as a Pro, Not a Fresher.</h2>
                <p className="text-lg text-white mb-8 font-medium leading-relaxed">
                  Real project-based experience yields a verifiable credential that bypasses entry-level filters.
                </p>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>
                    <span className="font-bold text-white">Real project-based experience</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>
                    <span className="font-bold text-white">Production-level work exposure</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>
                    <span className="font-bold text-white">Portfolio-ready output</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>
                    <span className="font-bold text-white">Strong hiring advantage</span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-white px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base font-bold shadow-xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-1" style={{ color: config.primaryColor }}>
                    Start Your Experience Journey
                  </button>
                  <Link href="/programs" className="bg-transparent text-white border-2 border-white/20 px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base font-bold shadow-sm hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">Explore Courses</Link>
                </div>
              </div>

              {/* 4.4 Official Experience Letter Mock */}
              <motion.div initial={{ x: 50, rotate: 5 }} whileInView={{ x: 0, rotate: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="bg-white text-gray-800 rounded-2xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.15)] transform -rotate-2 border border-gray-100 border-l-8 relative max-w-lg mx-auto" style={{ borderLeftColor: config.secondaryColor }}>
                <div className="absolute top-4 right-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shadow-inner text-yellow-600">
                    <FileCheck className="w-6 h-6 mx-auto" />
                  </div>
                </div>
                <h3 className="font-black tracking-widest uppercase text-xs mb-2" style={{ color: config.secondaryColor }}>Official Document</h3>
                <h3 className="text-2xl font-bold mb-6 font-poppins border-b border-gray-100 pb-4">Letter of Experience</h3>

                <ul className="space-y-4 mb-8 text-sm font-medium text-gray-600">
                  <li className="flex gap-2"><Check className="w-4 h-4 flex-shrink-0" style={{ color: config.secondaryColor }} /> Based on actual work modules</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#124fd6] flex-shrink-0" /> Reflects real-world experience</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-[#124fd6] flex-shrink-0" /> Includes measurable contributions</li>
                </ul>

                <div className="bg-blue-50 text-blue-800 text-xs font-bold px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-blue-100">
                  <Target className="w-4 h-4" />
                  Not just a certificate â€” proof of real experience.
                </div>

                <div className="flex justify-between items-end pt-6 border-t border-gray-100">
                  <div>
                    <div className="w-24 h-1 bg-gray-200 mb-2"></div>
                    <span className="text-xs font-bold text-gray-600 uppercase">Authorized Signatory</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">VERIFIABLE CREDENTIAL</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="mastery" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 font-poppins">
          <motion.div initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Most Effective Path to Mastery</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understand how our experience-first model bridges the gap between theory and industry excellence.
            </p>
          </motion.div>

          {/* Phase B: Why This Matters Comparison Grid (Assignment Template) */}
          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl border-t border-gray-100 mb-12 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-10 justify-center">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 font-poppins underline decoration-4 underline-offset-8" style={{ textDecorationColor: config.primaryColor }}>Theory vs. Experience</span>
            </div>

            <div className="grid lg:grid-cols-[1fr_auto_1.5fr] gap-8 lg:gap-12 items-center">
              {/* Typical Learner Path */}
              <div className="opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <h3 className="text-center font-bold text-gray-700 mb-6 border-b border-gray-200 pb-3 uppercase tracking-widest text-[10px]">The Traditional Cycle</h3>
                <div className="flex justify-between items-center gap-2">
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-3 mx-auto border border-gray-100 shadow-sm">
                      <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-tighter">Learn Theory</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-3 mx-auto border border-gray-100 shadow-sm">
                      <FileEdit className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-tighter">Complete Courses</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-3 mx-auto border border-gray-100 shadow-sm">
                      <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-tighter">Apply as Fresher</p>
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="hidden lg:flex flex-col items-center justify-center h-full py-4">
                <div className="w-px h-full bg-gray-100"></div>
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-lg my-4 z-10 flex-shrink-0">
                  <span className="text-gray-600 text-[10px] font-black tracking-tighter uppercase font-poppins">VS</span>
                </div>
                <div className="w-px h-full bg-gray-100"></div>
              </div>
              <div className="flex lg:hidden items-center justify-center py-6">
                <div className="h-px w-full bg-gray-100"></div>
                <span className="absolute bg-white px-4 text-gray-600 text-[10px] font-black tracking-widest leading-none uppercase font-poppins">VS</span>
              </div>

              {/* Our Users Path */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/10 p-6 sm:p-10 rounded-3xl border border-blue-100 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
                <h3 className="text-center font-bold text-[#124fd6] mb-10 mt-2 border-b border-blue-100 pb-3 uppercase tracking-widest text-[10px]">RealTutorialHub Ecosystem</h3>
                <div className="flex justify-between items-center gap-2 relative z-10">
                  <div className="text-center flex-1 group/item">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl group-hover/item:scale-105 transition-all duration-300">
                      <FolderKanban className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                    </div>
                    <p className="text-[11px] sm:text-sm font-bold text-gray-900 leading-tight">System<br />Architecture</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-300 hidden sm:block" />
                  <div className="text-center flex-1 group/item">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#124fd6] to-blue-700 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl group-hover/item:scale-105 transition-all duration-300">
                      <Target className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                    </div>
                    <p className="text-[11px] sm:text-sm font-bold text-gray-900 leading-tight">Production<br />Delivery</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-300 hidden sm:block" />
                  <div className="text-center flex-1 group/item">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-2xl group-hover/item:scale-105 transition-all duration-300">
                      <Award className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                    </div>
                    <p className="text-[11px] sm:text-sm font-bold text-gray-900 leading-tight">Job-Ready<br />Portfolio</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-100 text-center font-bold text-base sm:text-lg text-gray-800">
              <span className="text-[#d03f00]">"</span>You don't start your career as a fresher â€” you start with experience.<span className="text-[#d03f00]">"</span>
            </div>
          </motion.div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 font-poppins">
          <motion.div initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose Your Learning Path</h2>
            <p className="text-xl text-gray-600">Start free, upgrade when you're ready</p>
          </motion.div>

          <motion.div initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-gray-200 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-300 relative">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Get started with basic features</p>
              <div className="text-5xl font-bold mb-6">â‚¹ 0<span className="text-lg text-gray-600">/mo</span></div>

              <ul className="space-y-3 mb-8">
                <PricingFeature text="Access to basic tutorials" included={true} />
                <PricingFeature text="Limited AI Tutor queries" included={true} />
                <PricingFeature text="Basic assignments" included={true} />
                <PricingFeature text="Community support" included={true} />
                <PricingFeature text="Real-world projects" included={false} />
                <PricingFeature text="Smart remediation" included={false} />
              </ul>

              <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-full hover:bg-gray-200 transition font-bold duration-300 hover:-translate-y-1">
                Get Started Free
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-[#124fd6] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#124fd6] -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(18,79,214,0.4)] transition-all duration-300 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 px-4 py-1.5 rounded-full text-xs font-black tracking-widest">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-purple-100 mb-6 font-medium">Full access to all features</p>
              <div className="text-5xl font-bold mb-6 font-poppins">â‚¹ 1000<span className="text-lg text-purple-100">/mo</span></div>

              <ul className="space-y-3 mb-8">
                <PricingFeature text="Unlimited tutorial access" included={true} white={true} />
                <PricingFeature text="Unlimited AI Tutor" included={true} white={true} />
                <PricingFeature text="All difficulty assignments" included={true} white={true} />
                <PricingFeature text="Priority support" included={true} white={true} />
                <PricingFeature text="Real-world projects" included={true} white={true} />
                <PricingFeature text="Smart remediation" included={true} white={true} />
              </ul>

              <Link href="/start-learning" className="w-full bg-white text-purple-800 py-4 rounded-full font-bold shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1">Start Learning Now</Link>
            </div>
          </motion.div>
        </section>

        {/* Testimonials Section */}
        <section id="stories" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 font-poppins">
          <motion.div initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Student Success Stories</h2>
            <p className="text-xl text-gray-600 font-medium">Real results from real learners</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8">
            <TestimonialCard
              direction="left" name="Sarah J." role="Software Engineer @ Google"
              image="ðŸ‘©â€ðŸ’»"
              text="RealTutorialHub's structured approach helped me land my dream job. The AI tutor was like having a personal mentor 24/7."
              rating={5}
            />
            <TestimonialCard
              direction="up" name="David K." role="Data Scientist"
              image="ðŸ‘¨â€ðŸ’¼"
              text="The remediation system identified my weak areas and created a perfect study plan. I improved faster than ever before."
              rating={5}
            />
            <TestimonialCard
              direction="right" name="Elena R." role="Full Stack Developer"
              image="ðŸ‘©â€ðŸŽ“"
              text="Real-world projects made all the difference. I built a portfolio that impressed every interviewer I met."
              rating={5}
            />
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="contact" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 font-poppins">
          <motion.div initial={{ y: 50 }} whileInView={{ y: 0 }} viewport={{ once: false, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="bg-[#124fd6] rounded-3xl p-8 lg:p-16 text-center text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Start Your Structured Learning Journey Today</h2>
            <p className="text-xl md:text-2xl mb-10 text-purple-100 font-medium opacity-90">Join thousands of learners achieving their goals with RealTutorialHub</p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/start-learning" className="bg-white text-[#d03f00] px-6 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg w-full sm:w-auto font-bold shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1">Start Learning Now</Link>
              <button className="bg-black/10 backdrop-blur-md text-white px-6 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg w-full sm:w-auto hover:bg-white/30 transition border-2 border-white font-bold duration-300 hover:-translate-y-1">
                View All Courses
              </button>
            </div>

            <div className="mt-16 flex items-center justify-center gap-10 flex-wrap text-sm font-bold uppercase tracking-widest opacity-80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-200" />
                <span>10,000+ Active Learners</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span>4.9/5 Average Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-200" />
                <span>500+ Projects Completed</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <motion.footer initial={{}} whileInView={{}} viewport={{ once: false }} transition={{ duration: 0.8 }} className="bg-white/80 backdrop-blur-md border-t border-gray-200 font-sans">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-4 gap-12">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.secondaryColor }}>
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-2xl tracking-tight font-poppins">{config.brandName}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed font-bold">
                  {config.footerDescription}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Product</h3>
                <ul className="space-y-3 text-gray-600 text-sm font-bold">
                  <li><a href="#solutions" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Solutions</a></li>
                  <li><a href="#journey" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Journey</a></li>
                  <li><a href="#process" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Process</a></li>
                  <li><a href="#projects" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Projects</a></li>
                  <li><a href="#mastery" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Mastery</a></li>
                  <li><a href="#stories" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Stories</a></li>
                  <li><a href="#pricing" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Pricing</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Company</h3>
                <ul className="space-y-3 text-gray-600 text-sm font-bold">
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>About Us</a></li>
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Blog</a></li>
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Careers</a></li>
                  <li><a href="#contact" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Contact</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Legal</h3>
                <ul className="space-y-3 text-gray-600 text-sm font-bold">
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Privacy Policy</a></li>
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Terms of Service</a></li>
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Cookie Policy</a></li>
                  <li><a href="#" className="hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={e => e.currentTarget.style.color = config.secondaryColor} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Security</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-12 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-gray-600 text-sm font-bold">{config.footerCopyright}</p>
              <div className="flex gap-6">
                <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}

// Helper Components
function FlowCard({ icon, title, color, colorStyle, direction = 'up' }: { icon: React.ReactNode; title: string; color?: string; colorStyle?: React.CSSProperties; direction?: 'up' | 'down' | 'left' | 'right' }) {
  const initial = direction === 'left' ? { x: -50 } : direction === 'right' ? { x: 50 } : direction === 'down' ? { y: -50 } : { y: 50 };
  const animate = { x: 0, y: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: false, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`${color || ''} text-white rounded-[2rem] p-8 w-40 text-center shadow-2xl hover:scale-105 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer border-t border-white/60`}
      style={colorStyle}
    >
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
    </motion.div>
  );
}

function Arrow({ className }: { className?: string }) {
  return <div className={className || "text-4xl text-purple-300 hidden lg:block opacity-50"}>â†’</div>;
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-4 text-lg font-bold">
      <div className="w-7 h-7 flex-shrink-0 text-blue-200">{icon}</div>
      <span className="opacity-90">{text}</span>
    </div>
  );
}

function ProjectCard({ icon, title, description, color, colorStyle, linkColor, direction = 'up' }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
  colorStyle?: React.CSSProperties;
  linkColor?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const initial = direction === 'left' ? { x: -50 } : direction === 'right' ? { x: 50 } : direction === 'down' ? { y: -50 } : { y: 50 };
  const animate = { x: 0, y: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: false, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl -translate-y-1 hover:-translate-y-3 transition-transform group cursor-pointer border-t border-white/60"
    >
      <div className={`w-20 h-20 ${color || ''} rounded-[1.5rem] flex items-center justify-center text-white mb-8 group-hover:rotate-12 transition-transform shadow-lg`} style={colorStyle}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-600 font-medium leading-relaxed">{description}</p>
      <div className="mt-8 flex items-center font-bold group-hover:translate-x-3 transition-transform" style={{ color: linkColor }}>
        View Projects <ArrowRight className="ml-3 w-6 h-6" />
      </div>
    </motion.div>
  );
}

function PricingFeature({ text, included, white }: { text: string; included: boolean; white?: boolean }) {
  return (
    <li className="flex items-center gap-4 text-lg font-bold tracking-tight">
      {included ? (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${white ? 'bg-white/20' : 'bg-green-100'}`}>
          <Check className={`w-3.5 h-3.5 ${white ? 'text-white' : 'text-green-800'}`} />
        </div>
      ) : (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${white ? 'bg-purple-300/30' : 'bg-gray-100'}`}>
          <X className={`w-3.5 h-3.5 ${white ? 'text-purple-200' : 'text-gray-600'}`} />
        </div>
      )}
      <span className={white ? 'text-white' : 'text-gray-700'}>{text}</span>
    </li>
  );
}

function TestimonialCard({ name, role, image, text, rating, direction = 'up' }: {
  name: string;
  role: string;
  image: string;
  text: string;
  rating: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const initial = direction === 'left' ? { x: -50 } : direction === 'right' ? { x: 50 } : direction === 'down' ? { y: -50 } : { y: 50 };
  const animate = { x: 0, y: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: false, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform relative overflow-hidden group"
    >
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition">
          {image}
        </div>
        <div>
          <h3 className="font-bold text-xl">{name}</h3>
          <p className="text-sm font-bold text-[#124fd6] uppercase tracking-widest">{role}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-6">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-600 text-lg font-medium italic leading-relaxed">"{text}"</p>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-50 rounded-full opacity-30"></div>
    </motion.div>
  );
}

function ComparisonRow({ label, us, competitor1, competitor2 }: {
  label: string;
  us: boolean;
  competitor1: boolean;
  competitor2: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 hover:bg-gray-50 transition rounded-lg px-0 sm:px-2 group gap-1 sm:gap-2">
      <span className="text-xs sm:text-sm font-bold text-gray-600 group-hover:text-gray-900 transition flex-1 leading-tight pr-2">{label}</span>
      <div className="flex gap-3 sm:gap-8 shrink-0">
        <div className="w-10 sm:w-16 flex justify-center shrink-0">
          {us ? <div className="w-5 h-5 sm:w-6 h-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center"><Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-800" /></div> : <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-100" />}
        </div>
        <div className="w-10 sm:w-16 flex justify-center shrink-0">
          {competitor1 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-800 opacity-50" /> : <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />}
        </div>
        <div className="w-10 sm:w-16 flex justify-center shrink-0">
          {competitor2 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-800 opacity-50" /> : <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />}
        </div>
      </div>
    </div>
  );
}







